// Global Variables
let timeLeft = 25 * 60; 
let endTime; 
let timerInterval;
let currentInterval = 'pomodoro';
let pomodoroCount = 0; 
let isRinging = false; 

// Preferências
let brownNoiseEnabled = false;
let backgroundColor = '#F1F1EF';
let fontColor = '#37352F';

// --- AUDIO ENGINE (Sintetizador Web Audio API) ---
// Resolve problema de CORS e Notion bloqueando arquivos externos
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

// 1. Gerador de Brown Noise (Ruído Marrom)
function createBrownNoise() {
  const bufferSize = audioCtx.sampleRate * 2; // 2 segundos de buffer
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5; // Compensa volume
  }

  const noiseSrc = audioCtx.createBufferSource();
  noiseSrc.buffer = buffer;
  noiseSrc.loop = true;
  
  // Controle de Volume Suave
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.15; // Volume confortável (Marrom é grave/forte)
  
  noiseSrc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  return { source: noiseSrc, gain: gainNode };
}

function toggleBrownNoise(shouldPlay) {
  initAudio(); // Garante que o audio context existe
  
  // Parar som existente se houver
  if (brownNoiseNode) {
    try { brownNoiseNode.source.stop(); } catch(e){}
    brownNoiseNode.source.disconnect();
    brownNoiseNode.gain.disconnect();
    brownNoiseNode = null;
  }

  // Tocar novo som se for apropriado
  if (shouldPlay && currentInterval === 'pomodoro' && brownNoiseEnabled && !isRinging) {
    brownNoiseNode = createBrownNoise();
    brownNoiseNode.source.start(0);
  }
}

// 2. Gerador de Alarme (Bip Digital)
function playAlarmBeep() {
  initAudio();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'square'; // Som estilo relógio digital antigo
  osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
  osc.frequency.setValueAtTime(1760, audioCtx.currentTime + 0.1); // Oitava acima (pi-PÍ!)
  
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.6);
}

function startAlarmLoop() {
  if (isRinging) return; // Já está tocando
  isRinging = true;
  
  // Toca o primeiro imediatamente
  playAlarmBeep();
  
  // Repete a cada 1 segundo
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

// --- DOM ELEMENTS & SETUP ---
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
  noise: document.getElementById('brown-noise-toggle')
};

// --- LOGIC ---

function switchMode(mode) {
  currentInterval = mode;
  toggleBrownNoise(false); // Para ruído ao trocar
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
  initAudio(); // Importante: desbloqueia audio no primeiro clique

  if (isRinging) {
    stopAlarmLoop();
    // Prepara próximo ciclo automaticamente (mas não inicia)
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
    // Está rodando, vamos pausar
    stopTimer();
    startStopBtn.textContent = 'Start';
    toggleBrownNoise(false);
  } else {
    // Está parado, vamos iniciar
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

// Timer Core
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  endTime = Date.now() + (timeLeft * 1000);
  
  timerInterval = setInterval(() => {
    const remaining = Math.ceil((endTime - Date.now()) / 1000);
    timeLeft = remaining;
    
    if (timeLeft >= 0) {
      updateDisplay();
    } else {
      // TEMPO ACABOU
      stopTimer();
      timeLeft = 0;
      updateDisplay();
      
      startStopBtn.textContent = 'STOP ALARM';
      document.body.classList.add('alarm-flashing');
      toggleBrownNoise(false); // Para o ruído de fundo
      startAlarmLoop(); // Inicia o bip bip
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

// Settings Modal
settingsBtn.addEventListener('click', () => {
  inputs.bg.value = backgroundColor;
  inputs.font.value = fontColor;
  inputs.noise.checked = brownNoiseEnabled;
  settingsModal.style.display = 'flex';
});
closeModalBtn.addEventListener('click', () => { settingsModal.style.display = 'none'; });
saveBtn.addEventListener('click', () => {
  backgroundColor = inputs.bg.value;
  fontColor = inputs.font.value;
  brownNoiseEnabled = inputs.noise.checked;
  
  localStorage.setItem('pomodoroConfig', JSON.stringify({
    bg: backgroundColor,
    font: fontColor,
    noise: brownNoiseEnabled
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
  }
  
  document.body.style.backgroundColor = backgroundColor;
  document.body.style.color = fontColor;
  
  // Atualiza cores dos botões
  const buttons = document.querySelectorAll('button, .interval-btn');
  buttons.forEach(btn => {
    btn.style.borderColor = fontColor;
    btn.style.color = fontColor;
  });
  
  // Se mudar settings enquanto roda, ajusta som
  if (timerInterval && currentInterval === 'pomodoro') {
    toggleBrownNoise(true);
  }
}

// Init
applyPreferences();
updateDisplay();
