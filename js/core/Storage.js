export class Storage {
    static DB_KEY = 'paws_db';
    static USER_KEY = 'currentUser';

    static getDB() {
        try {
            const dbString = localStorage.getItem(this.DB_KEY);
            return dbString ? JSON.parse(dbString) : {};
        } catch (e) {
            console.error("Error reading from DB", e);
            return {};
        }
    }

    static saveDB(db) {
        localStorage.setItem(this.DB_KEY, JSON.stringify(db));
    }

    static getCurrentUser() {
        try {
            const userString = localStorage.getItem(this.USER_KEY);
            return userString ? JSON.parse(userString) : null;
        } catch (e) {
            console.error("Error reading current user", e);
            return null;
        }
    }

    static saveCurrentUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    static clearCurrentUser() {
        localStorage.removeItem(this.USER_KEY);
    }

    /**
     * Update bones for a specific user in both session and DB
     */
    static updateBones(username, newBones) {
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.username === username) {
            currentUser.bones = newBones;
            this.saveCurrentUser(currentUser);
        }

        const db = this.getDB();
        if (db[username]) {
            if (!db[username].inventory) db[username].inventory = { bones: 0 };
            db[username].inventory.bones = newBones;
            this.saveDB(db);
        }
    }

    /**
     * Save pet adoption data
     */
    static savePetAdoption(username, petData) {
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.username === username) {
            currentUser.hasAdoptedPet = true;
            currentUser.pet = {
                id: petData.id,
                name: petData.name,
                adoption_date: petData.adoption_date,
                current_stage: 1, // 1: Baby, 2: Teen, 3: Adult
                unlocked_stages: [1], // Collection Tracker
                stats: {
                    level: 1,
                    current_exp: 0,
                    hunger: 100,
                    bond: 50
                },
                equipped_items: { hat: null, collar: null, shirt: null },
                last_fed_timestamp: new Date().toISOString()
            };

            // Add initial coins & owned_items to current user if not exist
            if (!currentUser.inventory) currentUser.inventory = {};
            if (typeof currentUser.inventory.coins === 'undefined') {
                currentUser.inventory.coins = 0;
            }
            if (!currentUser.inventory.owned_items) {
                currentUser.inventory.owned_items = [];
            }

            this.saveCurrentUser(currentUser);
        }

        const db = this.getDB();
        if (db[username]) {
            // Merge with new schema
            db[username].hasAdoptedPet = true;
            db[username].pet = {
                id: petData.id,
                name: petData.name,
                adoption_date: petData.adoption_date,
                current_stage: 1, // 1: Baby, 2: Teen, 3: Adult
                unlocked_stages: [1], // Collection Tracker
                stats: {
                    level: 1,
                    current_exp: 0,
                    hunger: 100,
                    bond: 50
                },
                equipped_items: { hat: null, collar: null, shirt: null },
                last_fed_timestamp: new Date().toISOString()
            };

            // Add initial coins & owned_items if not exist
            if (typeof db[username].inventory.coins === 'undefined') {
                db[username].inventory.coins = 0;
            }
            if (!db[username].inventory.owned_items) {
                db[username].inventory.owned_items = [];
            }
            this.saveDB(db);
        }
    }
}
