import { bus } from '../core/EventBus.js';
import { Storage } from '../core/Storage.js';

export class Pet {
    constructor(userModel) {
        this.userModel = userModel;
        this.currentMood = 'idle';
        this.moodResetTimer = null;
        this.lastBondTime = 0; // Cooldown for petting

        this.bindEvents();
    }

    bindEvents() {
        // From user
        bus.on('USER_LOGGED_IN', () => {
            this.setPersistentMood('idle');
            this.checkLevelUp();
        });
        bus.on('USER_LOGGED_OUT', () => this.setPersistentMood('idle'));

        // From timer
        bus.on('SESSION_STARTED', () => this.setPersistentMood('watching'));
        bus.on('SESSION_RESUMED', () => this.setPersistentMood('watching'));
        bus.on('SESSION_STOPPED', () => this.setPersistentMood('idle'));
        bus.on('SESSION_FAILED', () => this.setPersistentMood('sad'));

        // Success -> get Bones + playing mood
        bus.on('SESSION_SUCCESS', () => {
            if (this.userModel && this.userModel.isLoggedIn) {
                const newBones = this.userModel.bones + 5;
                bus.emit('BONES_UPDATED', newBones);
            }
            this.setPersistentMood('playing');
        });

        // Minute ticked -> get Bone + random animation + EXP
        bus.on('TIMER_MINUTE_PASSED', () => {
            if (this.userModel && this.userModel.isLoggedIn) {
                const newBones = this.userModel.bones + 1;
                bus.emit('BONES_UPDATED', newBones);

                // Add EXP and decrease Hunger
                if (this.userModel.pet) {
                    const stats = this.userModel.pet.stats;
                    const newExp = stats.current_exp + 10;

                    // Decrease hunger: 25 mins = -10 hunger => 1 min = -0.4 hunger
                    let newHunger = stats.hunger - 0.4;
                    if (newHunger < 0) newHunger = 0;

                    this.userModel.updatePetStats({ current_exp: newExp, hunger: newHunger });
                    this.checkLevelUp();
                }
            }

            // 20% chance to play animation on tick
            if (Math.random() < 0.2) {
                this.triggerShortMood('playing');
            }
        });

        // Break logic (Feeding)
        bus.on('REQUEST_BREAK', () => {
            if (this.userModel && this.userModel.isLoggedIn && this.userModel.bones >= 1) {
                const newBones = this.userModel.bones - 1;
                bus.emit('BONES_UPDATED', newBones);
                this.setPersistentMood('idle'); // Eating mood
                bus.emit('PET_FED'); // Trigger particle animation
                bus.emit('APPROVE_BREAK');
            } else {
                console.log("Not enough bones to feed!");
            }
        });

        // Simple Feed logic from Main Screen
        bus.on('REQUEST_SIMPLE_FEED', () => {
            if (this.userModel && this.userModel.isLoggedIn && this.userModel.bones >= 1) {
                const stats = this.userModel.pet.stats;
                if (stats.hunger < 100) {
                    const newBones = this.userModel.bones - 1;
                    bus.emit('BONES_UPDATED', newBones);

                    const newHunger = Math.min(100, stats.hunger + 20);
                    this.userModel.updatePetStats({ hunger: newHunger });

                    this.triggerShortMood('happy');
                    bus.emit('PET_FED'); // Trigger particle animation
                }
            }
        });

        bus.on('BREAK_ENDED', () => this.setPersistentMood('idle'));

        // Interaction (Petting)
        bus.on('PET_INTERACTED', (isFocusing) => {
            if (this.currentMood === 'sad') {
                this.setPersistentMood(isFocusing ? 'watching' : 'idle');
            }
            this.triggerShortMood('happy');

            // Increase Bond (+10) with 2-second cooldown
            const now = Date.now();
            if (now - this.lastBondTime > 2000 && this.userModel && this.userModel.pet) {
                this.lastBondTime = now;
                const stats = this.userModel.pet.stats;
                const newBond = Math.min(100, stats.bond + 10);
                this.userModel.updatePetStats({ bond: newBond });
            }
        });
    }

    checkLevelUp() {
        if (!this.userModel || !this.userModel.pet) return;
        const stats = this.userModel.pet.stats;

        let currentExp = stats.current_exp;
        let level = stats.level;
        let requiresSave = false;

        // Loop in case we gained multiple levels at once
        while (true) {
            const expRequired = Math.floor(100 * Math.pow(level, 1.5));
            if (currentExp >= expRequired) {
                currentExp -= expRequired;
                level++;
                requiresSave = true;

                // Fire level up event so UI can show confetti
                bus.emit('PET_LEVEL_UP', level);
            } else {
                break;
            }
        }

        if (requiresSave) {
            this.userModel.updatePetStats({ current_exp: currentExp, level: level });
            this.checkStageEvolution(level);
        }
    }

    checkStageEvolution(level) {
        if (!this.userModel || !this.userModel.pet) return;
        let newStage = 1;
        if (level >= 25) newStage = 3;
        else if (level >= 10) newStage = 2;

        if (this.userModel.pet.current_stage !== newStage) {
            this.userModel.updatePetStage(newStage);
        }
    }

    setPersistentMood(moodStr) {
        this.currentMood = moodStr;
        bus.emit('PET_MOOD_CHANGED', this.currentMood);
    }

    triggerShortMood(tempMood) {
        if (this.currentMood === 'sad' && tempMood !== 'happy') return;

        bus.emit('PET_MOOD_CHANGED', tempMood);

        if (this.moodResetTimer) clearTimeout(this.moodResetTimer);
        this.moodResetTimer = setTimeout(() => {
            bus.emit('PET_MOOD_CHANGED', this.currentMood);
        }, 1500);
    }
}
