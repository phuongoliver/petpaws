# Pet Paws Architecture

## Overview
This project implements a web-based gamified focus timer. It combines a Pomodoro-style timer with a virtual pet simulation and real-time multiplayer co-op features. The architecture is built entirely on Front-end Vanilla JavaScript, recently refactored from a monolithic iteration to a robust, modular MVC (Model-View-Controller) style pattern using a central Event Bus for communication.

## System Components

### 1. Project Root & Entry
* **`index.html`**: The single-page DOM structure representing all application views (auth, dashboard, pet area, room lobby).
* **`style.css`**: The stylesheet governing the app's visual aesthetics, animations, and responsive layouts.
* **`app.js`**: Legacy monolithic JavaScript file containing early versions of the timer, mood, and auth logic.
* **`js/main.js`**: Main initialization script. It initializes database clients, binds Models and Views together, seeds demo accounts, and boots up the application.

### 2. Modules (`js/`)
The core application logic is strictly divided into four distinct directories: `core`, `models`, `views`, and `utils`.

#### ❖ `core/` (Services & Infrastructure)
Responsible for infrastructure and integrations:
- **`EventBus.js`**: Implements the Publish-Subscribe pattern. Allows highly decoupled communication across components (e.g., when `Timer` changes state, `PetView` updates moods without direct references).
- **`Storage.js`**: Acts as a local repository layer, wrapping `localStorage` interactions safely.
- **`DatabaseClient.js` & `supabaseConfig.js`**: Manages real-time data syncing and remote connections via Supabase (used extensively for multiplayer co-op rooms).

#### ❖ `models/` (Data & Business Logic)
Encapsulates state, business logic, and rules according to the technical requirements (`SRS.md`):
- **`User.js`**: Manages authentication state, user sessions, inventory (bones, coins), and saves user profiles.
- **`Timer.js`**: The "Core Engine" module. Controls Pomodoro states (Focus/Break), calculates progress, calculates penalties if the app loses visibility ("Strict Mode" constraint), and emits timer-related events.
- **`Pet.js`**: The "Simulation Mechanics" layer. Manages virtual pet states, consumption of food, EXP growth, and handles level transitions.
- **`CoopRoom.js`**: The Multiplayer logic component handling real-time synchronization, matchmaking, and "shared penalty pacts" when a room session fails.

#### ❖ `views/` (UI Presentation Layer)
Handles specific DOM manipulation and user interaction. These classes attach event listeners to UI components and listen to Model events.
- **`AuthView.js` & `OnboardingView.js`**: Manages login, registration, and initial pet adoption UI.
- **`DashboardView.js` & `TimerView.js`**: Renders user stats (inventory) and the strict focus timer component.
- **`PetView.js` & `CollectionView.js`**: Renders the virtual pet (often using HTML5 Canvas), handles pet animations/moods based on timer context, and tracks unlocked species.
- **`RoomView.js`**: Renders multiplayer co-op environments and synchronized timer displays.

#### ❖ `utils/` (Helper Functions)
- **`drawPetStatic.js`**: Isolated helper functions for drawing specific pet stage graphics on the Canvas, preventing UI files from becoming bloated with raw path instructions.

## Data Flow
The system enforces a clean, one-way data flow to maintain modularity:
1. **User Interaction**: Views listen to UI events (e.g., user clicks "Start Focus").
2. **Action Dispatch**: The View directly method-calls its corresponding Model (e.g., `timerModel.startFocus()`).
3. **State Mutation**: Internal Model logic processes the business rules, calculates intervals/penalties/rewards, saves data to `Storage`, and then broadcasts state changes via `EventBus` (e.g., `EventBus.emit('TIMER_UPDATE', data)`).
4. **View Rendering**: Any Views subscribed to that event automatically catch it and re-render their domain-specific DOM elements without retaining hard references to other Views.

This decoupled architecture makes extending features (such as adding custom soundscapes, new minigames, or additional API backends) straightforward and maintainable.
