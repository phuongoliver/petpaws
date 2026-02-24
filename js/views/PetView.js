import { bus } from '../core/EventBus.js';

export class PetView {
    constructor(userModel) {
        this.userModel = userModel;
        this.canvas = document.getElementById('dog-canvas');
        if (!this.canvas) return; // Wait for DOM if needed, but we assume it's there

        this.ctx = this.canvas.getContext('2d');
        this.size = { width: 280, height: 280 };
        this.currentDisplayMood = 'idle';
        this.isFocusing = false;
        this.particles = [];

        const petArea = document.getElementById('pet-area');
        if (petArea) {
            petArea.addEventListener('click', () => {
                bus.emit('PET_INTERACTED', this.isFocusing);
            });
        }

        this.bindEvents();
        this.startLoop();
    }

    bindEvents() {
        bus.on('PET_MOOD_CHANGED', (mood) => {
            this.currentDisplayMood = mood;
        });

        // Track focus state for interaction
        bus.on('SESSION_STARTED', () => this.isFocusing = true);
        bus.on('SESSION_RESUMED', () => this.isFocusing = true);
        bus.on('SESSION_STOPPED', () => this.isFocusing = false);
        bus.on('SESSION_FAILED', () => this.isFocusing = false);
        bus.on('SESSION_SUCCESS', () => this.isFocusing = false);
        bus.on('BREAK_STARTED', () => this.isFocusing = false); // Break isn't focusing
        // Listen for level up (fireworks/confetti could be added here)
        bus.on('PET_LEVEL_UP', (level) => {
            console.log("LEVEL UP to", level);
            this.spawnParticles('✨', 5, '#FFD54F');
            this.spawnText('LEVEL UP!', '#FFC107');
            bus.emit('PET_MOOD_CHANGED', 'happy');
        });

        bus.on('PET_STAGE_UPDATED', (pet) => {
            this.spawnParticles('🎉', 15, '#E91E63');
            this.spawnText('STAGE UP!', '#E91E63');
            bus.emit('PET_MOOD_CHANGED', 'happy');
        });

        // Spawn Particles on Interactions
        bus.on('PET_FED', () => {
            this.spawnParticles('🍗', 3, '#FFA000');
            this.spawnText('+20', '#4CAF50');
        });

        bus.on('PET_INTERACTED', () => {
            // Only spawn hearts if idle or happy to prevent spam during focus
            if (!this.isFocusing) {
                this.spawnParticles('❤️', 2, '#E91E63');
            }
        });
    }

