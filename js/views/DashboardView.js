import { bus } from '../core/EventBus.js';

export class DashboardView {
    constructor(userModel, petModel) {
        this.userModel = userModel;
        this.petModel = petModel;

        this.modal = document.getElementById('pet-dashboard-modal');
        this.openBtn = document.getElementById('pet-dashboard-btn');
        this.closeBtn = document.getElementById('close-dashboard-btn');
        this.feedBtn = document.getElementById('dashboard-feed-btn');

        // UI Elements
        this.avatarEl = document.getElementById('dashboard-pet-avatar');
        this.levelEl = document.getElementById('dashboard-pet-level');
        this.nameEl = document.getElementById('dashboard-pet-name');
        this.stageEl = document.getElementById('dashboard-pet-stage');

        this.expBar = document.getElementById('exp-bar');
        this.expText = document.getElementById('exp-text');
        this.hungerBar = document.getElementById('hunger-bar');
        this.hungerText = document.getElementById('hunger-text');
        this.bondBar = document.getElementById('bond-bar');
        this.bondText = document.getElementById('bond-text');

        this.miniHungerBar = document.getElementById('mini-hunger-bar');

        this.bindEvents();
    }

    bindEvents() {
        if (this.openBtn) {
            this.openBtn.addEventListener('click', () => this.showModal());
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hideModal());
        }

        // Close on overlay click
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.hideModal();
            });
        }

        // Feed logic
        if (this.feedBtn) {
            this.feedBtn.addEventListener('click', () => {
                if (this.userModel.bones > 0 && this.userModel.pet.stats.hunger < 100) {
                    const newBones = this.userModel.bones - 1;
                    bus.emit('BONES_UPDATED', newBones);

                    const newHunger = Math.min(100, this.userModel.pet.stats.hunger + 20);
                    this.userModel.updatePetStats({ hunger: newHunger });

                    // Show happy mood & emit feed event for particles
                    bus.emit('PET_MOOD_CHANGED', 'happy');
                    bus.emit('PET_FED');
                }
            });
        }

        // Listen to changes
        bus.on('PET_STATS_UPDATED', () => this.updateUI());
        bus.on('PET_STAGE_UPDATED', () => this.updateUI());
        bus.on('BONES_UPDATED', () => this.updateFeedButton());
        bus.on('USER_LOGGED_IN', () => this.updateUI());
    }

    showModal() {
        if (this.modal && this.userModel.isLoggedIn && this.userModel.hasAdoptedPet) {
            this.updateUI();
            this.modal.style.display = 'flex';
        }
    }

    hideModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    updateUI() {
        if (!this.userModel.pet) return;

        const pet = this.userModel.pet;
        const stats = pet.stats;

        // Avatar icon based on Type
        let icon = '🐶';
        if (pet.id.includes('cat')) icon = '🐱';
        if (pet.id.includes('bird')) icon = '🦜';
        this.avatarEl.textContent = icon;

        // Stage text
        const stages = ['Baby Stage', 'Teen Stage', 'Adult Stage'];
        this.stageEl.textContent = stages[pet.current_stage - 1] || 'Unknown Stage';

        this.levelEl.textContent = stats.level;
        this.nameEl.textContent = pet.name;

        // EXP Math
        const expRequired = Math.floor(100 * Math.pow(stats.level, 1.5));
        const expPct = Math.min(100, (stats.current_exp / expRequired) * 100);
        this.expBar.style.width = `${expPct}%`;
        this.expText.textContent = `${stats.current_exp} / ${expRequired}`;

        // Hunger
        this.hungerBar.style.width = `${stats.hunger}%`;
        this.hungerText.textContent = `${Math.floor(stats.hunger)}/100`;

        if (this.miniHungerBar) {
            this.miniHungerBar.style.width = `${stats.hunger}%`;
            if (stats.hunger < 30) {
                this.miniHungerBar.style.background = '#f44336';
            } else if (stats.hunger < 70) {
                this.miniHungerBar.style.background = '#ff9800';
            } else {
                this.miniHungerBar.style.background = '#4CAF50';
            }
        }

        // Bond
        this.bondBar.style.width = `${stats.bond}%`;
        this.bondText.textContent = `${Math.floor(stats.bond)}/100`;

        this.updateFeedButton();
    }

    updateFeedButton() {
        if (!this.userModel.pet) return;
        const stats = this.userModel.pet.stats;

        if (this.userModel.bones <= 0) {
            this.feedBtn.disabled = true;
            this.feedBtn.textContent = 'Trượt Xương (0)';
        } else if (stats.hunger >= 100) {
            this.feedBtn.disabled = true;
            this.feedBtn.textContent = 'Pet is full (100%)';
        } else {
            this.feedBtn.disabled = false;
            this.feedBtn.textContent = `Feed (+20 Hunger) 🦴 1`;
        }
    }
}
