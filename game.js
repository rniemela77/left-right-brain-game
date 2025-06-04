const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: window.innerWidth,
        height: window.innerHeight,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: '#222222',
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);
let leftCircle, rightCircle;
let targetBlue, targetRed;
let joystickZones = {};
let leftIndicator, rightIndicator;
let leftThumbLine, rightThumbLine;
let leftSparkle, rightSparkle;
const MAX_SPEED = 300;
const MIN_TARGET_SPEED = 20;
const MAX_TARGET_SPEED = 80;
let leftParticles = [];
let rightParticles = [];
let leftSpawnCooldown = 0;
let rightSpawnCooldown = 0;

// Particle system configuration
const PARTICLE_CONFIG = {
    // Spawn settings
    SPAWN_COOLDOWN: 0.03,        // Time between particle bursts
    PARTICLES_PER_BURST: 8,      // Base number of particles per burst
    PARTICLES_PER_DIRECTION: 2,  // How many particles to spawn at each base angle
    
    // Movement
    BASE_SPEED: 60,             // Reduced from 80 for tighter effect
    SPEED_VARIANCE: 20,         // Reduced from 40 for more consistent movement
    ANGLE_SPREAD: 0.3,          // Reduced from 0.5 for tighter spread
    
    // Oscillation
    OSC_SPEED_MIN: 5,          
    OSC_SPEED_VARIANCE: 5,     
    OSC_MAGNITUDE: 0.3,        // Reduced from 0.5 for less weaving
    
    // Appearance
    SIZE_MIN: 1,               // Reduced from 2 for smaller particles
    SIZE_VARIANCE: 1.5,        // Reduced from 3 for more consistent sizes
    SIZE_DECAY: 0.96,          // Slightly faster decay
    MIN_SIZE: 0.3,             // Reduced from 0.5 for smaller end size
    
    // Life and fade
    LIFE_DECAY: 0.02,          // Slightly faster decay
    ALPHA_MULTIPLIER: 2,       
    
    // Color
    SHIMMER_MAGNITUDE: 0.2,    
    COLOR_VARIANCE: 40,        
};

class Particle {
    constructor(x, y, angle, speed) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.baseSpeed = speed;
        this.speed = speed * (0.5 + Math.random() * 0.5);
        this.size = PARTICLE_CONFIG.SIZE_MIN + Math.random() * PARTICLE_CONFIG.SIZE_VARIANCE;
        this.life = 1;
        this.oscillation = Math.random() * Math.PI * 2;
        this.oscillationSpeed = PARTICLE_CONFIG.OSC_SPEED_MIN + Math.random() * PARTICLE_CONFIG.OSC_SPEED_VARIANCE;
    }

    update(delta) {
        this.oscillation += this.oscillationSpeed * delta;
        
        const perpAngle = this.angle + Math.PI/2;
        const oscillationAmount = Math.sin(this.oscillation) * PARTICLE_CONFIG.OSC_MAGNITUDE;
        
        this.x += (Math.cos(this.angle) * this.speed + 
                   Math.cos(perpAngle) * oscillationAmount * this.baseSpeed) * delta;
        this.y += (Math.sin(this.angle) * this.speed + 
                   Math.sin(perpAngle) * oscillationAmount * this.baseSpeed) * delta;
        
        this.life -= PARTICLE_CONFIG.LIFE_DECAY;
        this.alpha = Math.min(1, this.life * PARTICLE_CONFIG.ALPHA_MULTIPLIER);
        this.size = Math.max(PARTICLE_CONFIG.MIN_SIZE, this.size * PARTICLE_CONFIG.SIZE_DECAY);
        return this.life > 0;
    }
}

function preload() {
    // No assets needed
}

