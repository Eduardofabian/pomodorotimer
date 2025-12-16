// Global variables
let timeLeft = 25 * 60; 
let endTime; 
let timerInterval;
let currentInterval = 'pomodoro';
let pomodoroCount = 0; 
let isRinging = false; 
let audioUnlocked = false; 

// Preferências do Usuário
let backgroundColor = '#F1F1EF'; 
let fontColor = '#37352F'; 
let brownNoiseEnabled = false; // Começa desligado por padrão, usuário ativa se quiser

// --- SONS ---
// 1. Alarme (Digital Clock)
const alarmSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
alarmSound.loop = true; 

// 2. Brown Noise (Ruído Marrom) - Arquivo confiável da Wikimedia
const brownNoise = new Audio('https://upload.wikimedia.org/wikipedia/commons/e/e3/Brown_noise.ogg');
brownNoise.loop = true; 
brownNoise.volume = 0.6; // Volume agradável (60%)

// DOM elements
const timeLeftEl = document.getElementById('time-left');
const startStopBtn = document.getElementById('start-stop-btn');
const resetBtn = document.getElementById('reset-btn');
const pomodoroIntervalBtn = document.getElementById('pomodoro-interval-btn');
const shortBreakIntervalBtn = document.getElementById('short-break-interval-btn');
const longBreakIntervalBtn = document.getElementById('long-break-interval-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModalBtn = document.querySelector('.close-btn');
const backgroundColorSelect = document.getElementById('background-color');
const fontColorSelect = document.getElementById('font-color');
const brownNoiseToggle = document.getElementById('brown-noise-toggle'); // Checkbox novo
const saveBtn = document.getElementById('save-btn');

// --- HACK: Desbloquear Áudio (Navegadores) ---
function unlockAudio() {
  if (!audioUnlocked) {
    // Toca mudo rapidinho pra liberar permissão
    alarmSound.volume = 0;
    brownNoise.volume = 0;
    
    Promise.all([alarmSound.play(), brownNoise.play()]).then(() => {
      alarmSound.pause();
      brownNoise.pause();
      alarmSound.currentTime = 0;
      brownNoise.currentTime = 0;
      
      // Restaura volumes originais
      alarmSound.volume = 1; 
      brownNoise.volume = 0.6;
      audioUnlocked = true;
    }).catch(e => console.log("Erro ao desbloquear áudio:", e));
  }
}

// --- CONTROLE DO BROWN NOISE ---
function toggleBrownNoise(shouldPlay) {
  // Só toca se: tiver pedido play E o modo for Pomodoro E a opção estiver ativa
  if (shouldPlay && currentInterval === 'pomodoro' && brownNoiseEnabled) {
    brownNoise.play().catch(e => console.log("Erro audio:", e));
  } else {
    brownNoise.pause();
  }
}

function stopAlarm() {
  alarmSound.pause();
  alarmSound.currentTime = 0; 
  isRinging = false;
  startStopBtn.textContent = 'Start';
  document.body.classList.remove('alarm-flashing');
}

function switchMode(mode) {
  currentInterval = mode;
  // Se mudar de modo, para o Brown Noise imediatamente
  toggleBrownNoise(false);

  if (mode === 'pomodoro') {
    timeLeft = 25 * 60;
  } else if (mode === 'short-break') {
    timeLeft = 5 * 60;
  } else if (mode === 'long-break') {
    timeLeft = 10 * 60; 
  }
  updateTimeLeftTextContent();
}

// Event listeners de Intervalos
pomodoroIntervalBtn.addEventListener('click', () => { stopTimer(); stopAlarm(); switchMode('pomodoro'); });
shortBreakIntervalBtn.addEventListener('click', () => { stopTimer(); stopAlarm(); switchMode('short-break'); });
longBreakIntervalBtn.addEventListener('click', () => { stopTimer(); stopAlarm(); switchMode('long-break'); });

// --- LÓGICA START/STOP ---
startStopBtn.addEventListener('click', () => {
  unlockAudio(); 

  if (isRinging) {
    stopAlarm();
    return; 
  }

  if (startStopBtn.textContent === 'Start') {
    startTimer();
    startStopBtn.textContent = 'Pause';
    // Tenta ligar o Brown Noise se estiver no modo foco
    toggleBrownNoise(true);
  } else {
    stopTimer();
    startStopBtn.textContent = 'Start';
    // Pausa o Brown Noise
    toggleBrownNoise(false);
  }
});

resetBtn.addEventListener('click', () => {
  stopTimer();
  stopAlarm();
  toggleBrownNoise(false);
  pomodoroCount = 0; 
  switchMode('pomodoro');
  startStopBtn.textContent = 'Start';
});

// --- SETTINGS ---
settingsBtn.addEventListener('click', () => { 
  // Carrega estado atual do checkbox ao abrir
  brownNoiseToggle.checked = brownNoiseEnabled;
  settingsModal.style.display = 'flex'; 
});

closeModalBtn.addEventListener('click', () => { settingsModal.style.display = 'none'; });

saveBtn.addEventListener('click', () => {
  localStorage.setItem('backgroundColor', backgroundColorSelect.value);
  localStorage.setItem('fontColor', fontColorSelect.value);
  // Salva preferência do Brown Noise (true/false)
  localStorage.setItem('brownNoiseEnabled', brownNoiseToggle.checked);
  
  applyUserPreferences();
  settingsModal.style.display = 'none';
});

// --- TIMER LOGIC ---
function startTimer() {
  clearInterval(timerInterval); 
  endTime = Date.now() + (timeLeft * 1000);

  timerInterval = setInterval(() => {
    const secondsRemaining = Math.ceil((endTime - Date.now()) / 1000);
    timeLeft = secondsRemaining;

    if (timeLeft >= 0) {
        updateTimeLeftTextContent();
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval); 
      timeLeft = 0; 
      updateTimeLeftTextContent();

      // PARAR Brown Noise, TOCAR Alarme
      toggleBrownNoise(false);
      
      isRinging = true;
      startStopBtn.textContent = 'STOP ALARM'; 
      alarmSound.play();
      document.body.classList.add('alarm-flashing');

      // Prepara próximo ciclo
      if (currentInterval === 'pomodoro') {
        pomodoroCount++;
        if (pomodoroCount % 2 === 0) {
          switchMode('long-break'); 
        } else {
          switchMode('short-break');
        }
      } else {
        switchMode('pomodoro');
      }
    }
  }, 1000); 
}

function stopTimer() {
  clearInterval(timerInterval);
  toggleBrownNoise(false); // Garante que para o ruído ao pausar
}

function updateTimeLeftTextContent() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timeLeftEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function applyUserPreferences() {
  const savedBackgroundColor = localStorage.getItem('backgroundColor');
  const savedFontColor = localStorage.getItem('fontColor');
  const savedBrownNoise = localStorage.getItem('brownNoiseEnabled');

  if (savedBackgroundColor) backgroundColor = savedBackgroundColor;
  if (savedFontColor) fontColor = savedFontColor;
  
  // Converte string 'true'/'false' do localStorage para boolean real
  if (savedBrownNoise !== null) {
    brownNoiseEnabled = (savedBrownNoise === 'true');
  }

  document.body.style.backgroundColor = backgroundColor;
  document.body.style.color = fontColor;
  timeLeftEl.style.color = fontColor;
  
  const buttons = document.querySelectorAll('.interval-btn, #start-stop-btn, #reset-btn, #settings-btn');
  buttons.forEach((button) => {
    button.style.color = fontColor;
    button.style.backgroundColor = backgroundColor;
    button.style.borderColor = fontColor;
  });
}

applyUserPreferences();