    spawnParticles(text, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: this.size.width / 2 + (Math.random() - 0.5) * 60,
                y: this.size.height / 2 - 20 + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2 - 1,
                alpha: 1.0,
                text: text,
                color: color,
                size: Math.random() * 10 + 15
            });
        }
    }

    spawnText(text, color) {
        this.particles.push({
            x: this.size.width / 2,
            y: this.size.height / 2 - 40,
            vx: 0,
            vy: -1.5,
            alpha: 1.0,
            text: text,
            color: color,
            size: 20,
            isBold: true
        });
    }

    startLoop() {
        const drawLoop = () => {
            let time = (Date.now() % 3000) / 1500;
            let animValue = time <= 1 ? time : 2 - time;

            let breathY = 0;
            let tailAngle = 0;
            let headTilt = 0;
            let earLift = 0;
            let bounceY = 0;

            let mood = this.currentDisplayMood;

            if (mood === 'watching') {
                breathY = animValue * 2.0;
                bounceY = Math.sin(animValue * Math.PI * 2) * 1.5;
                tailAngle = Math.sin(animValue * Math.PI) * 0.1;
                headTilt = Math.sin(animValue * Math.PI * 0.5) * 0.05;
            } else if (mood === 'happy' || mood === 'playing') {
                breathY = Math.sin(animValue * Math.PI * 4) * 5.0;
                bounceY = Math.abs(Math.sin(animValue * Math.PI * 2)) * 6.0; // Nảy lên bật xuống
                tailAngle = Math.sin(animValue * Math.PI * 8) * 0.4;
                earLift = 5.0;
            } else if (mood === 'sad') {
                breathY = 0.0;
                bounceY = 0.0;
                tailAngle = 0.1;
                headTilt = 0.1;
            } else { // idle or eating
                breathY = animValue * 2.0;
                bounceY = Math.sin(animValue * Math.PI * 2) * 0.5; // Nhịp thở nhẹ nhàng
            }

            this.ctx.clearRect(0, 0, this.size.width, this.size.height);

            const centerX = this.size.width / 2;
            const bottomY = this.size.height * 0.95;

            // Get Pet Type, Stage & Equipped Items
            let petType = 'dog';
            let stageScale = 1.0;
            let equipped = {};
            if (this.userModel && this.userModel.pet) {
                if (this.userModel.pet.id.includes('cat')) petType = 'cat';
                const stage = this.userModel.pet.current_stage || 1;
                if (stage === 1) stageScale = 0.8;
                else if (stage === 2) stageScale = 1.0;
                else if (stage === 3) stageScale = 1.2;
                equipped = this.userModel.pet.equipped_items || {};
            }

            // GROUND SHADOW
            this.ctx.fillStyle = 'rgba(93, 64, 55, 0.2)';
            this.ctx.beginPath();
            this.ctx.ellipse(centerX, bottomY, 70 * stageScale, 8 * stageScale, 0, 0, 2 * Math.PI);
            this.ctx.fill();

            // Áp dụng Bounce cho toàn bộ thân+đầu
            this.ctx.save();
            this.ctx.translate(centerX, bottomY);
            this.ctx.scale(stageScale, stageScale);
            this.ctx.translate(-centerX, -bottomY); // Chuyển về tâm scale
            this.ctx.translate(0, -bounceY);

            // Tail
            this.ctx.save();
            this.ctx.translate(centerX, bottomY - 40);
            this.ctx.rotate(tailAngle);
            // Different tail for cat vs dog
            if (petType === 'cat') {
                this.ctx.fillStyle = '#616161'; // Xám cho mèo
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.bezierCurveTo(30, -10, 50, -60, 20, -100);
                this.ctx.lineWidth = 15;
                this.ctx.strokeStyle = '#616161';
                this.ctx.lineCap = 'round';
                this.ctx.stroke();
            } else {
                this.ctx.fillStyle = '#C47100';
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.quadraticCurveTo(40, -10, 50, -50);
                this.ctx.quadraticCurveTo(20, -60, 0, -20);
                this.ctx.fill();
            }
            this.ctx.restore();

            let furColor = petType === 'cat' ? '#9E9E9E' : '#EAA221';
            let bellyColor = petType === 'cat' ? '#E0E0E0' : '#FFF3E0';
            let earColor = petType === 'cat' ? '#757575' : '#C47100';

            // Body
            this.ctx.fillStyle = furColor;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 50, bottomY);
            this.ctx.lineTo(centerX + 50, bottomY);
            this.ctx.quadraticCurveTo(centerX + 60, bottomY - 80, centerX + 30, bottomY - 110);
            this.ctx.quadraticCurveTo(centerX, bottomY - 100, centerX - 30, bottomY - 110);
            this.ctx.quadraticCurveTo(centerX - 60, bottomY - 80, centerX - 50, bottomY);
            this.ctx.fill();

            this.ctx.fillStyle = bellyColor;
            this.ctx.beginPath();
            this.ctx.ellipse(centerX, bottomY - 40, 25, 30, 0, 0, 2 * Math.PI);
            this.ctx.fill();

            // Draw Shirt
            if (equipped.shirt) {
                this._drawShirt(equipped.shirt, centerX, bottomY, petType);
            }

            // Head
            this.ctx.save();
            this.ctx.translate(centerX, bottomY - 110 - breathY);
            this.ctx.rotate(headTilt);

            this.ctx.fillStyle = furColor;
            this._drawRoundRect(-70, -60, 140, 120, 45);

            this._drawEars(earLift, earColor, petType);

            // Draw Collar (relative to head bottom)
            if (equipped.collar) {
                this._drawCollar(equipped.collar);
            }

            this.ctx.fillStyle = bellyColor;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 20, 40, 25, 0, 0, 2 * Math.PI);
            this.ctx.fill();

            this.ctx.fillStyle = '#3E2723';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 10, 12.5, 8, 0, 0, 2 * Math.PI);
            this.ctx.fill();

            this._drawBlush();
            this._drawEyes(mood);
            this._drawMouth(mood);

            // Cat whiskers
            if (petType === 'cat') {
                this._drawWhiskers();
            }

            // Draw Hat (on top of head)
            if (equipped.hat) {
                this._drawHat(equipped.hat);
            }

            this.ctx.restore();

            // Paws (nảy theo thân)
            this.ctx.fillStyle = bellyColor;
            this.ctx.beginPath();
            this.ctx.ellipse(centerX - 40, bottomY - 2, 17.5, 12.5, 0, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.ellipse(centerX + 40, bottomY - 2, 17.5, 12.5, 0, 0, 2 * Math.PI);
            this.ctx.fill();

            this.ctx.restore(); // Khôi phục trạng thái Bounce + Scale

            // --- DRAW PARTICLES ---
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 0.015; // Fade out

                if (p.alpha <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }

                this.ctx.globalAlpha = p.alpha;
                this.ctx.fillStyle = p.color;
                this.ctx.font = `${p.isBold ? 'bold ' : ''}${p.size}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(p.text, p.x, p.y);
            }
            this.ctx.globalAlpha = 1.0;

            requestAnimationFrame(drawLoop);
        };
        drawLoop();
    }

    _drawRoundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.fill();
    }

    _drawEars(earLift, color, petType) {
        this.ctx.fillStyle = color;
        if (petType === 'cat') {
            // Pointy ears
            this.ctx.beginPath();
            this.ctx.moveTo(-50, -40);
            this.ctx.lineTo(-70, -100 - earLift);
            this.ctx.lineTo(-20, -50);
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.moveTo(50, -40);
            this.ctx.lineTo(70, -100 - earLift);
            this.ctx.lineTo(20, -50);
            this.ctx.fill();

            // Inner ear
            this.ctx.fillStyle = 'rgba(255, 140, 160, 0.4)';
            this.ctx.beginPath();
            this.ctx.moveTo(-50, -45);
            this.ctx.lineTo(-65, -90 - earLift);
            this.ctx.lineTo(-25, -55);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(50, -45);
            this.ctx.lineTo(65, -90 - earLift);
            this.ctx.lineTo(25, -55);
            this.ctx.fill();
        } else {
            // Floppy dog ears
            this.ctx.beginPath();
            this.ctx.moveTo(-60, -20);
            this.ctx.bezierCurveTo(-90 - earLift, -20 - earLift, -100, 60 - earLift, -60, 50);
            this.ctx.quadraticCurveTo(-50, 20, -60, -20);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(60, -20);
            this.ctx.bezierCurveTo(90 + earLift, -20 - earLift, 100, 60 - earLift, 60, 50);
            this.ctx.quadraticCurveTo(50, 20, 60, -20);
            this.ctx.fill();
        }
    }

    _drawWhiskers() {
        this.ctx.strokeStyle = '#3E2723';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        // Left
        this.ctx.moveTo(-30, 20); this.ctx.lineTo(-60, 15);
        this.ctx.moveTo(-30, 25); this.ctx.lineTo(-65, 25);
        this.ctx.moveTo(-30, 30); this.ctx.lineTo(-60, 35);
        // Right
        this.ctx.moveTo(30, 20); this.ctx.lineTo(60, 15);
        this.ctx.moveTo(30, 25); this.ctx.lineTo(65, 25);
        this.ctx.moveTo(30, 30); this.ctx.lineTo(60, 35);
        this.ctx.stroke();
    }

    _drawBlush() {
        this.ctx.fillStyle = 'rgba(255, 140, 160, 0.4)'; // Màu hồng phấn
        this.ctx.beginPath();
        this.ctx.ellipse(-40, 5, 14, 7, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(40, 5, 14, 7, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }

    _drawEyes(mood) {
        this.ctx.strokeStyle = '#3E2723';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        if (mood === 'happy' || mood === 'playing') {
            this.ctx.beginPath();
            this.ctx.arc(-30, -10, 10, Math.PI, 0);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.arc(30, -10, 10, Math.PI, 0);
            this.ctx.stroke();
        } else if (mood === 'sad') {
            this.ctx.beginPath();
            this.ctx.moveTo(-40, -15);
            this.ctx.lineTo(-20, -10);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(40, -15);
            this.ctx.lineTo(20, -10);
            this.ctx.stroke();
        } else {
            // Idle eyes: Mắt to hơn, long lanh hơn
            this.ctx.fillStyle = '#3E2723';
            this.ctx.beginPath();
            this.ctx.arc(-30, -10, 11, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(30, -10, 11, 0, Math.PI * 2);
            this.ctx.fill();

            // Highlight lớn
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(-34, -13, 3.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(26, -13, 3.5, 0, Math.PI * 2);
            this.ctx.fill();

            // Highlight phụ long lanh
            this.ctx.beginPath();
            this.ctx.arc(-26, -7, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(34, -7, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    _drawMouth(mood) {
        this.ctx.strokeStyle = '#3E2723';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        if (mood === 'happy' || mood === 'playing') {
            this.ctx.fillStyle = '#3E2723';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 35, 15, 10, 0, 0, Math.PI);
            this.ctx.fill();
            this.ctx.fillStyle = '#FF4081';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 38, 8, 8, 0, 0, Math.PI);
            this.ctx.fill();
        } else if (mood === 'sad') {
            this.ctx.beginPath();
            this.ctx.ellipse(0, 40, 10, 5, 0, Math.PI, 2 * Math.PI);
            this.ctx.stroke();
        } else {
            this.ctx.beginPath();
            this.ctx.ellipse(-8, 30, 8, 5, 0, 0, Math.PI);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.ellipse(8, 30, 8, 5, 0, 0, Math.PI);
            this.ctx.stroke();
        }
    }

    _drawShirt(item, centerX, bottomY, petType) {
        if (item === 'shirt_striped') {
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 48, bottomY);
            this.ctx.lineTo(centerX + 48, bottomY);
            this.ctx.lineTo(centerX + 40, bottomY - 70);
            this.ctx.lineTo(centerX - 40, bottomY - 70);
            this.ctx.fill();

            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 5;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 45, bottomY - 15); this.ctx.lineTo(centerX + 45, bottomY - 15);
            this.ctx.moveTo(centerX - 43, bottomY - 35); this.ctx.lineTo(centerX + 43, bottomY - 35);
            this.ctx.moveTo(centerX - 41, bottomY - 55); this.ctx.lineTo(centerX + 41, bottomY - 55);
            this.ctx.stroke();
        }
    }

    _drawCollar(item) {
        if (item === 'collar_red') {
            this.ctx.fillStyle = '#E91E63';
            this.ctx.fillRect(-45, 45, 90, 15);

            // Gold bell
            this.ctx.fillStyle = '#FFC107';
            this.ctx.beginPath();
            this.ctx.arc(0, 60, 12, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#FF9800';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    _drawHat(item) {
        if (item === 'hat_straw') {
            this.ctx.save();
            this.ctx.translate(0, -65); // Move to top of head

            // Hat Brim
            this.ctx.fillStyle = '#FFD54F';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 5, 80, 20, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();

            // Hat Top
            this.ctx.fillStyle = '#FFCA28';
            this.ctx.beginPath();
            this.ctx.ellipse(0, -10, 45, 30, 0, Math.PI, Math.PI * 2); // Top Dome
            this.ctx.lineTo(45, 5);
            this.ctx.lineTo(-45, 5);
            this.ctx.fill();
            this.ctx.stroke();

            // Red Ribbon
            this.ctx.fillStyle = '#F44336';
            this.ctx.fillRect(-45, -5, 90, 10);

            this.ctx.restore();
        }
    }
}