function create() {
    this.input.addPointer(1);
    const w = this.scale.width;
    const h = this.scale.height;

    // Define joystick areas
    const zoneHeight = h * 0.25;
    const zoneY = h - zoneHeight;
    joystickZones.left = this.add.rectangle(0, zoneY, w / 2, zoneHeight, 0x444444).setOrigin(0);
    joystickZones.right = this.add.rectangle(w / 2, zoneY, w / 2, zoneHeight, 0x444444).setOrigin(0);

    // Create controllable circle outlines (slightly larger)
    const radius = Math.min(w, h) * 0.1;
    leftCircle = this.add.arc(w * 0.25, h * 0.5, radius, 0, 360).setStrokeStyle(4, 0x0000ff).setFillStyle(0x000000, 0);
    this.physics.add.existing(leftCircle);
    leftCircle.body.setCircle(radius);
    leftCircle.body.setCollideWorldBounds(true);
    leftCircle.body.setBounce(0.5);

    rightCircle = this.add.arc(w * 0.75, h * 0.5, radius, 0, 360).setStrokeStyle(4, 0xff0000).setFillStyle(0x000000, 0);
    this.physics.add.existing(rightCircle);
    rightCircle.body.setCircle(radius);
    rightCircle.body.setCollideWorldBounds(true);
    rightCircle.body.setBounce(0.5);

    // Direction indicators as graphics
    leftIndicator = this.add.graphics();
    rightIndicator = this.add.graphics();
    // Thumb connection lines
    leftThumbLine = this.add.graphics();
    rightThumbLine = this.add.graphics();
    // Sparkle graphics
    leftSparkle = this.add.graphics();
    rightSparkle = this.add.graphics();

    // Create moving target dots
    const dotRadius = radius * 0.3;
    targetBlue = this.add.circle(w * 0.25, h * 0.25, dotRadius, 0x8888ff);
    this.physics.add.existing(targetBlue);
    targetBlue.body.setCircle(dotRadius);
    targetBlue.body.setCollideWorldBounds(true);
    targetBlue.body.setBounce(1);

    targetRed = this.add.circle(w * 0.75, h * 0.25, dotRadius, 0xff8888);
    this.physics.add.existing(targetRed);
    targetRed.body.setCircle(dotRadius);
    targetRed.body.setCollideWorldBounds(true);
    targetRed.body.setBounce(1);

    // Assign initial random velocities to targets
    setRandomVelocity(targetBlue);
    setRandomVelocity(targetRed);

    this.scale.on('resize', resize, this);
}

function update() {
    const w = this.scale.width;
    const h = this.scale.height;
    const zoneHeight = h * 0.25;
    const maxDist = zoneHeight / 2;

    // Clear graphics
    leftThumbLine.clear();
    rightThumbLine.clear();
    leftIndicator.clear();
    rightIndicator.clear();
    leftSparkle.clear();
    rightSparkle.clear();

    // Reset velocities
    leftCircle.body.setVelocity(0);
    rightCircle.body.setVelocity(0);

    let leftPointer = null;
    let rightPointer = null;

    // Process input for joysticks and track pointers
    this.input.manager.pointers.forEach(pointer => {
        if (!pointer.isDown) return;
        const px = pointer.x;
        const py = pointer.y;

        // Left joystick
        if (py > h - zoneHeight && px < w / 2) {
            const centerX = (w / 2) / 2;
            const centerY = h - zoneHeight / 2;
            let dx = px - centerX;
            let dy = py - centerY;
            let factorX = Phaser.Math.Clamp(dx / maxDist, -1, 1);
            let factorY = Phaser.Math.Clamp(dy / maxDist, -1, 1);
            leftCircle.body.setVelocity(factorX * MAX_SPEED, factorY * MAX_SPEED);
            leftPointer = { x: px, y: py };
        }

        // Right joystick
        if (py > h - zoneHeight && px > w / 2) {
            const centerX = w / 2 + (w / 2) / 2;
            const centerY = h - zoneHeight / 2;
            let dx = px - centerX;
            let dy = py - centerY;
            let factorX = Phaser.Math.Clamp(dx / maxDist, -1, 1);
            let factorY = Phaser.Math.Clamp(dy / maxDist, -1, 1);
            rightCircle.body.setVelocity(factorX * MAX_SPEED, factorY * MAX_SPEED);
            rightPointer = { x: px, y: py };
        }
    });

    // Draw direction indicators
    drawIndicator(leftIndicator, leftCircle);
    drawIndicator(rightIndicator, rightCircle);

    // Draw thumb connection lines
    if (leftPointer) {
        leftThumbLine.lineStyle(2, 0x0000ff);
        leftThumbLine.beginPath();
        leftThumbLine.moveTo(leftCircle.x, leftCircle.y);
        leftThumbLine.lineTo(leftPointer.x, leftPointer.y);
        leftThumbLine.strokePath();
    }
    if (rightPointer) {
        rightThumbLine.lineStyle(2, 0xff0000);
        rightThumbLine.beginPath();
        rightThumbLine.moveTo(rightCircle.x, rightCircle.y);
        rightThumbLine.lineTo(rightPointer.x, rightPointer.y);
        rightThumbLine.strokePath();
    }

    // Update cooldowns
    leftSpawnCooldown = Math.max(0, leftSpawnCooldown - (1/60));
    rightSpawnCooldown = Math.max(0, rightSpawnCooldown - (1/60));

    // Update overlap checks
    if (this.physics.overlap(leftCircle, targetBlue)) {
        drawEnhancedSparkle(leftSparkle, targetBlue.x, targetBlue.y, leftCircle.radius * 0.4, true);
    }
    if (this.physics.overlap(rightCircle, targetRed)) {
        drawEnhancedSparkle(rightSparkle, targetRed.x, targetRed.y, rightCircle.radius * 0.4, false);
    }

    // Update and draw particles
    leftParticles = updateParticles(leftSparkle, leftParticles, 0x8888ff);
    rightParticles = updateParticles(rightSparkle, rightParticles, 0xff8888);
}

