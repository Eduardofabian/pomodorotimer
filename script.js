// Global variables
let timeLeft = 25 * 60; // seconds
let timerInterval;
let currentInterval = 'pomodoro';
let pomodoroCount = 0; // Contador de pomodoros completados
let backgroundColor = '#F1F1EF'; 
let fontColor = '#37352F'; 

// Som do Alarme
const alarmSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');

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

// --- Função para trocar o modo e atualizar o tempo na tela ---
function switchMode(mode) {
  currentInterval = mode;
  if (mode === 'pomodoro') {
    timeLeft = 25 * 60;
  } else if (mode === 'short-break') {
    timeLeft = 5 * 60;
  } else if (mode === 'long-break') {
    timeLeft = 10 * 60; // Descanso longo
  }
  updateTimeLeftTextContent();
  
  // Atualiza visualmente qual botão está "ativo" (opcional, mas ajuda na UX)
  updateActiveButton(mode);
}

function updateActiveButton(mode) {
  // Reseta bordas/estilos se quiser (aqui mantemos simples)
  // Você pode adicionar classes CSS aqui se quiser destacar o botão atual
}

// Event listeners for interval buttons (Click manual)
pomodoroIntervalBtn.addEventListener('click', () => {
  stopTimer();
  switchMode('pomodoro');
});

shortBreakIntervalBtn.addEventListener('click', () => {
  stopTimer();
  switchMode('short-break');
});

longBreakIntervalBtn.addEventListener('click', () => {
  stopTimer();
  switchMode('long-break');
});

// Event listener for start/stop button
startStopBtn.addEventListener('click', () => {
  if (startStopBtn.textContent === 'Start') {
    startTimer();
    startStopBtn.textContent = 'Pause';
  } else {
    stopTimer();
    startStopBtn.textContent = 'Start';
  }
});

// Event listener for reset button
resetBtn.addEventListener('click', () => {
  stopTimer();
  pomodoroCount = 0; // Reseta a contagem de ciclos se resetar tudo
  switchMode('pomodoro'); // Volta pro padrão
  startStopBtn.textContent = 'Start';
});

// Settings Modal Logic
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
  clearInterval(timerInterval); // Limpa para evitar sobreposição

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimeLeftTextContent();

    // Quando o tempo acaba (chega a 0)
    if (timeLeft < 0) {
      clearInterval(timerInterval); // Para o contador
      alarmSound.play(); // Toca o som
      startStopBtn.textContent = 'Start'; // Volta o botão para "Start"

      // LÓGICA DE TRANSIÇÃO (Mas sem auto-start)
      if (currentInterval === 'pomodoro') {
        pomodoroCount++; // Conta +1 Pomodoro feito
        
        console.log(`Pomodoros completados: ${pomodoroCount}`);

        // Verifica se é hora do descanso longo (múltiplo de 2)
        if (pomodoroCount % 2 === 0) {
          switchMode('long-break'); 
          // O tempo mudou para 10:00, o usuário vê e clica Start quando quiser
        } else {
          switchMode('short-break');
          // O tempo mudou para 05:00
        }
      } else {
        // Se acabou qualquer descanso (curto ou longo), volta pro trabalho
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
