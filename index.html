// Variáveis de Estado
let timeLeft = 25 * 60; // Segundos restantes ou decorridos
let timerInterval = null;
let currentInterval = 'pomodoro';
let isCountdown = true; 
let isRinging = false;

// Variáveis para Lógica de Timestamp (Tempo Real)
let startTime = null;
let timeAtPause = 25 * 60; 

// Preferências
let brownNoiseEnabled = false;
let brownNoiseVolume = 0.5;
let backgroundColor = '#F1F1EF';
let fontColor = '#37352F';

// --- AUDIO ENGINE ---
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

// --- LÓGICA CORE ---
const timeLeftEl = document.getElementById('time-left');
const startStopBtn = document.getElementById('start-stop-btn');
const modeToggleBtn = document.getElementById('mode-toggle-btn');

function updateDisplay() {
    const m = Math.floor(Math.abs(timeLeft) / 60);
    const s = Math.abs(timeLeft) % 60;
    timeLeftEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    document.title = `${timeLeftEl.textContent} - Pomodoro`;
}

function switchMode(mode) {
    stopTimer();
    currentInterval = mode;
    let mins = (mode === 'short-break' ? 5 : mode === 'long-break' ? 10 : 25);
    
    // Define o ponto inicial
    timeAtPause = isCountdown ? (mins * 60) : 0;
    timeLeft = timeAtPause;
    
    updateDisplay();
}

modeToggleBtn.addEventListener('click', () => {
    if (timerInterval) return;
    isCountdown = !isCountdown;
    modeToggleBtn.innerHTML = isCountdown ? '<i class="fas fa-history"></i>' : '<i class="fas fa-stopwatch"></i>';
    switchMode(currentInterval);
});

function startTimer() {
    initAudio();
    startTime = Date.now(); // Salva o momento exato do clique no Start
    const limit = (currentInterval === 'short-break' ? 5 : currentInterval === 'long-break' ? 10 : 25) * 60;

    timerInterval = setInterval(() => {
        const currentTime = Date.now();
        const secondsElapsed = Math.floor((currentTime - startTime) / 1000);

        if (isCountdown) {
            timeLeft = timeAtPause - secondsElapsed;
            if (timeLeft <= 0) {
                timeLeft = 0;
                finish();
            }
        } else {
            timeLeft = timeAtPause + secondsElapsed;
            if (timeLeft >= limit) {
                timeLeft = limit;
                finish();
            }
        }
        updateDisplay();
    }, 100); // Roda mais rápido (100ms) para ser ultra preciso
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timeAtPause = timeLeft; // Salva onde paramos para o próximo Start
    toggleBrownNoise(false);
}

function finish() {
    stopTimer();
    isRinging = true;
    document.body.classList.add('alarm-flashing');
    startStopBtn.textContent = 'STOP';
    alarmInterval = setInterval(() => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = 880;
        g.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
        osc.connect(g); g.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    }, 1000);
}

// --- EVENTOS ---
startStopBtn.addEventListener('click', () => {
    if (isRinging) {
        clearInterval(alarmInterval);
        isRinging = false;
        document.body.classList.remove('alarm-flashing');
        startStopBtn.textContent = 'Start';
        switchMode(currentInterval);
        return;
    }
    if (timerInterval) {
        stopTimer();
        startStopBtn.textContent = 'Start';
    } else {
        startTimer();
        startStopBtn.textContent = 'Pause';
        toggleBrownNoise(true);
    }
});

document.getElementById('reset-btn').addEventListener('click', () => {
    switchMode(currentInterval);
    startStopBtn.textContent = 'Start';
});

document.getElementById('pomodoro-interval-btn').addEventListener('click', () => switchMode('pomodoro'));
document.getElementById('short-break-interval-btn').addEventListener('click', () => switchMode('short-break'));
document.getElementById('long-break-interval-btn').addEventListener('click', () => switchMode('long-break'));

// Modal & Configs
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