function drawIndicator(indicator, circle) {
    const vx = circle.body.velocity.x;
    const vy = circle.body.velocity.y;
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > 0) {
        const ux = vx / speed;
        const uy = vy / speed;
        const length = (speed / MAX_SPEED) * circle.radius * 3;
        indicator.lineStyle(2, 0xffffff);
        indicator.beginPath();
        indicator.moveTo(circle.x, circle.y);
        indicator.lineTo(circle.x + ux * length, circle.y + uy * length);
        indicator.strokePath();
    }
}

function drawEnhancedSparkle(graphics, x, y, spread, isLeft) {
    const cooldown = isLeft ? leftSpawnCooldown : rightSpawnCooldown;
    if (cooldown <= 0) {
        createParticles(x, y, isLeft);
        if (isLeft) {
            leftSpawnCooldown = PARTICLE_CONFIG.SPAWN_COOLDOWN;
        } else {
            rightSpawnCooldown = PARTICLE_CONFIG.SPAWN_COOLDOWN;
        }
    }
}

function setRandomVelocity(target) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = Phaser.Math.FloatBetween(MIN_TARGET_SPEED, MAX_TARGET_SPEED);
    target.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    target.body.setCollideWorldBounds(true);
    target.body.onWorldBounds = true;
}

function resize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    this.cameras.resize(width, height);

    const zoneHeight = height * 0.25;
    const zoneY = height - zoneHeight;
    joystickZones.left.setPosition(0, zoneY).setSize(width / 2, zoneHeight);
    joystickZones.right.setPosition(width / 2, zoneY).setSize(width / 2, zoneHeight);

    const radius = Math.min(width, height) * 0.1;
    leftCircle.setPosition(width * 0.25, height * 0.5);
    leftCircle.setRadius(radius);
    leftCircle.body.setCircle(radius);
    rightCircle.setPosition(width * 0.75, height * 0.5);
    rightCircle.setRadius(radius);
    rightCircle.body.setCircle(radius);

    const dotRadius = radius * 0.3;
    targetBlue.setPosition(width * 0.25, height * 0.25);
    targetBlue.setRadius(dotRadius);
    targetBlue.body.setCircle(dotRadius);
    targetRed.setPosition(width * 0.75, height * 0.25);
    targetRed.setRadius(dotRadius);
    targetRed.body.setCircle(dotRadius);
}

function createParticles(x, y, isLeft) {
    const particles = isLeft ? leftParticles : rightParticles;
    const numParticles = PARTICLE_CONFIG.PARTICLES_PER_BURST;
    
    for (let i = 0; i < numParticles; i++) {
        const baseAngle = (i / numParticles) * Math.PI * 2;
        for (let j = 0; j < PARTICLE_CONFIG.PARTICLES_PER_DIRECTION; j++) {
            const angle = baseAngle + (Math.random() - 0.5) * PARTICLE_CONFIG.ANGLE_SPREAD;
            const speed = PARTICLE_CONFIG.BASE_SPEED + Math.random() * PARTICLE_CONFIG.SPEED_VARIANCE;
            particles.push(new Particle(x, y, angle, speed));
        }
    }
}

function updateParticles(graphics, particles, color) {
    graphics.clear();
    particles = particles.filter(particle => {
        if (particle.update(1/60)) {
            const shimmer = Math.sin(particle.oscillation) * PARTICLE_CONFIG.SHIMMER_MAGNITUDE;
            const r = 0xFF;
            const g = Math.floor(0xD7 + shimmer * PARTICLE_CONFIG.COLOR_VARIANCE);
            const b = Math.floor(shimmer * PARTICLE_CONFIG.COLOR_VARIANCE);
            const color = (r << 16) | (g << 8) | b;
            
            graphics.fillStyle(color, particle.alpha);
            graphics.fillCircle(particle.x, particle.y, particle.size);
            return true;
        }
        return false;
    });
    return particles;
} 