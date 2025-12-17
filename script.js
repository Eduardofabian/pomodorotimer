// Global Variables
let timeLeft = 25 * 60; 
let endTime; 
let timerInterval;
let currentInterval = 'pomodoro';
let pomodoroCount = 0; 
let isRinging = false; 

// Preferências
let brownNoiseEnabled = false;
let brownNoiseVolume = 0.5; // Começa na metade (ajustável)
let backgroundColor = '#F1F1EF';
let fontColor = '#37352F';

// --- AUDIO ENGINE ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let brownNoiseNode = null;
let alarmOscillator = null;
let alarmInterval = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// 1. Gerador de Brown Noise Ajustável
function createBrownNoise() {
  const bufferSize = audioCtx.sampleRate * 2; 
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5; 
  }

  const noiseSrc = audioCtx.createBufferSource();
  noiseSrc.buffer = buffer;
  noiseSrc.loop = true;
  
  const gainNode = audioCtx.createGain();
  // Usa o volume definido pelo slider
  gainNode.gain.value = brownNoiseVolume; 
  
  noiseSrc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  return { source: noiseSrc, gain: gainNode };
}

function toggleBrownNoise(shouldPlay) {
  initAudio(); 
  
  if (brownNoiseNode) {
    try { brownNoiseNode.source.stop(); } catch(e){}
    brownNoiseNode.source.disconnect();
    brownNoiseNode.gain.disconnect();
    brownNoiseNode = null;
  }

  if (shouldPlay && currentInterval === 'pomodoro' && brownNoiseEnabled && !isRinging) {
    brownNoiseNode = createBrownNoise();
    brownNoiseNode.source.start(0);
  }
}

// Atualiza volume em tempo real (enquanto mexe no slider)
function updateVolumeRealTime(val) {
  brownNoiseVolume = val;
  if (brownNoiseNode) {
    brownNoiseNode.gain.gain.setValueAtTime(val, audioCtx.currentTime);
  }
}

// 2. Gerador de Alarme
function playAlarmBeep() {
  initAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'square'; 
  osc.frequency.setValueAtTime(880, audioCtx.currentTime); 
  osc.frequency.setValueAtTime(1760, audioCtx.currentTime + 0.1); 
  
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.6);
}

function startAlarmLoop() {
  if (isRinging) return; 
  isRinging = true;
  playAlarmBeep();
  alarmInterval = setInterval(() => {
    playAlarmBeep();
  }, 1000);
}

function stopAlarmLoop() {
  isRinging = false;
  clearInterval(alarmInterval);
  document.body.classList.remove('alarm-flashing');
  startStopBtn.textContent = 'Start';
}

// --- DOM ELEMENTS ---
const timeLeftEl = document.getElementById('time-left');
const startStopBtn = document.getElementById('start-stop-btn');
const resetBtn = document.getElementById('reset-btn');
const intervalBtns = {
  pomodoro: document.getElementById('pomodoro-interval-btn'),
  short: document.getElementById('short-break-interval-btn'),
  long: document.getElementById('long-break-interval-btn')
};
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModalBtn = document.querySelector('.close-btn');
const saveBtn = document.getElementById('save-btn');
const inputs = {
  bg: document.getElementById('background-color'),
  font: document.getElementById('font-color'),
  noise: document.getElementById('brown-noise-toggle'),
  volume: document.getElementById('volume-slider') // Novo input
};

// --- LOGIC ---
function switchMode(mode) {
  currentInterval = mode;
  toggleBrownNoise(false); 
  stopAlarmLoop();
  
  if (mode === 'pomodoro') timeLeft = 25 * 60;
  else if (mode === 'short-break') timeLeft = 5 * 60;
  else if (mode === 'long-break') timeLeft = 10 * 60;
  
  updateDisplay();
}

intervalBtns.pomodoro.addEventListener('click', () => { stopTimer(); switchMode('pomodoro'); });
intervalBtns.short.addEventListener('click', () => { stopTimer(); switchMode('short-break'); });
intervalBtns.long.addEventListener('click', () => { stopTimer(); switchMode('long-break'); });

startStopBtn.addEventListener('click', () => {
  initAudio(); 

  if (isRinging) {
    stopAlarmLoop();
    if (currentInterval === 'pomodoro') {
      pomodoroCount++;
      if (pomodoroCount % 2 === 0) switchMode('long-break');
      else switchMode('short-break');
    } else {
      switchMode('pomodoro');
    }
    return;
  }

  if (timerInterval) {
    stopTimer();
    startStopBtn.textContent = 'Start';
    toggleBrownNoise(false);
  } else {
    startTimer();
    startStopBtn.textContent = 'Pause';
    toggleBrownNoise(true);
  }
});

resetBtn.addEventListener('click', () => {
  stopTimer();
  stopAlarmLoop();
  pomodoroCount = 0;
  switchMode('pomodoro');
  startStopBtn.textContent = 'Start';
});

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  endTime = Date.now() + (timeLeft * 1000);
  
  timerInterval = setInterval(() => {
    const remaining = Math.ceil((endTime - Date.now()) / 1000);
    timeLeft = remaining;
    
    if (timeLeft >= 0) {
      updateDisplay();
    } else {
      stopTimer();
      timeLeft = 0;
      updateDisplay();
      startStopBtn.textContent = 'STOP ALARM';
      document.body.classList.add('alarm-flashing');
      toggleBrownNoise(false); 
      startAlarmLoop(); 
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function updateDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  timeLeftEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  document.title = `${timeLeftEl.textContent} - Pomodoro`;
}

// Settings Modal Events
settingsBtn.addEventListener('click', () => {
  inputs.bg.value = backgroundColor;
  inputs.font.value = fontColor;
  inputs.noise.checked = brownNoiseEnabled;
  inputs.volume.value = brownNoiseVolume; // Carrega posição do slider
  
  // Se o ruído estiver tocando, permitimos "preview" ao mexer no modal
  // Se não estiver, tocamos um pouquinho? Não, melhor só ajustar se já estiver ligado.
  settingsModal.style.display = 'flex';
});

// Listener para o Slider (Tempo real)
inputs.volume.addEventListener('input', (e) => {
  updateVolumeRealTime(e.target.value);
});

closeModalBtn.addEventListener('click', () => { settingsModal.style.display = 'none'; });

saveBtn.addEventListener('click', () => {
  backgroundColor = inputs.bg.value;
  fontColor = inputs.font.value;
  brownNoiseEnabled = inputs.noise.checked;
  brownNoiseVolume = inputs.volume.value;
  
  localStorage.setItem('pomodoroConfig', JSON.stringify({
    bg: backgroundColor,
    font: fontColor,
    noise: brownNoiseEnabled,
    volume: brownNoiseVolume
  }));
  
  applyPreferences();
  settingsModal.style.display = 'none';
});

function applyPreferences() {
  const saved = JSON.parse(localStorage.getItem('pomodoroConfig'));
  if (saved) {
    backgroundColor = saved.bg;
    fontColor = saved.font;
    brownNoiseEnabled = saved.noise;
    if (saved.volume !== undefined) brownNoiseVolume = saved.volume;
  }
  
  document.body.style.backgroundColor = backgroundColor;
  document.body.style.color = fontColor;
  
  const buttons = document.querySelectorAll('button, .interval-btn');
  buttons.forEach(btn => {
    btn.style.borderColor = fontColor;
    btn.style.color = fontColor;
  });
  
  // Atualiza som se estiver rodando
  if (timerInterval && currentInterval === 'pomodoro') {
    toggleBrownNoise(true);
  }
}

// Init
applyPreferences();
updateDisplay();
