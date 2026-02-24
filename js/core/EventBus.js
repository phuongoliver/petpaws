class EventBus {
    constructor() {
        this.listeners = {};
    }

    /**
     * Subscribe to an event.
     * @param {string} event - The name of the event.
     * @param {Function} callback - The function to call when the event is emitted.
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Unsubscribe from an event.
     * @param {string} event - The name of the event.
     * @param {Function} callback - The function to remove.
     */
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(l => l !== callback);
    }

    /**
     * Emit an event to all subscribers.
     * @param {string} event - The name of the event.
     * @param {any} data - Data to pass to the callbacks.
     */
    emit(event, data) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error executing listener for event ${event}:`, error);
            }
        });
    }
}

// Export as a singleton
export const bus = new EventBus();
