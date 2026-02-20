// Global Variables
let timeLeft = 25 * 60; 
let timerInterval;
let currentInterval = 'pomodoro';
let pomodoroCount = 0; 
let isRinging = false; 
let isCountdown = true; // Define se é Regressivo (true) ou Progressivo (false)

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

function updateVolumeRealTime(val) {
  brownNoiseVolume = val;
  if (brownNoiseNode) brownNoiseNode.gain.gain.setValueAtTime(val, audioCtx.currentTime);
}

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
  const m = Math.floor(Math.abs(timeLeft) / 60);
  const s = Math.abs(timeLeft) % 60;
  timeLeftEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  document.title = `${timeLeftEl.textContent} - Pomodoro`;
}

function switchMode(mode) {
  currentInterval = mode;
  toggleBrownNoise(false); 
  stopAlarmLoop();
  
  let baseTime = 25;
  if (mode === 'short-break') baseTime = 5;
  else if (mode === 'long-break') baseTime = 10;

  timeLeft = isCountdown ? baseTime * 60 : 0;
  updateDisplay();
}

// Alternar entre Timer e Cronômetro
modeToggleBtn.addEventListener('click', () => {
  if (timerInterval) return; // Bloqueia troca enquanto roda
  isCountdown = !isCountdown;
  
  if (isCountdown) {
    modeToggleBtn.innerHTML = '<i class="fas fa-history"></i>';
    switchMode(currentInterval);
  } else {
    modeToggleBtn.innerHTML = '<i class="fas fa-stopwatch"></i>';
    timeLeft = 0;
  }
  updateDisplay();
});

intervalBtns.pomodoro.addEventListener('click', () => { stopTimer(); switchMode('pomodoro'); });
intervalBtns.short.addEventListener('click', () => { stopTimer(); switchMode('short-break'); });
intervalBtns.long.addEventListener('click', () => { stopTimer(); switchMode('long-break'); });

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
  stopTimer();
  stopAlarmLoop();
  pomodoroCount = 0;
  switchMode(currentInterval);
  startStopBtn.textContent = 'Start';
});

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  
  // Define o alvo baseado no modo atual para o alarme saber quando tocar
  const target = (currentInterval === 'pomodoro' ? 25 : currentInterval === 'short-break' ? 5 : 10) * 60;

  timerInterval = setInterval(() => {
    if (isCountdown) {
      timeLeft--;
      if (timeLeft <= 0) finishSession();
    } else {
      timeLeft++;
      if (timeLeft >= target) finishSession();
    }
    updateDisplay();
  }, 1000);
}

function finishSession() {
  stopTimer();
  updateDisplay();
  startStopBtn.textContent = 'STOP ALARM';
  document.body.classList.add('alarm-flashing');
  toggleBrownNoise(false); 
  startAlarmLoop(); 
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

// Settings Modal
settingsBtn.addEventListener('click', () => {
  inputs.bg.value = backgroundColor;
  inputs.font.value = fontColor;
  inputs.noise.checked = brownNoiseEnabled;
  inputs.volume.value = brownNoiseVolume;
  settingsModal.style.display = 'flex';
});

inputs.volume.addEventListener('input', (e) => updateVolumeRealTime(e.target.value));
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
    brownNoiseEnabled = saved.noise; brownNoiseVolume = saved.volume || 0.5;
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
