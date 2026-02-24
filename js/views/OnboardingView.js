import { bus } from '../core/EventBus.js';

export class OnboardingView {
    constructor(userModel) {
        this.userModel = userModel;

        this.onboardingViewEl = document.getElementById('onboarding-view');
        this.petCards = document.querySelectorAll('.pet-card');
        this.petNameInput = document.getElementById('pet-name-input');
        this.adoptBtn = document.getElementById('adopt-btn');
        this.selectedPetId = null;

        this.bindEvents();
    }

    bindEvents() {
        if (!this.onboardingViewEl) return;

        // Select Pet
        this.petCards.forEach(card => {
            card.addEventListener('click', () => {
                this.petCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedPetId = card.dataset.petId;
                this.updateCTA();
            });
        });

        // Input Pet Name
        if (this.petNameInput) {
            this.petNameInput.addEventListener('input', () => {
                this.updateCTA();
            });
        }

        // Adopt Button
        if (this.adoptBtn) {
            this.adoptBtn.addEventListener('click', () => {
                if (this.selectedPetId && this.petNameInput.value.trim()) {
                    this.userModel.adoptPet(this.selectedPetId, this.petNameInput.value.trim().substring(0, 15));
                }
            });
        }

        // EventBus listeners
        bus.on('USER_LOGGED_IN', (data) => {
            if (!data.hasAdoptedPet) {
                this.showOnboardingView();
            }
        });

        bus.on('USER_LOGGED_OUT', () => {
            this.hideOnboardingView();
        });

        bus.on('PET_ADOPTED', () => {
            this.hideOnboardingView();
            // AuthView or another controller should handle showing Main View now
            // We can emit a specific flow event
            bus.emit('ONBOARDING_COMPLETE');
        });
    }

    updateCTA() {
        if (this.selectedPetId && this.petNameInput.value.trim()) {
            this.adoptBtn.disabled = false;
            this.adoptBtn.textContent = `Adopt ${this.petNameInput.value.trim().substring(0, 15)}`;
        } else {
            this.adoptBtn.disabled = true;
            this.adoptBtn.textContent = "Adopt";
        }
    }

    showOnboardingView() {
        if (this.onboardingViewEl) {
            this.onboardingViewEl.style.display = 'flex';
            // Reset state
            this.selectedPetId = null;
            if (this.petNameInput) this.petNameInput.value = '';
            this.petCards.forEach(c => c.classList.remove('selected'));
            this.updateCTA();
        }
    }

    hideOnboardingView() {
        if (this.onboardingViewEl) {
            this.onboardingViewEl.style.display = 'none';
        }
    }
}
