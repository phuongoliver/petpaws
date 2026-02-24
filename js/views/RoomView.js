import { bus } from '../core/EventBus.js';

export class RoomView {
    constructor() {
        this.roomContainer = document.getElementById('room-container');
        this.joinRoomBtn = document.getElementById('join-room-btn');
        this.createRoomBtn = document.getElementById('create-room-btn');
        this.leaveRoomBtn = document.getElementById('leave-room-btn');
        this.roomInput = document.getElementById('room-id-input');
        this.roomDisplay = document.getElementById('room-display');
        this.roomStatus = document.getElementById('room-status');

        this.bindEvents();
    }

    bindEvents() {
        if (this.joinRoomBtn && this.roomInput) {
            this.joinRoomBtn.addEventListener('click', () => {
                const roomId = this.roomInput.value.trim();
                if (roomId) {
                    bus.emit('JOIN_ROOM', roomId);
                }
            });
        }

        if (this.createRoomBtn) {
            this.createRoomBtn.addEventListener('click', () => {
                bus.emit('CREATE_ROOM');
            });
        }

        if (this.leaveRoomBtn) {
            this.leaveRoomBtn.addEventListener('click', () => {
                bus.emit('LEAVE_ROOM');
            });
        }

        bus.on('ROOM_JOINED', (payload) => this.renderInRoom(payload.roomId));
        bus.on('ROOM_LEFT', () => this.renderOutRoom());
    }

    renderInRoom(roomId) {
        if (this.roomInput) this.roomInput.style.display = 'none';
        if (this.joinRoomBtn) this.joinRoomBtn.style.display = 'none';
        if (this.createRoomBtn) this.createRoomBtn.style.display = 'none';

        if (this.roomDisplay) {
            this.roomDisplay.style.display = 'inline-block';
            this.roomDisplay.textContent = `Room: ${roomId}`;
        }
        if (this.leaveRoomBtn) this.leaveRoomBtn.style.display = 'inline-block';
        if (this.roomStatus) this.roomStatus.textContent = '🟢 Waiting for others...';
    }

    renderOutRoom() {
        if (this.roomInput) {
            this.roomInput.style.display = 'inline-block';
            this.roomInput.value = '';
        }
        if (this.joinRoomBtn) this.joinRoomBtn.style.display = 'inline-block';
        if (this.createRoomBtn) this.createRoomBtn.style.display = 'inline-block';

        if (this.roomDisplay) this.roomDisplay.style.display = 'none';
        if (this.leaveRoomBtn) this.leaveRoomBtn.style.display = 'none';
        if (this.roomStatus) this.roomStatus.textContent = '';
    }
}
