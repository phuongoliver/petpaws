import { bus } from '../core/EventBus.js';

export class CoopRoom {
    constructor(supabase, userModel) {
        this.supabase = supabase;
        this.userModel = userModel;
        this.isInRoom = false;
        this.roomId = null;
        this.isHost = false;
        this.channel = null;
        this.participants = [];

        this.bindEvents();
    }

    bindEvents() {
        // When user tries to CREATE a room
        bus.on('CREATE_ROOM', async () => {
            if (!this.supabase) return console.error("Supabase not initialized");
            const roomId = this.generateRoomId();
            const username = this.userModel.username || 'GUEST_' + Math.floor(Math.random() * 1000);

            try {
                // Ensure user exists in the users table to prevent Foreign Key errors
                await this.supabase.from('users').upsert({ username: username }, { onConflict: 'username' });

                // Insert room
                const { error: roomErr } = await this.supabase.from('rooms').insert([{
                    id: roomId,
                    host_username: username,
                    status: 'waiting'
                }]);

                if (roomErr) throw roomErr;

                this.isHost = true;
                await this._joinRoomInternal(roomId, username);
            } catch (err) {
                console.error("Failed to create room:", err);
                bus.emit('ROOM_ERROR', err.message || "Could not create room.");
            }
        });

        // When user tries to JOIN a room
        bus.on('JOIN_ROOM', async (roomId) => {
            if (!this.supabase) return;
            const username = this.userModel.username || 'GUEST_' + Math.floor(Math.random() * 1000);

            try {
                // Ensure user exists in the users table to prevent Foreign Key errors
                await this.supabase.from('users').upsert({ username: username }, { onConflict: 'username' });

                // Check if room exists and is waiting
                const { data, error } = await this.supabase.from('rooms').select('status').eq('id', roomId).single();
                if (error || !data) throw new Error("Room not found");
                if (data.status !== 'waiting') throw new Error("Room is already running or completed");

                this.isHost = false;
                await this._joinRoomInternal(roomId, username);
            } catch (err) {
                console.error("Failed to join room:", err);
                bus.emit('ROOM_ERROR', err.message);
            }
        });

        // When user leaves voluntarily
        bus.on('LEAVE_ROOM', async () => {
            await this.leaveRoom();
        });

        // If local start AND isHost, update DB with settings so everyone else can sync
        bus.on('SESSION_STARTED', async (payload) => {
            if (this.isInRoom && this.isHost && !payload?.synced) {
                const durationMinutes = payload?.durationMinutes || 25;

                await this.supabase.from('rooms').update({
                    status: 'running',
                    start_time: new Date().toISOString(),
                    settings: { duration_minutes: durationMinutes }
                }).eq('id', this.roomId);
            }
        });

        // If local stops manually
        bus.on('SESSION_STOPPED', async (payload) => {
            if (this.isInRoom && this.isHost && !payload?.synced) {
                await this.supabase.from('rooms').update({
                    status: 'stopped'
                }).eq('id', this.roomId);
            }
        });

        // When Host changes duration on the slider
        bus.on('TIMER_DURATION_CHANGED', async (duration) => {
            if (this.isInRoom && this.isHost) {
                await this.supabase.from('rooms').update({
                    settings: { duration_minutes: duration }
                }).eq('id', this.roomId);
            }
        });

        // Fail session (strict mechanic triggered)
        bus.on('SESSION_FAILED', async () => {
            if (this.isInRoom) {
                const username = this.userModel.username || 'Unknown';
                await this.supabase.from('rooms').update({
                    status: 'failed',
                    fail_reason: {
                        failed_by_user: username,
                        timestamp: new Date().toISOString()
                    }
                }).eq('id', this.roomId);
            }
        });
    }

    async _joinRoomInternal(roomId, username) {
        try {
            // Add user to participants
            const { error: partErr } = await this.supabase.from('room_participants').upsert({
                room_id: roomId,
                username: username,
                is_ready: true
                // could add pet_asset_id here if we want to show it
            }, { onConflict: 'room_id,username' });

            if (partErr) throw partErr;

            this.isInRoom = true;
            this.roomId = roomId;
            bus.emit('ROOM_JOINED', { roomId, isHost: this.isHost });

            this.subscribeToRoom(roomId);
        } catch (err) {
            console.error(err);
            bus.emit('ROOM_ERROR', "Failed to join room logic.");
        }
    }

    async leaveRoom() {
        if (!this.isInRoom) return;
        const oldRoom = this.roomId;
        this.isInRoom = false;
        this.roomId = null;
        this.isHost = false;
        this.participants = [];

        if (this.channel) {
            this.supabase.removeChannel(this.channel);
            this.channel = null;
        }

        const username = this.userModel.username;
        if (username) {
            // Remove from participants table
            await this.supabase.from('room_participants')
                .delete()
                .match({ room_id: oldRoom, username: username });
        }

        bus.emit('ROOM_LEFT');
    }

    subscribeToRoom(roomId) {
        if (this.channel) this.supabase.removeChannel(this.channel);

        this.channel = this.supabase.channel(`room_${roomId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, payload => {
                const newStatus = payload.new.status;
                const oldStatus = payload.old ? payload.old.status : null; // Warning: REPLICA IDENTITY might limit "old" payload depending on DB settings, but we mainly care about "new"

                // Duration Sync (If in waiting state, update display for guests)
                if (newStatus === 'waiting' && payload.new.settings?.duration_minutes) {
                    bus.emit('REMOTE_DURATION_CHANGED', payload.new.settings.duration_minutes);
                }

                if (newStatus === 'running' && oldStatus !== 'running') {
                    bus.emit('REMOTE_SESSION_STARTED', payload.new);
                } else if (newStatus === 'failed') {
                    console.error("Room failed from DB update!", payload.new.fail_reason);
                    bus.emit('REMOTE_SESSION_FAILED', payload.new.fail_reason);
                } else if (newStatus === 'stopped') {
                    bus.emit('REMOTE_SESSION_STOPPED');
                } else if (newStatus === 'completed') {
                    bus.emit('REMOTE_SESSION_COMPLETED');
                }
            })
            // Listen to participants joining/leaving
            .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}` }, payload => {
                // Avoid fetching if it's our own initial join to prevent excessive calls, though fetchParticipants is mostly safe.
                // The main issue might be if someone mutates the table inside fetchParticipants, which we don't.
                this.fetchParticipants(roomId);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // Fetch once initially when we successfully subscribe
                    this.fetchParticipants(roomId);
                }
            });
    }

    async fetchParticipants(roomId) {
        if (!this.supabase) return;
        const { data, error } = await this.supabase
            .from('room_participants')
            .select('*')
            .eq('room_id', roomId);
        if (!error && data) {
            this.participants = data;
            bus.emit('PARTICIPANTS_UPDATED', this.participants);
        }
    }

    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
}
