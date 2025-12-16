// Global variables
let timeLeft = 25 * 60; 
let endTime; 
let timerInterval;
let currentInterval = 'pomodoro';
let pomodoroCount = 0; 
let isRinging = false; 
let audioUnlocked = false; 
let backgroundColor = '#F1F1EF'; 
let fontColor = '#37352F'; 

// --- SOM MAIS ALTO (Digital Alarm Clock) ---
// Esse som é mais agudo e perceptível que o beep anterior
const alarmSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
alarmSound.loop = true; 

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
const saveBtn = document.getElementById('save-btn');

// --- HACK PARA O NOTION: Desbloquear Áudio ---
function unlockAudio() {
  if (!audioUnlocked) {
    alarmSound.volume = 0;
    alarmSound.play().then(() => {
      alarmSound.pause();
      alarmSound.currentTime = 0;
      alarmSound.volume = 1; // Garante volume máximo
      audioUnlocked = true;
    }).catch(e => console.log("Erro ao desbloquear áudio:", e));
  }
}

// --- Função para parar o som e o visual ---
function stopAlarm() {
  alarmSound.pause();
  alarmSound.currentTime = 0; 
  isRinging = false;
  startStopBtn.textContent = 'Start';
  
  // REMOVE O PISCA-PISCA
  document.body.classList.remove('alarm-flashing');
}

// --- Função para trocar o modo ---
function switchMode(mode) {
  currentInterval = mode;
  if (mode === 'pomodoro') {
    timeLeft = 25 * 60;
  } else if (mode === 'short-break') {
    timeLeft = 5 * 60;
  } else if (mode === 'long-break') {
    timeLeft = 10 * 60; 
  }
  updateTimeLeftTextContent();
}

// Event listeners for interval buttons
pomodoroIntervalBtn.addEventListener('click', () => {
  stopTimer();
  stopAlarm(); 
  switchMode('pomodoro');
});

shortBreakIntervalBtn.addEventListener('click', () => {
  stopTimer();
  stopAlarm();
  switchMode('short-break');
});

longBreakIntervalBtn.addEventListener('click', () => {
  stopTimer();
  stopAlarm();
  switchMode('long-break');
});

// --- LÓGICA PRINCIPAL DO BOTÃO START/STOP/ALARM ---
startStopBtn.addEventListener('click', () => {
  unlockAudio(); 

  if (isRinging) {
    stopAlarm();
    return; 
  }

  if (startStopBtn.textContent === 'Start') {
    startTimer();
    startStopBtn.textContent = 'Pause';
  } else {
    stopTimer();
    startStopBtn.textContent = 'Start';
  }
});

resetBtn.addEventListener('click', () => {
  stopTimer();
  stopAlarm();
  pomodoroCount = 0; 
  switchMode('pomodoro');
  startStopBtn.textContent = 'Start';
});

// Settings Modal
settingsBtn.addEventListener('click', () => { settingsModal.style.display = 'flex'; });
closeModalBtn.addEventListener('click', () => { settingsModal.style.display = 'none'; });
saveBtn.addEventListener('click', () => {
  localStorage.setItem('backgroundColor', backgroundColorSelect.value);
  localStorage.setItem('fontColor', fontColorSelect.value);
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

      // DISPARAR ALARME E VISUAL
      isRinging = true;
      startStopBtn.textContent = 'STOP ALARM'; 
      
      // 1. Toca o som novo (mais alto)
      alarmSound.play().catch(e => console.log("O navegador bloqueou o som:", e)); 
      
      // 2. Ativa o modo PISCAR TELA VERMELHA
      document.body.classList.add('alarm-flashing');

      // Lógica de próximo ciclo (já prepara o tempo para quando você clicar STOP)
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
}

function updateTimeLeftTextContent() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timeLeftEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function applyUserPreferences() {
  const savedBackgroundColor = localStorage.getItem('backgroundColor');
  const savedFontColor = localStorage.getItem('fontColor');
  if (savedBackgroundColor) backgroundColor = savedBackgroundColor;
  if (savedFontColor) fontColor = savedFontColor;

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
