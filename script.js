// Global Variables
let timeLeft = 25 * 60; 
let timerInterval = null;
let currentInterval = 'pomodoro';
let pomodoroCount = 0; 
let isRinging = false; 
let isCountdown = true; // true = 25->0 | false = 0->25

// Preferências
let brownNoiseEnabled = false;
let brownNoiseVolume = 0.5;
let backgroundColor = '#F1F1EF';
let fontColor = '#37352F';

// --- AUDIO ENGINE ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let brownNoiseNode = null;
let alarmInterval = null;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

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

function playAlarmBeep() {
  initAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square'; 
  osc.frequency.setValueAtTime(880, audioCtx.currentTime); 
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
  alarmInterval = setInterval(() => playAlarmBeep(), 1000);
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
const modeToggleBtn = document.getElementById('mode-toggle-btn');
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
  volume: document.getElementById('volume-slider')
};

// --- LOGIC ---
function updateDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  timeLeftEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  document.title = `${timeLeftEl.textContent} - Pomodoro`;
}

function switchMode(mode) {
  currentInterval = mode;
  stopTimer();
  stopAlarmLoop();
  toggleBrownNoise(false);

  let baseMinutes = 25;
  if (mode === 'short-break') baseMinutes = 5;
  if (mode === 'long-break') baseMinutes = 10;

  // SE for contagem regressiva, começa no tempo cheio. SE for cronômetro, começa em 0.
  timeLeft = isCountdown ? (baseMinutes * 60) : 0;
  
  updateDisplay();
}

// BOTÃO DE ALTERNAR MODO (Timer vs Cronômetro)
modeToggleBtn.addEventListener('click', () => {
  if (timerInterval) return; // Não muda enquanto estiver rodando
  
  isCountdown = !isCountdown;
  
  if (isCountdown) {
    modeToggleBtn.innerHTML = '<i class="fas fa-history"></i>'; // Ícone Timer
  } else {
    modeToggleBtn.innerHTML = '<i class="fas fa-stopwatch"></i>'; // Ícone Cronômetro
  }
  
  // Força o reset do tempo para o novo modo
  switchMode(currentInterval);
});

intervalBtns.pomodoro.addEventListener('click', () => switchMode('pomodoro'));
intervalBtns.short.addEventListener('click', () => switchMode('short-break'));
intervalBtns.long.addEventListener('click', () => switchMode('long-break'));

startStopBtn.addEventListener('click', () => {
  initAudio(); 
  if (isRinging) {
    stopAlarmLoop();
    if (currentInterval === 'pomodoro') {
      pomodoroCount++;
      switchMode(pomodoroCount % 2 === 0 ? 'long-break' : 'short-break');
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
  switchMode(currentInterval);
  startStopBtn.textContent = 'Start';
});

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  
  // O limite (alvo) é sempre o tempo definido para o intervalo atual
  const limit = (currentInterval === 'pomodoro' ? 25 : currentInterval === 'short-break' ? 5 : 10) * 60;

  timerInterval = setInterval(() => {
    if (isCountdown) {
      timeLeft--;
      if (timeLeft <= 0) finishSession();
    } else {
      timeLeft++;
      if (timeLeft >= limit) finishSession();
    }
    updateDisplay();
  }, 1000);
}

function finishSession() {
  stopTimer();
  startStopBtn.textContent = 'STOP ALARM';
  document.body.classList.add('alarm-flashing');
  toggleBrownNoise(false); 
  startAlarmLoop(); 
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

// Configurações
settingsBtn.addEventListener('click', () => {
  inputs.bg.value = backgroundColor;
  inputs.font.value = fontColor;
  inputs.noise.checked = brownNoiseEnabled;
  inputs.volume.value = brownNoiseVolume;
  settingsModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => settingsModal.style.display = 'none');

saveBtn.addEventListener('click', () => {
  backgroundColor = inputs.bg.value;
  fontColor = inputs.font.value;
  brownNoiseEnabled = inputs.noise.checked;
  brownNoiseVolume = inputs.volume.value;
  localStorage.setItem('pomodoroConfig', JSON.stringify({
    bg: backgroundColor, font: fontColor, noise: brownNoiseEnabled, volume: brownNoiseVolume
  }));
  applyPreferences();
  settingsModal.style.display = 'none';
});

function applyPreferences() {
  const saved = JSON.parse(localStorage.getItem('pomodoroConfig'));
  if (saved) {
    backgroundColor = saved.bg; fontColor = saved.font;
    brownNoiseEnabled = saved.noise; brownNoiseVolume = saved.volume;
  }
  document.body.style.backgroundColor = backgroundColor;
  document.body.style.color = fontColor;
  document.querySelectorAll('button, .interval-btn').forEach(btn => {
    btn.style.borderColor = fontColor;
    btn.style.color = fontColor;
  });
}

applyPreferences();
updateDisplay();
