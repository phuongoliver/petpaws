export function drawPetStatic(ctx, size, petType, stageScale, equipped) {
    const centerX = size.width / 2;
    const bottomY = size.height * 0.95;

    ctx.clearRect(0, 0, size.width, size.height);

    // GROUND SHADOW
    ctx.fillStyle = 'rgba(93, 64, 55, 0.2)';
    ctx.beginPath();
    ctx.ellipse(centerX, bottomY, 70 * stageScale * 0.5, 8 * stageScale * 0.5, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.save();
    ctx.translate(centerX, bottomY);
    ctx.scale(stageScale * 0.5, stageScale * 0.5); // Scale down for smaller container
    ctx.translate(-centerX, -bottomY);

    // Tail
    ctx.save();
    ctx.translate(centerX, bottomY - 40);
    if (petType === 'cat') {
        ctx.fillStyle = '#616161';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(30, -10, 50, -60, 20, -100);
        ctx.lineWidth = 15;
        ctx.strokeStyle = '#616161';
        ctx.lineCap = 'round';
        ctx.stroke();
    } else {
        ctx.fillStyle = '#C47100';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(40, -10, 50, -50);
        ctx.quadraticCurveTo(20, -60, 0, -20);
        ctx.fill();
    }
    ctx.restore();

    let furColor = petType === 'cat' ? '#9E9E9E' : '#EAA221';
    let bellyColor = petType === 'cat' ? '#E0E0E0' : '#FFF3E0';
    let earColor = petType === 'cat' ? '#757575' : '#C47100';

    // Body
    ctx.fillStyle = furColor;
    ctx.beginPath();
    ctx.moveTo(centerX - 50, bottomY);
    ctx.lineTo(centerX + 50, bottomY);
    ctx.quadraticCurveTo(centerX + 60, bottomY - 80, centerX + 30, bottomY - 110);
    ctx.quadraticCurveTo(centerX, bottomY - 100, centerX - 30, bottomY - 110);
    ctx.quadraticCurveTo(centerX - 60, bottomY - 80, centerX - 50, bottomY);
    ctx.fill();

    ctx.fillStyle = bellyColor;
    ctx.beginPath();
    ctx.ellipse(centerX, bottomY - 40, 25, 30, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Shirt
    if (equipped && equipped.shirt === 'shirt_striped') {
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.moveTo(centerX - 48, bottomY);
        ctx.lineTo(centerX + 48, bottomY);
        ctx.lineTo(centerX + 40, bottomY - 70);
        ctx.lineTo(centerX - 40, bottomY - 70);
        ctx.fill();

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(centerX - 45, bottomY - 15); ctx.lineTo(centerX + 45, bottomY - 15);
        ctx.moveTo(centerX - 43, bottomY - 35); ctx.lineTo(centerX + 43, bottomY - 35);
        ctx.moveTo(centerX - 41, bottomY - 55); ctx.lineTo(centerX + 41, bottomY - 55);
        ctx.stroke();
    }

    // Head
    ctx.save();
    ctx.translate(centerX, bottomY - 110);
    ctx.fillStyle = furColor;
    _drawRoundRect(ctx, -70, -60, 140, 120, 45);

    _drawEars(ctx, 0, earColor, petType);

    // Collar
    if (equipped && equipped.collar === 'collar_red') {
        ctx.fillStyle = '#E91E63';
        ctx.fillRect(-45, 45, 90, 15);
        ctx.fillStyle = '#FFC107';
        ctx.beginPath();
        ctx.arc(0, 60, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FF9800';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ctx.fillStyle = bellyColor;
    ctx.beginPath();
    ctx.ellipse(0, 20, 40, 25, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#3E2723';
    ctx.beginPath();
    ctx.ellipse(0, 10, 12.5, 8, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Blush
    ctx.fillStyle = 'rgba(255, 140, 160, 0.4)';
    ctx.beginPath(); ctx.ellipse(-40, 5, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(40, 5, 14, 7, 0, 0, Math.PI * 2); ctx.fill();

    // Eyes
    ctx.fillStyle = '#3E2723';
    ctx.beginPath(); ctx.arc(-30, -10, 11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(30, -10, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(-34, -13, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(26, -13, 3.5, 0, Math.PI * 2); ctx.fill();

    // Mouth
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(-8, 30, 8, 5, 0, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(8, 30, 8, 5, 0, 0, Math.PI); ctx.stroke();

    // Whiskers
    if (petType === 'cat') {
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-30, 20); ctx.lineTo(-60, 15);
        ctx.moveTo(-30, 25); ctx.lineTo(-65, 25);
        ctx.moveTo(-30, 30); ctx.lineTo(-60, 35);
        ctx.moveTo(30, 20); ctx.lineTo(60, 15);
        ctx.moveTo(30, 25); ctx.lineTo(65, 25);
        ctx.moveTo(30, 30); ctx.lineTo(60, 35);
        ctx.stroke();
    }

    // Hat
    if (equipped && equipped.hat === 'hat_straw') {
        ctx.save();
        ctx.translate(0, -65);
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath(); ctx.ellipse(0, 5, 80, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFCA28';
        ctx.beginPath(); ctx.ellipse(0, -10, 45, 30, 0, Math.PI, Math.PI * 2);
        ctx.lineTo(45, 5); ctx.lineTo(-45, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#F44336';
        ctx.fillRect(-45, -5, 90, 10);
        ctx.restore();
    }
    ctx.restore();

    // Paws
    ctx.fillStyle = bellyColor;
    ctx.beginPath(); ctx.ellipse(centerX - 40, bottomY - 2, 17.5, 12.5, 0, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.ellipse(centerX + 40, bottomY - 2, 17.5, 12.5, 0, 0, 2 * Math.PI); ctx.fill();

    ctx.restore();
}

function _drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.fill();
}

function _drawEars(ctx, earLift, color, petType) {
    ctx.fillStyle = color;
    if (petType === 'cat') {
        ctx.beginPath(); ctx.moveTo(-50, -40); ctx.lineTo(-70, -100 - earLift); ctx.lineTo(-20, -50); ctx.fill();
        ctx.beginPath(); ctx.moveTo(50, -40); ctx.lineTo(70, -100 - earLift); ctx.lineTo(20, -50); ctx.fill();
        ctx.fillStyle = 'rgba(255, 140, 160, 0.4)';
        ctx.beginPath(); ctx.moveTo(-50, -45); ctx.lineTo(-65, -90 - earLift); ctx.lineTo(-25, -55); ctx.fill();
        ctx.beginPath(); ctx.moveTo(50, -45); ctx.lineTo(65, -90 - earLift); ctx.lineTo(25, -55); ctx.fill();
    } else {
        ctx.beginPath(); ctx.moveTo(-60, -20); ctx.bezierCurveTo(-90 - earLift, -20 - earLift, -100, 60 - earLift, -60, 50); ctx.quadraticCurveTo(-50, 20, -60, -20); ctx.fill();
        ctx.beginPath(); ctx.moveTo(60, -20); ctx.bezierCurveTo(90 + earLift, -20 - earLift, 100, 60 - earLift, 60, 50); ctx.quadraticCurveTo(50, 20, 60, -20); ctx.fill();
    }
}
