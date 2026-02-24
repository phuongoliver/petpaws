import { bus } from '../core/EventBus.js';
import { Storage } from '../core/Storage.js';

export class CoopRoom {
    constructor() {
        this.channel = new BroadcastChannel('paws_coop_room');
        this.isInRoom = false;
        this.roomId = null;

        this.bindEvents();
        this.bindChannel();
    }

    bindEvents() {
        // When user tries to join a room
        bus.on('JOIN_ROOM', (roomId) => {
            this.isInRoom = true;
            this.roomId = roomId;
            bus.emit('ROOM_JOINED', roomId);

            // Announce to others
            const user = Storage.getCurrentUser();
            this.channel.postMessage({
                type: 'USER_JOINED',
                roomId: this.roomId,
                username: user ? user.username : 'GUEST'
            });
        });

        // When user tries to leave a room
        bus.on('LEAVE_ROOM', () => {
            this.isInRoom = false;
            this.roomId = null;
            bus.emit('ROOM_LEFT');
        });

        // If local user fails the session while in a room -> drag everyone down
        bus.on('SESSION_FAILED', () => {
            if (this.isInRoom) {
                this.channel.postMessage({
                    type: 'ROOM_FAILED',
                    roomId: this.roomId
                });
            }
        });

        // If local starts, sync others mostly for visuals (MVP: simple start trigger)
        bus.on('SESSION_STARTED', () => {
            if (this.isInRoom) {
                this.channel.postMessage({
                    type: 'ROOM_STARTED',
                    roomId: this.roomId
                });
            }
        });
    }

    bindChannel() {
        this.channel.onmessage = (event) => {
            const data = event.data;
            if (!this.isInRoom || data.roomId !== this.roomId) return;

            switch (data.type) {
                case 'USER_JOINED':
                    console.log(`${data.username} joined the room!`);
                    // Can emit toast event here
                    break;
                case 'ROOM_FAILED':
                    // Someone else failed -> We all fail
                    console.error("A room member abandoned the session! Room failed!");
                    bus.emit('SESSION_FAILED'); // Timer model will hear this and stop
                    break;
                case 'ROOM_STARTED':
                    // Someone started the timer
                    bus.emit('REMOTE_SESSION_STARTED'); // We can listen to this to auto-start local
                    break;
            }
        };
    }
}
