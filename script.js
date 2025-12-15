// Global variables
let timeLeft = 25 * 60; 
let timerInterval;
let currentInterval = 'pomodoro';
let pomodoroCount = 0; 
let isRinging = false; // NOVA VARIAVEL: Controla se o alarme está tocando
let backgroundColor = '#F1F1EF'; 
let fontColor = '#37352F'; 

// Som do Alarme
const alarmSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
alarmSound.loop = true; // NOVO: O som vai repetir infinitamente até você parar

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

// --- Função para parar o som ---
function stopAlarm() {
  alarmSound.pause();
  alarmSound.currentTime = 0; // Reinicia o áudio para o começo
  isRinging = false;
  startStopBtn.textContent = 'Start'; // Volta o botão ao normal
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
  stopAlarm(); // Garante que o som pare se mudar de aba
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
  // Cenario 1: O alarme está tocando. O clique serve para CALAR a boca dele.
  if (isRinging) {
    stopAlarm();
    return; // Para a execução aqui, não inicia o timer ainda
  }

  // Cenario 2: Timer normal
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

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimeLeftTextContent();

    // Quando o tempo acaba
    if (timeLeft < 0) {
      clearInterval(timerInterval); // Para o cronômetro
      
      // 1. Ativa o Modo "Tocando Alarme"
      isRinging = true;
      alarmSound.play(); 
      startStopBtn.textContent = 'STOP ALARM'; // Muda o texto do botão para avisar
      
      // 2. Já prepara o próximo tempo no fundo (mas não inicia)
      if (currentInterval === 'pomodoro') {
        pomodoroCount++;
        console.log(`Pomodoros: ${pomodoroCount}`);
        
        if (pomodoroCount % 2 === 0) {
          switchMode('long-break'); 
        } else {
          switchMode('short-break');
        }
      } else {
        switchMode('pomodoro');
      }
      // Nota: O tempo na tela já mudou para o próximo (ex: 05:00), 
      // mas o alarme continua tocando até você clicar em "STOP ALARM".
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
