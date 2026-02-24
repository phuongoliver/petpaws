import { bus } from '../core/EventBus.js';
import { drawPetStatic } from '../utils/drawPetStatic.js';

export class CollectionView {
    constructor(userModel) {
        this.userModel = userModel;
        this.modal = document.getElementById('collection-modal');
        this.shopBtn = document.getElementById('shop-btn'); // Combined Button
        this.closeBtn = document.getElementById('close-collection-btn');
        this.grid = document.getElementById('collection-grid');
        this.tabs = document.querySelectorAll('.tab-btn');

        // Shop Data
        this.shopItems = [
            { id: 'hat_straw', name: 'Straw Hat', category: 'hat', icon: '👒', price: 50 },
            { id: 'collar_red', name: 'Red Collar', category: 'collar', icon: '🎀', price: 30 },
            { id: 'shirt_striped', name: 'Striped Shirt', category: 'shirt', icon: '👕', price: 100 }
        ];

        this.currentTab = 'stages'; // 'stages' or 'items'

        this.bindEvents();
    }

    bindEvents() {
        if (this.shopBtn) {
            this.shopBtn.addEventListener('click', () => {
                this.showModal();
            });
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hideModal());
        }

        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.hideModal();
            });
        }

        if (this.tabs) {
            this.tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    this.switchTab(e.target.dataset.tab);
                });
            });
        }

        bus.on('USER_LOGGED_IN', () => {
            // Re-render when unlocked stage changes
            if (this.modal.style.display === 'flex') this.renderCurrentTab();
        });

        bus.on('INVENTORY_UPDATED', () => {
            if (this.modal.style.display === 'flex' && this.currentTab === 'items') this.renderGridItems();
        });

        bus.on('PET_EQUIPMENT_UPDATED', () => {
            if (this.modal.style.display === 'flex' && this.currentTab === 'items') this.renderGridItems();
        });
    }

    switchTab(tabName) {
        if (!tabName) return;
        this.currentTab = tabName;

        this.tabs.forEach(t => {
            if (t.dataset.tab === tabName) {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });

        this.renderCurrentTab();
    }

    showModal() {
        if (this.modal && this.userModel.pet) {
            this.renderCurrentTab();
            this.modal.style.display = 'flex';
        }
    }

    hideModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    renderCurrentTab() {
        if (this.currentTab === 'stages') {
            this.renderGridStages();
        } else {
            this.renderGridItems();
        }
    }

    renderGridStages() {
        if (!this.grid || !this.userModel.pet) return;
        this.grid.innerHTML = '';

        const pet = this.userModel.pet;
        const unlocked = pet.unlocked_stages || [1];

        const stages = [
            { stage: 1, name: 'Baby' },
            { stage: 2, name: 'Teen' },
            { stage: 3, name: 'Adult' }
        ];

        stages.forEach(s => {
            const isUnlocked = unlocked.includes(s.stage);

            const itemDiv = document.createElement('div');
            itemDiv.className = `collection-item ${isUnlocked ? '' : 'locked'}`;

            const imgDiv = document.createElement('div');
            imgDiv.className = 'collection-item-img';

            // Draw real representation
            const cvs = document.createElement('canvas');
            cvs.width = 100;
            cvs.height = 100;
            const ctx = cvs.getContext('2d');

            const petType = pet.id.includes('cat') ? 'cat' : 'dog';
            let stageScale = 0.8;
            if (s.stage === 2) stageScale = 1.0;
            else if (s.stage === 3) stageScale = 1.2;

            // Optional: Show equipped items only on current stage
            const itemsToDraw = (isUnlocked && s.stage === pet.current_stage) ? pet.equipped_items : {};

            drawPetStatic(ctx, { width: 100, height: 100 }, petType, stageScale, itemsToDraw);
            imgDiv.appendChild(cvs);

            const nameDiv = document.createElement('div');
            nameDiv.className = 'collection-item-name';
            nameDiv.textContent = `Stage ${s.stage}`;

            itemDiv.appendChild(imgDiv);
            itemDiv.appendChild(nameDiv);

            this.grid.appendChild(itemDiv);
        });
    }

    renderGridItems() {
        if (!this.grid || !this.userModel.pet) return;
        this.grid.innerHTML = '';

        const owned = this.userModel.owned_items || [];
        const equipped = this.userModel.pet.equipped_items || {};
        const coins = this.userModel.coins || 0;

        this.shopItems.forEach(item => {
            const isOwned = owned.includes(item.id);
            const isEquipped = equipped[item.category] === item.id;

            const itemDiv = document.createElement('div');
            itemDiv.className = `collection-item ${isOwned ? 'owned' : 'unowned'}`;

            const imgDiv = document.createElement('div');
            imgDiv.className = 'collection-item-img';
            imgDiv.textContent = item.icon;

            const nameDiv = document.createElement('div');
            nameDiv.className = 'collection-item-name';
            nameDiv.textContent = item.name;

            const actionBtn = document.createElement('button');
            actionBtn.className = 'btn';

            if (isOwned) {
                if (isEquipped) {
                    actionBtn.textContent = 'Take Off';
                    actionBtn.className += ' secondary';
                } else {
                    actionBtn.textContent = 'Wear';
                    actionBtn.className += ' primary';
                }
                actionBtn.addEventListener('click', () => {
                    this.userModel.equipItem(item.category, item.id);
                });
            } else {
                actionBtn.textContent = `${item.price} 🪙`;
                actionBtn.className += ' secondary';
                if (coins < item.price) {
                    actionBtn.disabled = true;
                    actionBtn.style.opacity = '0.5';
                }
                actionBtn.addEventListener('click', () => {
                    this.userModel.buyItem(item.id, item.price);
                });
            }

            itemDiv.appendChild(imgDiv);
            itemDiv.appendChild(nameDiv);
            itemDiv.appendChild(actionBtn);

            this.grid.appendChild(itemDiv);
        });
    }
}
