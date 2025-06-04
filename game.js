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
let scoreText;
let score = 0;
let scoreTimer = 0;
const SCORE_INTERVAL = 100; // 1 second in milliseconds
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
    SPAWN_COOLDOWN: 0.1,
    PARTICLES_PER_BURST: 12,    // More particles
    SPAWN_RADIUS: 8,           // Spawn within this radius
    
    // Movement
    BASE_SPEED: 120,            // Faster for more energy
    SPEED_VARIANCE: 40,        // More speed variance
    ANGLE_SPREAD: 6.28,        // Full circle (2*PI) for random directions
    
    // Appearance
    START_SIZE: 5,            // Bigger starting size
    MIN_SIZE: 2,              // Larger minimum size
    SIZE_DECAY: 0.94,         // Slower decay - larger number = faster decay
    ALPHA_START: 0.8,         // More visible
    
    // Life
    LIFE_DECAY: 0.03,         // Longer life
    
    // Colors
    COLORS: [0xFFD700, 0xFFFFFF],  // Gold and White
    WHITE_PARTICLE_CHANCE: 0.4      // 40% chance for white particles
};

const TARGET_CONFIG = {
    // Size as a fraction of the player circle radius
    SIZE_RATIO: 0.1,
    // Base positions
    LEFT_X_RATIO: 0.25,
    RIGHT_X_RATIO: 0.75,
    Y_RATIO: 0.25
};

class Particle {
    constructor(x, y, angle) {
        // Random position within spawn radius
        const r = Math.random() * PARTICLE_CONFIG.SPAWN_RADIUS;
        const a = Math.random() * Math.PI * 2;
        this.x = x + Math.cos(a) * r;
        this.y = y + Math.sin(a) * r;
        
        // Random direction
        this.angle = Math.random() * Math.PI * 2;
        this.speed = PARTICLE_CONFIG.BASE_SPEED + (Math.random() - 0.5) * PARTICLE_CONFIG.SPEED_VARIANCE;
        this.life = 1;
        this.size = PARTICLE_CONFIG.START_SIZE;
        this.color = Math.random() < PARTICLE_CONFIG.WHITE_PARTICLE_CHANCE ? 
            PARTICLE_CONFIG.COLORS[1] : PARTICLE_CONFIG.COLORS[0];
    }

    update(delta) {
        this.x += Math.cos(this.angle) * this.speed * delta;
        this.y += Math.sin(this.angle) * this.speed * delta;
        this.life -= PARTICLE_CONFIG.LIFE_DECAY;
        this.size *= PARTICLE_CONFIG.SIZE_DECAY;
        return this.life > 0 && this.size >= PARTICLE_CONFIG.MIN_SIZE;
    }
}

class Target {
    constructor(scene, x, y, radius, color, isLeft) {
        this.scene = scene;
        this.isLeft = isLeft;
        this.particles = isLeft ? leftParticles : rightParticles;
        this.sparkleGraphics = isLeft ? leftSparkle : rightSparkle;
        this.baseRadius = radius;
        this.sizeRatio = TARGET_CONFIG.SIZE_RATIO;
        
        // Create the dot
        this.dot = scene.add.circle(x, y, this.calculateRadius(), color);
        scene.physics.add.existing(this.dot);
        this.dot.body.setCircle(this.calculateRadius());
        this.dot.body.setCollideWorldBounds(true);
        this.dot.body.setBounce(1);
        
        // Initialize movement
        this.setRandomVelocity();
        
        // Cooldown for particle spawning
        this.spawnCooldown = 0;
    }

    calculateRadius() {
        return this.baseRadius * this.sizeRatio;
    }

    setSize(ratio) {
        this.sizeRatio = ratio;
        const newRadius = this.calculateRadius();
        this.dot.setRadius(newRadius);
        this.dot.body.setCircle(newRadius);
    }
    
    update(delta) {
        // Update spawn cooldown
        this.spawnCooldown = Math.max(0, this.spawnCooldown - delta);
        
        // Check if we need to randomize velocity (if moving too slow)
        const velocity = this.dot.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (speed < MIN_TARGET_SPEED) {
            this.setRandomVelocity();
        }
    }
    
    checkOverlap(circle) {
        const isOverlapping = this.scene.physics.overlap(circle, this.dot);
        if (isOverlapping) {
            if (this.spawnCooldown <= 0) {
                this.createSparkle();
                this.spawnCooldown = PARTICLE_CONFIG.SPAWN_COOLDOWN;
            }
        }
        return isOverlapping;
    }
    
    createSparkle() {
        createParticles(this.dot.x, this.dot.y, this.isLeft);
    }
    
