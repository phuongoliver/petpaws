import { bus } from '../core/EventBus.js';

export class Timer {
    constructor() {
        this.focusDurationMinutes = 25;
        this.remainingSeconds = 0;
        this.timerInterval = null;
        this.isFocusing = false;
        this.isOnBreak = false;

        this._bindVisibilityChange();
    }

    setDuration(minutes) {
        if (!this.isFocusing) {
            this.focusDurationMinutes = minutes;
            bus.emit('TIMER_DURATION_CHANGED', this.focusDurationMinutes);
        }
    }

    get isRunning() {
        return this.isFocusing && !this.isOnBreak;
    }

    startFocus() {
        if (this.isFocusing) return;
        this.isFocusing = true;
        this.isOnBreak = false;
        this.remainingSeconds = this.focusDurationMinutes * 60;

        bus.emit('SESSION_STARTED', { durationMinutes: this.focusDurationMinutes });
        this._startTick();
    }

    // New: Start focus with a specific end time (for Co-op sync)
    startFocusWithEndTime(durationMinutes, endTimeString) {
        if (this.isFocusing) return;
        this.isFocusing = true;
        this.isOnBreak = false;

        this.focusDurationMinutes = durationMinutes;
        const endTime = new Date(endTimeString).getTime();
        const now = new Date().getTime();
        this.remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));

        bus.emit('SESSION_STARTED', { synced: true });
        this._startTick();
    }

    resumeFocus() {
        if (!this.isOnBreak) return;
        this.isOnBreak = false;

        bus.emit('SESSION_RESUMED');
        this._startTick();
    }

    takeBreak() {
        if (this.isFocusing || this.isOnBreak) return;

        // Let the Pet/User system know a break was requested
        // They will check if there's enough bones. 
        // We emit an event and wait for approval.
        bus.emit('REQUEST_BREAK');
    }

    // Called by Pet/User system if break is approved
    approveBreak() {
        this.isOnBreak = true;
        clearInterval(this.timerInterval);

        // Start a 5 min break timer
        this.remainingSeconds = 5 * 60;
        bus.emit('BREAK_STARTED');

        this._startTick();
    }

    stopFocus(synced = false) {
        clearInterval(this.timerInterval);
        this.isFocusing = false;
        this.isOnBreak = false;
        this.remainingSeconds = 0;
        bus.emit('SESSION_STOPPED', { synced });
    }

    _startTick() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.remainingSeconds > 0) {
                this.remainingSeconds--;

                // Every 60 seconds (minute ticked), emit a tick event for rewards
                if (this.remainingSeconds % 60 === 0 && this.remainingSeconds !== 0) {
                    bus.emit('TIMER_MINUTE_PASSED');
                }

                bus.emit('TIMER_TICK', this.remainingSeconds);
            } else {
                this._finishCurrentState();
            }
        }, 1000);
        bus.emit('TIMER_TICK', this.remainingSeconds);
    }

    _finishCurrentState() {
        clearInterval(this.timerInterval);
        if (this.isOnBreak) {
            // Finished Break
            this.isFocusing = false;
            this.isOnBreak = false;
            bus.emit('BREAK_ENDED');
        } else {
            // Finished Focus
            this.isFocusing = false;
            this.isOnBreak = false;
            bus.emit('SESSION_SUCCESS');
        }
    }

    _failSession() {
        clearInterval(this.timerInterval);
        this.isFocusing = false;
        this.isOnBreak = false;
        this.remainingSeconds = 0;
        bus.emit('SESSION_FAILED');
    }

    _bindVisibilityChange() {
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                // Strict mode: if minimizing/switching tabs while focusing (and not on break) -> Fail
                if (this.isFocusing && !this.isOnBreak) {
                    this._failSession();
                }
            }
        });

        // Listen to logout to stop timer
        bus.on('REQUEST_LOGOUT', () => this.stopFocus());
        bus.on('APPROVE_BREAK', () => this.approveBreak());

        // Co-op Room Integrations
        bus.on('REMOTE_DURATION_CHANGED', (minutes) => {
            if (!this.isRunning) {
                this.focusDurationMinutes = minutes;
                this.remainingSeconds = minutes * 60;
                bus.emit('TIMER_TICK', this.remainingSeconds);
            }
        });
        bus.on('REMOTE_SESSION_STARTED', (payload) => {
            if (!this.isRunning) {
                // Determine end time. If the host set duration_minutes in settings, we add it to start_time
                const durationMinutes = payload.settings ? payload.settings.duration_minutes : 25;
                if (payload.start_time) {
                    const expectedEnd = new Date(new Date(payload.start_time).getTime() + durationMinutes * 60000).toISOString();
                    this.startFocusWithEndTime(durationMinutes, expectedEnd);
                } else {
                    // Fallback
                    this.startFocus();
                }
            }
        });

        bus.on('REMOTE_SESSION_FAILED', (reason) => {
            if (this.isRunning) {
                console.error("Co-op Room Failed!", reason);
                this._failSession();
                // Could trigger a UI alert here, e.g., via bus.emit('COOP_FAIL_ALERT', reason.failed_by_user);
                alert(`Session failed because ${reason?.failed_by_user || 'someone'} left the app!`);
            }
        });

        bus.on('REMOTE_SESSION_STOPPED', () => {
            if (this.isRunning) {
                this.stopFocus(true);
            }
        });
    }
}
