// Global variables
let timeLeft = 25 * 60; 
let endTime; // NOVO: Guarda a hora exata que vai acabar
let timerInterval;
let currentInterval = 'pomodoro';
let pomodoroCount = 0; 
let isRinging = false; 
let audioUnlocked = false; 
let backgroundColor = '#F1F1EF'; 
let fontColor = '#37352F'; 

// Som do Alarme
const alarmSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
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
      alarmSound.volume = 1; 
      audioUnlocked = true;
    }).catch(e => console.log("Erro ao desbloquear áudio:", e));
  }
}

// --- Função para parar o som ---
function stopAlarm() {
  alarmSound.pause();
  alarmSound.currentTime = 0; 
  isRinging = false;
  startStopBtn.textContent = 'Start'; 
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
  unlockAudio(); // Tenta desbloquear no clique

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

// --- TIMER LOGIC (CORRIGIDA COM DATE.NOW) ---
function startTimer() {
  clearInterval(timerInterval); 
  
  // Define o momento exato no futuro em que o tempo acaba
  // Date.now() é em milissegundos, então multiplicamos timeLeft * 1000
  endTime = Date.now() + (timeLeft * 1000);

  timerInterval = setInterval(() => {
    // Calcula quanto tempo falta comparando o AGORA com o ENDTIME
    const secondsRemaining = Math.ceil((endTime - Date.now()) / 1000);
    
    // Atualizamos a variável global visualmente
    timeLeft = secondsRemaining;

    if (timeLeft >= 0) {
        updateTimeLeftTextContent();
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval); 
      timeLeft = 0; // Garante que fique em 0 visualmente
      updateTimeLeftTextContent();

      isRinging = true;
      alarmSound.play().catch(e => console.log("O navegador bloqueou o som:", e)); 
      startStopBtn.textContent = 'STOP ALARM'; 
      
      // Prepara o próximo
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
  }, 1000); // O intervalo continua rodando a cada 1s para atualizar a tela
}

function stopTimer() {
  clearInterval(timerInterval);
  // Não precisamos fazer nada com timeLeft aqui, ele já está com o valor
  // correto da última atualização do loop
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
