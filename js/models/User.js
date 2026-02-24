import { Storage } from '../core/Storage.js';
import { bus } from '../core/EventBus.js';

export class User {
    constructor() {
        this.username = null;
        this.bones = 0;
        this.coins = 0;
        this.isLoggedIn = false;
        this.hasAdoptedPet = false;
        this.pet = null;

        // Listen for bone updates from other modules (e.g., Timer or Pet feeding)
        bus.on('BONES_UPDATED', this.handleBonesUpdated.bind(this));
    }

    init() {
        const savedUser = Storage.getCurrentUser();
        if (savedUser) {
            this.username = savedUser.username;
            this.bones = savedUser.inventory ? savedUser.inventory.bones : (savedUser.bones || 0);
            this.coins = savedUser.inventory ? (savedUser.inventory.coins || 0) : 0;
            this.owned_items = savedUser.inventory ? (savedUser.inventory.owned_items || []) : []; // Load owned_items
            this.isLoggedIn = true;
            this.hasAdoptedPet = savedUser.hasAdoptedPet || false;
            this.pet = savedUser.pet || null;

            // Ensure pet has equipped_items structure
            if (this.pet && !this.pet.equipped_items) {
                this.pet.equipped_items = { hat: null, collar: null, shirt: null };
            }

            // Wait for next tick so views have time to bind
            setTimeout(() => {
                bus.emit('USER_LOGGED_IN', {
                    username: this.username,
                    bones: this.bones,
                    coins: this.coins,
                    owned_items: this.owned_items, // Added to payload
                    hasAdoptedPet: this.hasAdoptedPet,
                    pet: this.pet
                });
            }, 0);
        } else {
            // Need setTimeout to ensure views are ready
            setTimeout(() => bus.emit('USER_LOGGED_OUT'), 0);
        }
    }

    login(username, password) {
        const db = Storage.getDB();
        if (db[username] && db[username].password === password) {
            const bones = db[username].inventory ? (db[username].inventory.bones || 0) : 0;
            const coins = db[username].inventory ? (db[username].inventory.coins || 0) : 0;
            const owned_items = db[username].inventory ? (db[username].inventory.owned_items || []) : [];
            const hasAdoptedPet = db[username].hasAdoptedPet || false;
            const pet = db[username].pet || null;
            this._setSession(username, bones, coins, owned_items, hasAdoptedPet, pet);
            return { success: true };
        }
        return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu.' };
    }

    register(username, password) {
        const db = Storage.getDB();
        if (db[username]) {
            return { success: false, message: 'Tên người dùng đã tồn tại.' };
        }
        db[username] = {
            password,
            inventory: { bones: 0, coins: 0, owned_items: [] },
            hasAdoptedPet: false,
            pet: null
        };
        Storage.saveDB(db);
        this._setSession(username, 0, 0, [], false, null);
        return { success: true };
    }

    logout() {
        this.username = null;
        this.bones = 0;
        this.coins = 0;
        this.owned_items = []; // Reset owned_items
        this.isLoggedIn = false;
        this.hasAdoptedPet = false;
        this.pet = null;
        Storage.clearCurrentUser();
        bus.emit('USER_LOGGED_OUT');
    }

    _setSession(username, bones, coins, owned_items, hasAdoptedPet, pet) {
        this.username = username;
        this.bones = bones;
        this.coins = coins;
        this.owned_items = owned_items || []; // Set owned_items
        this.isLoggedIn = true;
        this.hasAdoptedPet = hasAdoptedPet;

        if (pet && !pet.equipped_items) pet.equipped_items = { hat: null, collar: null, shirt: null };
        this.pet = pet;

        Storage.saveCurrentUser({ username, inventory: { bones, coins, owned_items: this.owned_items }, hasAdoptedPet, pet });
        bus.emit('USER_LOGGED_IN', { username, bones, coins, owned_items: this.owned_items, hasAdoptedPet, pet: this.pet }); // Added owned_items to payload
    }

    adoptPet(petId, petName) {
        const petData = {
            id: petId,
            name: petName,
            adoption_date: new Date().toISOString(),
            current_stage: 1, // 1: Baby, 2: Teen, 3: Adult
            unlocked_stages: [1], // Collection Tracker
            stats: {
                level: 1,
                current_exp: 0,
                hunger: 100,
                bond: 50
            },
            equipped_items: { hat: null, collar: null, shirt: null }, // Initialized equipped_items
            last_fed_timestamp: new Date().toISOString()
        };
        this.hasAdoptedPet = true;
        this.pet = petData;
        Storage.savePetAdoption(this.username, petData);
        bus.emit('PET_ADOPTED', petData);
    }

    handleBonesUpdated(newBones) {
        // Calculate diff to add coins implicitly if bones increased (from focus)
        // If bones decreased (feeding), do nothing to coins.
        if (newBones > this.bones) {
            const diff = newBones - this.bones;
            this.coins += diff * 5;
            bus.emit('COINS_UPDATED', this.coins);
        }

        this.bones = newBones;
        this._savePetState(); // Use generic save
    }

    updatePetStats(newStats) {
        if (this.pet && this.username) {
            this.pet.stats = { ...this.pet.stats, ...newStats };
            this._savePetState();
            bus.emit('PET_STATS_UPDATED', this.pet);
        }
    }

    updatePetStage(newStage) {
        if (this.pet && this.username) {
            this.pet.current_stage = newStage;

            // Collection Unlock logic
            if (!this.pet.unlocked_stages) this.pet.unlocked_stages = [];
            if (!this.pet.unlocked_stages.includes(newStage)) {
                this.pet.unlocked_stages.push(newStage);
            }

            this._savePetState();
            bus.emit('PET_STAGE_UPDATED', this.pet);
        }
    }

    // --- Shop & Items Logic ---
    buyItem(itemId, price) {
        if (!this.username) return false;
        if (this.coins < price) return false;

        if (!this.owned_items) this.owned_items = [];
        if (this.owned_items.includes(itemId)) return false; // Already owned

        this.coins -= price;
        this.owned_items.push(itemId);
        this._savePetState();

        bus.emit('COINS_UPDATED', this.coins);
        bus.emit('INVENTORY_UPDATED', this.owned_items);
        return true;
    }

    equipItem(category, itemId) {
        if (!this.username || !this.pet) return false;

        if (!this.pet.equipped_items) this.pet.equipped_items = { hat: null, collar: null, shirt: null };

        // Toggle off if same item, else equip
        if (this.pet.equipped_items[category] === itemId) {
            this.pet.equipped_items[category] = null;
        } else {
            this.pet.equipped_items[category] = itemId;
        }

        this._savePetState();
        bus.emit('PET_EQUIPMENT_UPDATED', this.pet.equipped_items);
        return true;
    }

    _savePetState() {
        const db = Storage.getDB();
        if (db[this.username]) {
            db[this.username].pet = this.pet;
            db[this.username].inventory.bones = this.bones;
            db[this.username].inventory.coins = this.coins;
            db[this.username].inventory.owned_items = this.owned_items; // Save owned_items to DB
            Storage.saveDB(db);
        }
        Storage.saveCurrentUser({
            username: this.username,
            inventory: { bones: this.bones, coins: this.coins, owned_items: this.owned_items }, // Save owned_items to current user
            hasAdoptedPet: this.hasAdoptedPet,
            pet: this.pet
        });
    }
}

