let focusDurationMinutes = 25;
let remainingSeconds = 0;
let timer = null;
let isFocusing = false;
let isOnBreak = false;
let bones = 0;

// UI Elements
const timerDisplay = document.getElementById('timer-display');
const focusSlider = document.getElementById('focus-duration');
const durationLabel = document.getElementById('duration-label');
const mainBtn = document.getElementById('main-btn');
const feedBtn = document.getElementById('feed-btn');
const boneCountDisplay = document.getElementById('bone-count');
const petArea = document.getElementById('pet-area');
const sliderContainer = document.getElementById('slider-container');

// Auth UI Elements
const authView = document.getElementById('auth-view');
const mainView = document.getElementById('main-view');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchText = document.getElementById('auth-switch-text');
const authSwitchBtn = document.getElementById('auth-switch-btn');
const authError = document.getElementById('auth-error');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const logoutBtn = document.getElementById('logout-btn');

let isLoginMode = true;
let currentUser = null;

// Sound (Optional base64 or placeholder)
const beeps = new Audio();

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function updateUI() {
    timerDisplay.textContent = formatTime(remainingSeconds > 0 ? remainingSeconds : focusDurationMinutes * 60);
    boneCountDisplay.textContent = bones;

    if (isFocusing) {
        sliderContainer.style.display = 'none';
        if (!isOnBreak) {
            mainBtn.textContent = 'STOP FOCUS';
            mainBtn.className = 'btn primary running';
            feedBtn.disabled = true;
        } else {
            mainBtn.textContent = 'RESUME FOCUS';
            mainBtn.className = 'btn primary break';
            feedBtn.disabled = true;
        }
    } else {
        sliderContainer.style.display = 'block';
        mainBtn.textContent = 'START FOCUS';
        mainBtn.className = 'btn primary';
        feedBtn.disabled = bones === 0;
    }
}

focusSlider.addEventListener('input', (e) => {
    focusDurationMinutes = parseInt(e.target.value);
    durationLabel.textContent = `${focusDurationMinutes} min`;
    updateUI();
});

let currentPersistentMood = 'idle';
let moodResetTimer = null;

function setMood(moodStr) {
    currentPersistentMood = moodStr;
    if (window.setDogMoodDisplay) window.setDogMoodDisplay(moodStr);
}

function triggerShortMood(tempMood) {
    if (currentPersistentMood === 'sad' && tempMood !== 'happy') return;

    if (window.setDogMoodDisplay) window.setDogMoodDisplay(tempMood);

    if (moodResetTimer) clearTimeout(moodResetTimer);
    moodResetTimer = setTimeout(() => {
        if (isFocusing && !isOnBreak) {
            currentPersistentMood = 'watching';
        } else if (isOnBreak) {
            currentPersistentMood = 'idle'; // eating maps to idle usually
        } else {
            currentPersistentMood = 'idle';
        }
        if (window.setDogMoodDisplay) window.setDogMoodDisplay(currentPersistentMood);
    }, 1500);
}

function startFocus() {
    if (isFocusing) return;
    isFocusing = true;
    isOnBreak = false;
    remainingSeconds = focusDurationMinutes * 60;
    setMood('watching');

    clearInterval(timer);
    timer = setInterval(() => {
        if (remainingSeconds > 0) {
            remainingSeconds--;
            if (remainingSeconds % 60 === 0 && remainingSeconds !== 0) {
                if (new Date().getSeconds() % 5 === 0) {
                    triggerShortMood('playing');
                }
                bones++;
            }
        } else {
            finishSession();
        }
        updateUI();
    }, 1000);
    updateUI();
}

function finishSession() {
    clearInterval(timer);
    isFocusing = false;
    isOnBreak = false;
    bones += 5;
    saveBones();
    setMood('playing');
    updateUI();
}

function takeBreak() {
    if (!isFocusing || isOnBreak || bones < 1) return;
    bones--;
    saveBones();
    isOnBreak = true;
    clearInterval(timer);

    // Start a 5 min break timer
    remainingSeconds = 5 * 60;

    timer = setInterval(() => {
        remainingSeconds--;
        updateUI();
        if (remainingSeconds <= 0) {
            clearInterval(timer);
            isFocusing = false;
            isOnBreak = false;
            setMood('idle');
            updateUI();
        }
    }, 1000);

    setMood('idle');
    updateUI();
}

