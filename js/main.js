import { User } from './models/User.js';
import { Timer } from './models/Timer.js';
import { Pet } from './models/Pet.js';
import { CoopRoom } from './models/CoopRoom.js';

import { AuthView } from './views/AuthView.js';
import { OnboardingView } from './views/OnboardingView.js';
import { TimerView } from './views/TimerView.js';
import { PetView } from './views/PetView.js';
import { RoomView } from './views/RoomView.js';
import { DashboardView } from './views/DashboardView.js';
import { CollectionView } from './views/CollectionView.js';
import { Storage } from './core/Storage.js';

function seedDemoAccounts() {
    const db = Storage.getDB();
    let updated = false;

    // User 1
    if (!db['demo1']) {
        db['demo1'] = {
            password: '123',
            inventory: { bones: 15, coins: 75 },
            hasAdoptedPet: true,
            pet: {
                id: 'dog_01', name: 'Mochi', adoption_date: new Date().toISOString(),
                current_stage: 1, stats: { level: 5, current_exp: 800, hunger: 100, bond: 100 },
                last_fed_timestamp: new Date().toISOString()
            }
        };
        updated = true;
    }

    // User 2
    if (!db['demo3']) {
        db['demo3'] = {
            password: '123',
            inventory: { bones: 20, coins: 100 },
            hasAdoptedPet: true,
            pet: {
                id: 'cat_01', name: 'Boba', adoption_date: new Date().toISOString(),
                current_stage: 2, stats: { level: 12, current_exp: 4200, hunger: 50, bond: 60 },
                last_fed_timestamp: new Date().toISOString()
            }
        };
        updated = true;
    }

    if (updated) Storage.saveDB(db);
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Models
    const userModel = new User();
    const timerModel = new Timer();
    const petModel = new Pet(userModel);
    const roomModel = new CoopRoom(); // MVP Co-op

    // 2. Initialize Views
    const authView = new AuthView(userModel);
    const onboardingView = new OnboardingView(userModel);
    const timerView = new TimerView(timerModel);
    const petView = new PetView(userModel);
    const roomView = new RoomView();
    const dashboardView = new DashboardView(userModel, petModel);
    const collectionView = new CollectionView(userModel);

    // 3. Start App
    seedDemoAccounts();
    userModel.init();
});
