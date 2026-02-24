import { bus } from '../core/EventBus.js';

export class TimerView {
    constructor(timerModel) {
        this.timer = timerModel;

        // DOM Elements
        this.timerDisplay = document.getElementById('timer-display');
        this.focusSlider = document.getElementById('focus-duration');
        this.durationLabel = document.getElementById('duration-label');
        this.mainBtn = document.getElementById('main-btn');
        this.feedBtn = document.getElementById('feed-btn');
        this.sliderContainer = document.getElementById('slider-container');
        this.boneCountDisplay = document.getElementById('bone-count');
        this.coinCountDisplay = document.getElementById('coin-count');

        this.bindEvents();
    }

    bindEvents() {
        // Slider Input
        if (this.focusSlider) {
            this.focusSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                this.timer.setDuration(val);
                if (this.durationLabel) {
                    this.durationLabel.textContent = `${val} min`;
                }
                this.updateDisplay(val * 60);
            });
        }

        // Main Action Button
        if (this.mainBtn) {
            this.mainBtn.addEventListener('click', () => {
                if (!this.timer.isFocusing) {
                    this.timer.startFocus();
                } else if (this.timer.isOnBreak) {
                    this.timer.resumeFocus();
                } else {
                    this.timer.stopFocus();
                }
            });
        }

        // Feed Button (Simple Feed, Not Break Timer)
        if (this.feedBtn) {
            this.feedBtn.addEventListener('click', () => {
                bus.emit('REQUEST_SIMPLE_FEED');
            });
        }

        // EventBus Listeners
        bus.on('TIMER_TICK', (seconds) => this.updateDisplay(seconds));
        bus.on('SESSION_STARTED', () => this.renderRunningState());
        bus.on('SESSION_RESUMED', () => this.renderRunningState());
        bus.on('BREAK_STARTED', () => this.renderBreakState());
        bus.on('SESSION_STOPPED', () => this.renderIdleState());
        bus.on('SESSION_SUCCESS', () => this.renderIdleState());
        bus.on('SESSION_FAILED', () => this.renderIdleState());
        bus.on('BREAK_ENDED', () => this.renderIdleState());

        bus.on('USER_LOGGED_IN', (data) => {
            this.updateBonesDisplay(data.bones);
            this.updateCoinsDisplay(data.coins);
            this.renderIdleState();
        });
        bus.on('BONES_UPDATED', (bones) => this.updateBonesDisplay(bones));
        bus.on('COINS_UPDATED', (coins) => this.updateCoinsDisplay(coins));
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    updateDisplay(seconds) {
        if (this.timerDisplay) {
            this.timerDisplay.textContent = this.formatTime(seconds);
        }
    }

    updateBonesDisplay(bones) {
        if (this.boneCountDisplay) {
            this.boneCountDisplay.textContent = bones;
        }

        // Feed button state depends on bones
        if (this.feedBtn && !this.timer.isFocusing) {
            this.feedBtn.disabled = (bones < 1);
        }
    }

    updateCoinsDisplay(coins) {
        if (this.coinCountDisplay) {
            this.coinCountDisplay.textContent = coins || 0;
        }
    }

    renderRunningState() {
        if (this.sliderContainer) this.sliderContainer.style.display = 'none';
        if (this.mainBtn) {
            this.mainBtn.textContent = 'STOP FOCUS';
            this.mainBtn.className = 'btn primary running';
        }
        if (this.feedBtn) this.feedBtn.disabled = true;
    }

    renderBreakState() {
        if (this.sliderContainer) this.sliderContainer.style.display = 'none';
        if (this.mainBtn) {
            this.mainBtn.textContent = 'RESUME FOCUS';
            this.mainBtn.className = 'btn primary break';
        }
        if (this.feedBtn) this.feedBtn.disabled = true;
    }

    renderIdleState() {
        if (this.sliderContainer) this.sliderContainer.style.display = 'block';
        if (this.mainBtn) {
            this.mainBtn.textContent = 'START FOCUS';
            this.mainBtn.className = 'btn primary';
        }
        // Bones logic handles re-enabling feed button if Bones > 0 via BONES_UPDATED event
        this.updateDisplay(this.timer.focusDurationMinutes * 60);
    }
}