function resumeFocus() {
    if (!isOnBreak) return;
    isOnBreak = false;
    setMood('watching');
    clearInterval(timer);
    timer = setInterval(() => {
        if (remainingSeconds > 0) {
            remainingSeconds--;
            if (remainingSeconds % 60 === 0 && remainingSeconds !== 0) {
                if (new Date().getSeconds() % 5 === 0) {
                    triggerShortMood('playing');
                }
                bones++;
                saveBones();
            }
        } else {
            finishSession();
        }
        updateUI();
    }, 1000);
    updateUI();
}

function stopFocus() {
    clearInterval(timer);
    isFocusing = false;
    isOnBreak = false;
    remainingSeconds = 0;
    setMood('idle');
    updateUI();
}

mainBtn.addEventListener('click', () => {
    if (!isFocusing) {
        startFocus();
    } else if (isOnBreak) {
        resumeFocus();
    } else {
        stopFocus();
    }
});

feedBtn.addEventListener('click', () => {
    takeBreak();
});

petArea.addEventListener('click', () => {
    if (currentPersistentMood === 'sad') {
        setMood(isFocusing && !isOnBreak ? 'watching' : 'idle');
    }
    triggerShortMood('happy');
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        if (isFocusing && !isOnBreak) {
            failSession();
        }
    }
});

function failSession() {
    clearInterval(timer);
    isFocusing = false;
    isOnBreak = false;
    remainingSeconds = 0;
    setMood('sad');
    updateUI();
}

function saveBones() {
    if (currentUser) {
        currentUser.bones = bones;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        const dbString = localStorage.getItem('paws_db');
        if (dbString) {
            const db = JSON.parse(dbString);
            if (db[currentUser.username]) {
                db[currentUser.username].bones = bones;
                localStorage.setItem('paws_db', JSON.stringify(db));
            }
        }
    }
}

// --- Auth Logic ---
function initAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        bones = currentUser.bones || 0;
        showMainView();
    } else {
        showAuthView();
    }
}

function showAuthView() {
    authView.style.display = 'flex';
    mainView.style.display = 'none';
    authError.textContent = '';
    usernameInput.value = '';
    passwordInput.value = '';
}

function showMainView() {
    authView.style.display = 'none';
    mainView.style.display = 'flex';
    setMood('idle');
    updateUI();
}

authSwitchBtn.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    authError.textContent = '';
    if (isLoginMode) {
        authTitle.textContent = 'Đăng nhập';
        authSubmitBtn.textContent = 'Vào ngay';
        authSwitchText.textContent = 'Chưa có tài khoản?';
        authSwitchBtn.textContent = 'Đăng ký ngay';
    } else {
        authTitle.textContent = 'Đăng ký';
        authSubmitBtn.textContent = 'Tạo tài khoản';
        authSwitchText.textContent = 'Đã có tài khoản?';
        authSwitchBtn.textContent = 'Đăng nhập';
    }
});

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        authError.textContent = 'Vui lòng nhập đầy đủ thông tin.';
        return;
    }

    const dbString = localStorage.getItem('paws_db');
    const db = dbString ? JSON.parse(dbString) : {};

    if (isLoginMode) {
        if (db[username] && db[username].password === password) {
            currentUser = { username, bones: db[username].bones };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            bones = currentUser.bones;
            showMainView();
        } else {
            authError.textContent = 'Sai tên đăng nhập hoặc mật khẩu.';
        }
    } else {
        if (db[username]) {
            authError.textContent = 'Tên người dùng đã tồn tại.';
        } else {
            db[username] = { password, bones: 0 };
            localStorage.setItem('paws_db', JSON.stringify(db));
            currentUser = { username, bones: 0 };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            bones = 0;
            showMainView();
        }
    }
});

logoutBtn.addEventListener('click', () => {
    if (isFocusing) stopFocus();
    localStorage.removeItem('currentUser');
    currentUser = null;
    showAuthView();
});

// Init
initAuth();

setMood('idle');
updateUI();