    setRandomVelocity() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = Phaser.Math.FloatBetween(MIN_TARGET_SPEED, MAX_TARGET_SPEED);
        this.dot.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
    }
    
    resize(width, height) {
        this.baseRadius = Math.min(width, height) * 0.1;
        const newRadius = this.calculateRadius();
        this.dot.setRadius(newRadius);
        this.dot.body.setCircle(newRadius);
        
        // Reposition based on whether it's left or right
        const x = this.isLeft ? width * TARGET_CONFIG.LEFT_X_RATIO : width * TARGET_CONFIG.RIGHT_X_RATIO;
        const y = height * TARGET_CONFIG.Y_RATIO;
        this.dot.setPosition(x, y);
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

    // Create controllable circles
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

    // Direction indicators and graphics
    leftIndicator = this.add.graphics();
    rightIndicator = this.add.graphics();
    leftThumbLine = this.add.graphics();
    rightThumbLine = this.add.graphics();
    leftSparkle = this.add.graphics();
    rightSparkle = this.add.graphics();

    // Create targets using the new class
    targetBlue = new Target(this, w * TARGET_CONFIG.LEFT_X_RATIO, h * TARGET_CONFIG.Y_RATIO, radius, 0x8888ff, true);
    targetRed = new Target(this, w * TARGET_CONFIG.RIGHT_X_RATIO, h * TARGET_CONFIG.Y_RATIO, radius, 0xff8888, false);

    // Add score display
    const textStyle = {
        font: 'bold 200px Arial',
        fill: '#ffffff',
        align: 'center'
    };
    scoreText = this.add.text(w/2, h/2, '0', textStyle)
        .setOrigin(0.5)
        .setAlpha(0.15)
        .setDepth(1);

    this.scale.on('resize', resize, this);
}

function update() {
    const w = this.scale.width;
    const h = this.scale.height;
    const zoneHeight = h * 0.25;
    const maxDist = zoneHeight / 2;

    // Update score timer
    scoreTimer += this.game.loop.delta;
    if (scoreTimer >= SCORE_INTERVAL) {
        // Add points for each contained dot
        let pointsThisInterval = 0;
        if (targetBlue.checkOverlap(leftCircle)) {
            pointsThisInterval++;
        }
        if (targetRed.checkOverlap(rightCircle)) {
            pointsThisInterval++;
        }
        if (pointsThisInterval > 0) {
            score += pointsThisInterval;
            scoreText.setText(score.toString());
        }
        scoreTimer = 0;
    }

    // Update score position on resize
    scoreText.setPosition(w/2, h/2);

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

    // Draw indicators
    drawIndicator(leftIndicator, leftCircle);
    drawIndicator(rightIndicator, rightCircle);

    // Draw thumb lines
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

    // Update targets and check overlaps
    targetBlue.update(1/60);
    targetRed.update(1/60);
    targetBlue.checkOverlap(leftCircle);
    targetRed.checkOverlap(rightCircle);

    // Update particles
    leftParticles = updateParticles(leftSparkle, leftParticles);
    rightParticles = updateParticles(rightSparkle, rightParticles);
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

    // Resize targets
    targetBlue.resize(width, height);
    targetRed.resize(width, height);

    // Update score text position
    scoreText.setPosition(width/2, height/2);
}

function createParticles(x, y, isLeft) {
    const particles = isLeft ? leftParticles : rightParticles;
    
    // Create particles
    for (let i = 0; i < PARTICLE_CONFIG.PARTICLES_PER_BURST; i++) {
        particles.push(new Particle(x, y));
    }
}

function updateParticles(graphics, particles) {
    graphics.clear();
    if (particles.length > 0) {
        // Group particles by color for efficient rendering
        const goldParticles = particles.filter(p => p.color === PARTICLE_CONFIG.COLORS[0]);
        const whiteParticles = particles.filter(p => p.color === PARTICLE_CONFIG.COLORS[1]);
        
        // Update and draw gold particles
        if (goldParticles.length > 0) {
            graphics.fillStyle(PARTICLE_CONFIG.COLORS[0], PARTICLE_CONFIG.ALPHA_START);
            goldParticles.forEach(particle => {
                if (particle.update(1/60)) {
                    graphics.fillCircle(particle.x, particle.y, particle.size);
                }
            });
        }
        
        // Update and draw white particles
        if (whiteParticles.length > 0) {
            graphics.fillStyle(PARTICLE_CONFIG.COLORS[1], PARTICLE_CONFIG.ALPHA_START);
            whiteParticles.forEach(particle => {
                if (particle.update(1/60)) {
                    graphics.fillCircle(particle.x, particle.y, particle.size);
                }
            });
        }
        
        // Remove dead particles
        particles = particles.filter(particle => 
            particle.life > 0 && particle.size >= PARTICLE_CONFIG.MIN_SIZE
        );
    }
    return particles;
} 