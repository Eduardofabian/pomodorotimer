// Variáveis de Estado
let timeLeft = 25 * 60; 
let timerInterval = null;
let currentInterval = 'pomodoro';
let isCountdown = true; // true = 25:00 -> 0 | false = 0 -> 25:00
let isRinging = false;
let pomodoroCount = 0;

// Preferências
let brownNoiseEnabled = false;
let brownNoiseVolume = 0.5;
let backgroundColor = '#F1F1EF';
let fontColor = '#37352F';

// --- AUDIO ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx, brownNoiseNode, alarmInterval;

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

function toggleBrownNoise(play) {
    if (brownNoiseNode) {
        try { brownNoiseNode.source.stop(); } catch(e){}
        brownNoiseNode = null;
    }
    if (play && currentInterval === 'pomodoro' && brownNoiseEnabled && !isRinging) {
        initAudio();
        brownNoiseNode = createBrownNoise();
        brownNoiseNode.source.start(0);
    }
}

// --- LOGICA DO TIMER ---
const timeLeftEl = document.getElementById('time-left');
const startStopBtn = document.getElementById('start-stop-btn');
const modeToggleBtn = document.getElementById('mode-toggle-btn');

function updateDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    timeLeftEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function switchMode(mode) {
    clearInterval(timerInterval);
    timerInterval = null;
    currentInterval = mode;
    startStopBtn.textContent = 'Start';

    let mins = (mode === 'short-break' ? 5 : mode === 'long-break' ? 10 : 25);
    
    // Se for cronômetro (isCountdown = false), ZERA o tempo. Se for timer, coloca os minutos.
    timeLeft = isCountdown ? (mins * 60) : 0;
    
    updateDisplay();
    toggleBrownNoise(false);
}

// Botão de alternar Timer/Cronômetro
modeToggleBtn.addEventListener('click', () => {
    if (timerInterval) return; // Não muda se estiver rodando
    isCountdown = !isCountdown;
    modeToggleBtn.innerHTML = isCountdown ? '<i class="fas fa-history"></i>' : '<i class="fas fa-stopwatch"></i>';
    switchMode(currentInterval); // Reseta o tempo para o novo modo (0 ou X)
});

function startTimer() {
    const limit = (currentInterval === 'short-break' ? 5 : currentInterval === 'long-break' ? 10 : 25) * 60;

    timerInterval = setInterval(() => {
        if (isCountdown) {
            timeLeft--;
            if (timeLeft <= 0) finish();
        } else {
            timeLeft++;
            if (timeLeft >= limit) finish();
        }
        updateDisplay();
    }, 1000);
}

function finish() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRinging = true;
    document.body.classList.add('alarm-flashing');
    startStopBtn.textContent = 'STOP';
    toggleBrownNoise(false);
    alarmInterval = setInterval(() => {
        initAudio();
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = 880;
        g.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
        osc.connect(g); g.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    }, 1000);
}

// Eventos
startStopBtn.addEventListener('click', () => {
    if (isRinging) {
        clearInterval(alarmInterval);
        isRinging = false;
        document.body.classList.remove('alarm-flashing');
        switchMode(currentInterval);
        return;
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        startStopBtn.textContent = 'Start';
        toggleBrownNoise(false);
    } else {
        startTimer();
        startStopBtn.textContent = 'Pause';
        toggleBrownNoise(true);
    }
});

document.getElementById('reset-btn').addEventListener('click', () => switchMode(currentInterval));
document.getElementById('pomodoro-interval-btn').addEventListener('click', () => switchMode('pomodoro'));
document.getElementById('short-break-interval-btn').addEventListener('click', () => switchMode('short-break'));
document.getElementById('long-break-interval-btn').addEventListener('click', () => switchMode('long-break'));

// Modal
const modal = document.getElementById('settings-modal');
document.getElementById('settings-btn').onclick = () => modal.style.display = 'flex';
document.querySelector('.close-btn').onclick = () => modal.style.display = 'none';
document.getElementById('save-btn').onclick = () => {
    backgroundColor = document.getElementById('background-color').value;
    fontColor = document.getElementById('font-color').value;
    brownNoiseEnabled = document.getElementById('brown-noise-toggle').checked;
    brownNoiseVolume = document.getElementById('volume-slider').value;
    document.body.style.backgroundColor = backgroundColor;
    document.body.style.color = fontColor;
    modal.style.display = 'none';
};

updateDisplay();
