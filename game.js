// Configuration constants
const PARTICLE_CONFIG = {
    // Spawn settings
    SPAWN_COOLDOWN: 0.1,
    PARTICLES_PER_BURST: 12,    // More particles
    SPAWN_RADIUS: 4,           // Smaller spawn radius (was 8)
    
    // Movement
    BASE_SPEED: 120,            // Faster for more energy
    SPEED_VARIANCE: 40,        // More speed variance
    ANGLE_SPREAD: 6.28,        // Full circle (2*PI) for random directions
    
    // Appearance
    START_SIZE: 3,            // Smaller particles (was 5)
    MIN_SIZE: 1,              // Smaller minimum size (was 2)
    SIZE_DECAY: 0.94,         // Slower decay - larger number = faster decay
    ALPHA_START: 0.4,         // Reduced from 0.8 to 0.4 for less prominent particles
    
    // Life
    LIFE_DECAY: 0.03,         // Longer life
    
    // Colors
    WHITE_PARTICLE_CHANCE: 0.4      // 40% chance for white particles
};

const TARGET_CONFIG = {
    // Size as a fraction of the player circle radius
    SIZE_RATIO: 0.15,
    // Base positions
    LEFT_X_RATIO: 0.25,
    RIGHT_X_RATIO: 0.75,
    Y_RATIO: 0.25,
    // Health settings
    MAX_HEALTH: 50,
    HEALTH_DRAIN_INTERVAL: 100, // 0.1 seconds in milliseconds
    HEALTH_DRAIN_AMOUNT: 1,
    // Minimum dot size in pixels
    MIN_DOT_SIZE: 5,
    // Outline settings
    OUTLINE_WIDTH: 2,
    OUTLINE_COLOR: 0xFFFFFF,  // White outline
    OUTLINE_ALPHA: 0.8        // Slightly transparent to be less harsh
};

const PLAYER_CONFIG = {
    // Size
    SIZE_RATIO: 0.15,           // Circle size relative to screen size
    OUTLINE_WIDTH: 2,          // Width of the circle outline
    OUTLINE_ALPHA: 0.4,        // Added alpha for circle outline
    FILL_COLOR: 0x000000,     // Inside color of circle
    FILL_ALPHA: 0,            // Transparency of fill (0 = transparent)
    INDICATOR_WIDTH: 2,       // Width of direction indicator line
    INDICATOR_COLOR: 0xFFFFFF, // Color of direction indicator
    INDICATOR_ALPHA: 0.3,      // Added alpha for direction indicator
    INDICATOR_LENGTH: 3,      // Length multiplier for direction indicator
    THUMB_WIDTH: 2,           // Width of thumb line to joystick
    THUMB_ALPHA: 0.3,         // Added alpha for thumb line
    
    // Movement
    BOUNCE: 0.5,              // Bounce factor when hitting walls
    CONTROL_SENSITIVITY: 1.0, // Maximum sensitivity for direct 1:1 control
    DEADZONE: 0.01,           // Minimal deadzone, just enough to prevent jitter
    ACCELERATION: 0.8,        // How quickly to reach target speed (0.1 to 1.0)
    
    // Visuals
    FILL_COLOR: 0x000000,     // Inside color of circle
    FILL_ALPHA: 0,            // Transparency of fill (0 = transparent)
    INDICATOR_WIDTH: 2,       // Width of direction indicator line
    INDICATOR_COLOR: 0xFFFFFF, // Color of direction indicator
    INDICATOR_LENGTH: 3,      // Length multiplier for direction indicator
    THUMB_WIDTH: 2,           // Width of thumb line to joystick
    
    // Positions
    LEFT_X_RATIO: 0.25,       // X position for left circle
    RIGHT_X_RATIO: 0.75,      // X position for right circle
    Y_RATIO: 0.5             // Y position for both circles
};

// Create scenes
class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    create(data) {
        const w = this.scale.width;
        const h = this.scale.height;

        // Calculate responsive text sizes
        const titleSize = Math.min(72, Math.floor(w * 0.08));
        const instructionsSize = Math.min(24, Math.floor(w * 0.03));
        const scoreSize = Math.min(48, Math.floor(w * 0.06));
        const buttonTextSize = Math.min(48, Math.floor(w * 0.06));
        const creditsSize = Math.min(32, Math.floor(w * 0.04)); // Increased size

        // Add title with improved text settings
        const titleStyle = {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
            fontSize: `${titleSize}px`,
            fontStyle: 'bold',
            align: 'center',
            resolution: 2,
            antialias: true,
            padding: { x: 4, y: 4 }
        };

        // Add the two parts of the title centered together
        const hemisphereText = this.add.text(0, 0, 'Hemisphere', { 
            ...titleStyle,
            color: '#99bbff' // Light blue to match left side
        })
        .setOrigin(0, 0.5);

        const hunterText = this.add.text(hemisphereText.width, 0, 'Hunter', { 
            ...titleStyle,
            color: '#ff9999' // Light red to match right side
        })
        .setOrigin(0, 0.5);

        // Create a container to hold both text objects
        const titleContainer = this.add.container(0, 0, [hemisphereText, hunterText]);
        const totalWidth = hemisphereText.width + hunterText.width;
        titleContainer.setPosition(w/2 - totalWidth/2, h/4);

        // Update the resize handler
        this.titleContainer = titleContainer; // Store reference for resize

        // Add instructions
        const instructionsStyle = {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
            fontSize: `${instructionsSize}px`,
            fontStyle: 'bold',
            align: 'center',
            resolution: 2,
            antialias: true,
            padding: { x: 4, y: 4 }
        };

        const lineHeight = instructionsSize * 1.4; // Line height for spacing
        const startY = h/2 - 80; // Start higher to accommodate all lines

        // First line
        this.add.text(w/2, startY, 'Touch and drag on either side of the screen', 
            { ...instructionsStyle, color: '#ffffff' })
            .setOrigin(0.5)
            .setAlpha(0.9);

        // Blue joystick line
        this.add.text(w/2, startY + lineHeight, 'Left joystick: Catch the blue dots', 
            { ...instructionsStyle, color: '#99bbff' })
            .setOrigin(0.5)
            .setAlpha(0.9);

        // Red joystick line
        this.add.text(w/2, startY + lineHeight * 2, 'Right joystick: Catch the red dots', 
            { ...instructionsStyle, color: '#ff9999' })
            .setOrigin(0.5)
            .setAlpha(0.9);

        // Fourth line
        this.add.text(w/2, startY + lineHeight * 3, 'Dots get faster each time they respawn', 
            { ...instructionsStyle, color: '#ffffff' })
            .setOrigin(0.5)
            .setAlpha(0.9);

        // Fifth line
        this.add.text(w/2, startY + lineHeight * 4, 'Timer extends when dots take damage', 
            { ...instructionsStyle, color: '#ffffff' })
            .setOrigin(0.5)
            .setAlpha(0.9);

        // Show last score if exists
        if (data.lastScore !== undefined) {
            const scoreStyle = {
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                fontSize: `${scoreSize}px`,
                fontStyle: 'bold',
                color: '#ffffff',
                align: 'center',
                resolution: 2,
                antialias: true,
                padding: { x: 4, y: 4 }
            };
            this.add.text(w/2, h/2 + 50, `Last Score: ${data.lastScore}`, scoreStyle)
                .setOrigin(0.5);
        }

        // Add play button
        const buttonStyle = {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
            fontSize: `${buttonTextSize}px`,
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center',
            resolution: 2,
            antialias: true,
            padding: { x: 4, y: 4 }
        };
        
        const playButton = this.add.container(w/2, h/2 + 150);
        
        // Scale button background based on text size
        const buttonWidth = Math.max(200, buttonTextSize * 4);
        const buttonHeight = Math.max(80, buttonTextSize * 1.6);
        
        // Button background
        const buttonBg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x444444)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => buttonBg.setFillStyle(0x666666))
            .on('pointerout', () => buttonBg.setFillStyle(0x444444))
            .on('pointerdown', () => buttonBg.setFillStyle(0x222222))
            .on('pointerup', () => {
                this.scene.start('GameScene');
            });
            
        // Button text
        const buttonText = this.add.text(0, 0, 'Play', buttonStyle)
            .setOrigin(0.5);
            
        playButton.add([buttonBg, buttonText]);

        // Add credits at the bottom
        const creditsStyle = {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
            fontSize: `${creditsSize}px`,
            fontStyle: 'normal',
            color: '#ffffff',
            align: 'center',
            resolution: 2,
            antialias: true,
            padding: { x: 4, y: 4 }
        };

        this.add.text(w/2, h - 80, 'Created by Robert Niemela', creditsStyle)
            .setOrigin(0.5)
            .setAlpha(0.7);

        this.add.text(w/2, h - 40, 'Email: rvniemela@hotmail.com', creditsStyle)
            .setOrigin(0.5)
            .setAlpha(0.7);
    }

    resize(gameSize) {
        const w = gameSize.width;
        const h = gameSize.height;

        // Recalculate text sizes
        const titleSize = Math.min(72, Math.floor(w * 0.08));
        const instructionsSize = Math.min(24, Math.floor(w * 0.03));
        const scoreSize = Math.min(48, Math.floor(w * 0.06));
        const buttonTextSize = Math.min(48, Math.floor(w * 0.06));
        const creditsSize = Math.min(32, Math.floor(w * 0.04));
        
        const lineHeight = instructionsSize * 1.4;
        const startY = h/2 - 80;

        // Update positions and sizes of menu elements
        this.children.list.forEach(child => {
            if (child.type === 'Container' && child.list.length === 2 && 
                child.list[0].text === 'Hemisphere' && child.list[1].text === 'Hunter') {
                // Update title container
                const hemisphereText = child.list[0];
                const hunterText = child.list[1];
                
                // Update text styles
                hemisphereText.setStyle({ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                    fontSize: `${titleSize}px`,
                    color: '#99bbff'
                });
                hunterText.setStyle({ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                    fontSize: `${titleSize}px`,
                    color: '#ff9999'
                });

                // Update positions
                hemisphereText.setPosition(0, 0);
                hunterText.setPosition(hemisphereText.width, 0);
                
                // Recenter container
                const totalWidth = hemisphereText.width + hunterText.width;
                child.setPosition(w/2 - totalWidth/2, h/4);
            } else if (child.type === 'Text') {
                if (child.text.startsWith('Last Score')) {
                    child.setPosition(w/2, h/2 + 50)
                        .setStyle({ 
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                            fontSize: `${scoreSize}px`
                        });
                } else if (child.text.startsWith('Created by') || child.text.startsWith('Email:')) {
                    const yPos = child.text.startsWith('Created by') ? h - 80 : h - 40;
                    child.setPosition(w/2, yPos)
                        .setStyle({
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                            fontSize: `${creditsSize}px`
                        });
                } else {
                    // Handle instruction lines
                    let lineIndex = 0;
                    if (child.text === 'Touch and drag on either side of the screen to move') lineIndex = 0;
                    else if (child.text === 'Left joystick: Catch the blue dots') lineIndex = 1;
                    else if (child.text === 'Right joystick: Catch the red dots') lineIndex = 2;
                    else if (child.text === 'Dots get faster each time they respawn') lineIndex = 3;
                    else if (child.text === 'Timer extends when dots take damage') lineIndex = 4;

                    child.setPosition(w/2, startY + lineHeight * lineIndex)
                        .setStyle({
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                            fontSize: `${instructionsSize}px`
                        });
                }
            } else if (child.type === 'Container') {
                child.setPosition(w/2, h/2 + 150);
                
                // Update button size
                const buttonWidth = Math.max(200, buttonTextSize * 4);
                const buttonHeight = Math.max(80, buttonTextSize * 1.6);
                
                child.list.forEach(element => {
                    if (element.type === 'Rectangle') {
                        element.setSize(buttonWidth, buttonHeight);
                    } else if (element.type === 'Text') {
                        element.setStyle({ 
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                            fontSize: `${buttonTextSize}px`
                        });
                    }
                });
            }
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        // Game properties
        this.leftCircle = null;
        this.rightCircle = null;
        this.targetBlue = null;
        this.targetRed = null;
        this.joystickZones = {};
        this.leftIndicator = null;
        this.rightIndicator = null;
        this.leftThumbLine = null;
        this.rightThumbLine = null;
        this.leftSparkle = null;
        this.rightSparkle = null;
        this.scoreText = null;
        this.score = 0;
        this.scoreTimer = 0;
        this.leftParticles = [];
        this.rightParticles = [];
        this.leftSpawnCooldown = 0;
        this.rightSpawnCooldown = 0;

        // Constants
        this.SCORE_INTERVAL = 100; // 0.1 seconds in milliseconds
        this.MAX_SPEED = 600;
        this.MIN_TARGET_SPEED = 20;
        this.MAX_TARGET_SPEED = 80;
        this.GAME_DURATION = 15000; // 15 seconds in milliseconds
        this.TIME_BONUS_PER_HIT = 150; // 1 second bonus per hit

        // Timer properties
        this.timeLeft = this.GAME_DURATION;
        this.timerBar = null;
        this.timerBarBg = null;

        // Joystick tracking
        this.leftJoystickCenter = null;
        this.rightJoystickCenter = null;
        this.activePointers = new Map(); // Track which pointer is controlling which side
    }

    preload() {
        // No assets needed
    }

    create() {
        this.input.addPointer(1);
        const w = this.scale.width;
        const h = this.scale.height;

        // Remove old joystick zones since we're using the full sides now

        // Create player circles with lighter colors
        const radius = Math.min(w, h) * PLAYER_CONFIG.SIZE_RATIO;
        this.leftCircle = new PlayerCircle(this, w * PLAYER_CONFIG.LEFT_X_RATIO, h * PLAYER_CONFIG.Y_RATIO, radius, 0x99bbff, true);  // Lighter blue
        this.rightCircle = new PlayerCircle(this, w * PLAYER_CONFIG.RIGHT_X_RATIO, h * PLAYER_CONFIG.Y_RATIO, radius, 0xff9999, false);  // Lighter red

        // Create sparkle graphics
        this.leftSparkle = this.add.graphics();
        this.rightSparkle = this.add.graphics();

        // Create targets (keeping original colors for visibility)
        this.targetBlue = new Target(this, w * TARGET_CONFIG.LEFT_X_RATIO, h * TARGET_CONFIG.Y_RATIO, radius * TARGET_CONFIG.SIZE_RATIO, 0x8888ff, true);
        this.targetRed = new Target(this, w * TARGET_CONFIG.RIGHT_X_RATIO, h * TARGET_CONFIG.Y_RATIO, radius * TARGET_CONFIG.SIZE_RATIO, 0xff8888, false);

        // Add score display with reduced opacity
        const textStyle = {
            font: 'bold 200px Arial',
            fill: '#ffffff',
            align: 'center'
        };
        this.scoreText = this.add.text(w/2, h/2, '0', textStyle)
            .setOrigin(0.5)
            .setAlpha(0.08)  // Reduced from 0.15 to 0.08
            .setDepth(1);

        // Add timer bar background with reduced opacity
        const barWidth = this.scale.width * 0.8;
        const barHeight = 20;
        const barX = this.scale.width * 0.1;
        const barY = 20;
        
        this.timerBarBg = this.add.rectangle(barX, barY, barWidth, barHeight, 0x333333)
            .setOrigin(0, 0.5)
            .setAlpha(0.3);  // Added reduced alpha
            
        // Add timer bar with reduced opacity
        this.timerBar = this.add.rectangle(barX, barY, barWidth, barHeight, 0xffffff)
            .setOrigin(0, 0.5)
            .setAlpha(0.3);  // Added reduced alpha
            
        // Reset timer
        this.timeLeft = this.GAME_DURATION;

        // Setup input handlers
        this.input.on('pointerdown', this.handlePointerDown, this);
        this.input.on('pointerup', this.handlePointerUp, this);

        this.scale.on('resize', this.resize, this);
    }

    handlePointerDown(pointer) {
        const w = this.scale.width;
        const isLeftSide = pointer.x < w / 2;
        
        // Only set center if we don't already have an active pointer for this side
        if (isLeftSide && !this.leftJoystickCenter) {
            this.leftJoystickCenter = { x: pointer.x, y: pointer.y };
            this.activePointers.set(pointer.id, 'left');
        } else if (!isLeftSide && !this.rightJoystickCenter) {
            this.rightJoystickCenter = { x: pointer.x, y: pointer.y };
            this.activePointers.set(pointer.id, 'right');
        }
    }

    handlePointerUp(pointer) {
        const side = this.activePointers.get(pointer.id);
        if (side === 'left') {
            this.leftJoystickCenter = null;
            this.leftCircle.setVelocity(0, 0);
            this.leftCircle.clearGraphics();
        } else if (side === 'right') {
            this.rightJoystickCenter = null;
            this.rightCircle.setVelocity(0, 0);
            this.rightCircle.clearGraphics();
        }
        this.activePointers.delete(pointer.id);
    }

    createParticles(x, y, isLeft, color) {
        const particles = isLeft ? this.leftParticles : this.rightParticles;
        
        // Create particles with the dot's color
        for (let i = 0; i < PARTICLE_CONFIG.PARTICLES_PER_BURST; i++) {
            particles.push(new Particle(x, y, color));
        }
    }

    updateParticles(graphics, particles) {
        graphics.clear();
        if (particles.length > 0) {
            // Group particles by color
            const colorGroups = new Map();
            
            // Group all particles by their color
            particles.forEach(particle => {
                if (!colorGroups.has(particle.color)) {
                    colorGroups.set(particle.color, []);
                }
                colorGroups.get(particle.color).push(particle);
            });
            
            // Draw each color group
            colorGroups.forEach((particleGroup, color) => {
                graphics.fillStyle(color, PARTICLE_CONFIG.ALPHA_START);
                particleGroup.forEach(particle => {
                    if (particle.update(1/60)) {
                        graphics.fillCircle(particle.x, particle.y, particle.size);
                    }
                });
            });
            
            // Remove dead particles
            particles = particles.filter(particle => 
                particle.life > 0 && particle.size >= PARTICLE_CONFIG.MIN_SIZE
            );
        }
        return particles;
    }

    update() {
        // Update timer
        this.timeLeft -= this.game.loop.delta;
        const timeRatio = Math.max(0, this.timeLeft / this.GAME_DURATION);
        this.timerBar.setScale(timeRatio, 1);

        // Check for game over
        if (this.timeLeft <= 0) {
            const finalScore = this.score;
            this.scene.start('MainMenu', { lastScore: finalScore });
            return;
        }

        // Clear graphics
        this.leftCircle.clearGraphics();
        this.rightCircle.clearGraphics();
        this.leftSparkle.clear();
        this.rightSparkle.clear();

        // Process input for joysticks
        this.input.manager.pointers.forEach(pointer => {
            if (!pointer.isDown) return;

            const side = this.activePointers.get(pointer.id);
            if (!side) return;

            const center = side === 'left' ? this.leftJoystickCenter : this.rightJoystickCenter;
            if (!center) return;

            // Calculate offset from center
            const dx = pointer.x - center.x;
            const dy = pointer.y - center.y;
            
            // Calculate distance as a ratio of screen height (for consistent feel across screen sizes)
            const maxDist = this.scale.height * 0.15; // Reduced from 0.25 to make it more sensitive
            const distance = Math.sqrt(dx * dx + dy * dy) / maxDist;
            
            // Apply deadzone and sensitivity
            if (distance < PLAYER_CONFIG.DEADZONE) {
                if (side === 'left') {
                    this.leftCircle.setVelocity(0, 0);
                } else {
                    this.rightCircle.setVelocity(0, 0);
                }
            } else {
                // Normalize and apply sensitivity curve with increased response
                let factor = Math.min(1.5, distance); // Allow overshooting for faster movement
                factor = Math.pow(factor, 1 / PLAYER_CONFIG.CONTROL_SENSITIVITY);
                const normalizedDx = (dx / maxDist) * factor;
                const normalizedDy = (dy / maxDist) * factor;
                
                if (side === 'left') {
                    this.leftCircle.setVelocity(normalizedDx, normalizedDy);
                    this.leftCircle.updateThumbLine(pointer);
                } else {
                    this.rightCircle.setVelocity(normalizedDx, normalizedDy);
                    this.rightCircle.updateThumbLine(pointer);
                }
            }
        });

        // Update visuals
        this.leftCircle.updateIndicator();
        this.rightCircle.updateIndicator();

        // Update targets
        this.targetBlue.update(1/60);
        this.targetRed.update(1/60);

        // Update score timer and check overlaps
        this.scoreTimer += this.game.loop.delta;
        if (this.scoreTimer >= this.SCORE_INTERVAL) {
            let pointsThisInterval = 0;
            if (this.targetBlue.checkOverlap(this.leftCircle)) {
                pointsThisInterval++;
            }
            if (this.targetRed.checkOverlap(this.rightCircle)) {
                pointsThisInterval++;
            }
            if (pointsThisInterval > 0) {
                this.score += pointsThisInterval;
                this.scoreText.setText(this.score.toString());
            }
            this.scoreTimer = 0;
        }

        // Update particles
        this.leftParticles = this.updateParticles(this.leftSparkle, this.leftParticles);
        this.rightParticles = this.updateParticles(this.rightSparkle, this.rightParticles);
    }

    resize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;
        this.cameras.resize(width, height);

        // Resize circles
        this.leftCircle.resize(width, height);
        this.rightCircle.resize(width, height);
        
        // Resize targets
        this.targetBlue.resize(width, height);
        this.targetRed.resize(width, height);

        // Update score text position
        this.scoreText.setPosition(width/2, height/2);

        // Resize timer bar
        const barWidth = width * 0.8;
        const barHeight = 20;
        const barX = width * 0.1;
        const barY = 20;
        
        this.timerBarBg.setPosition(barX, barY).setSize(barWidth, barHeight);
        this.timerBar.setPosition(barX, barY).setSize(barWidth, barHeight);
    }

    addTimeBonus() {
        this.timeLeft = Math.min(this.GAME_DURATION, this.timeLeft + this.TIME_BONUS_PER_HIT);
    }
}

class PlayerCircle {
    constructor(scene, x, y, radius, color, isLeft) {
        this.scene = scene;
        this.isLeft = isLeft;
        
        // Create the circle
        this.circle = scene.add.arc(x, y, radius, 0, 360)
            .setStrokeStyle(PLAYER_CONFIG.OUTLINE_WIDTH, color, PLAYER_CONFIG.OUTLINE_ALPHA)
            .setFillStyle(PLAYER_CONFIG.FILL_COLOR, PLAYER_CONFIG.FILL_ALPHA);
            
        // Add physics
        scene.physics.add.existing(this.circle);
        this.circle.body.setCircle(radius);
        this.circle.body.setCollideWorldBounds(true);
        this.circle.body.setBounce(PLAYER_CONFIG.BOUNCE);
        
        // Create graphics for visuals
        this.indicator = scene.add.graphics();
        this.thumbLine = scene.add.graphics();
        
        // Store color for drawing
        this.color = color;
    }
    
    setVelocity(x, y) {
        this.circle.body.setVelocity(x * this.scene.MAX_SPEED, y * this.scene.MAX_SPEED);
    }
    
    updateThumbLine(pointer) {
        this.thumbLine.clear();
        if (pointer) {
            this.thumbLine.lineStyle(PLAYER_CONFIG.THUMB_WIDTH, this.color, PLAYER_CONFIG.THUMB_ALPHA);
            this.thumbLine.beginPath();
            this.thumbLine.moveTo(this.circle.x, this.circle.y);
            this.thumbLine.lineTo(pointer.x, pointer.y);
            this.thumbLine.strokePath();
        }
    }
    
    updateIndicator() {
        this.indicator.clear();
        const vx = this.circle.body.velocity.x;
        const vy = this.circle.body.velocity.y;
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed > 0) {
            const ux = vx / speed;
            const uy = vy / speed;
            const length = (speed / this.scene.MAX_SPEED) * this.circle.radius * PLAYER_CONFIG.INDICATOR_LENGTH;
            this.indicator.lineStyle(PLAYER_CONFIG.INDICATOR_WIDTH, PLAYER_CONFIG.INDICATOR_COLOR, PLAYER_CONFIG.INDICATOR_ALPHA);
            this.indicator.beginPath();
            this.indicator.moveTo(this.circle.x, this.circle.y);
            this.indicator.lineTo(this.circle.x + ux * length, this.circle.y + uy * length);
            this.indicator.strokePath();
        }
    }
    
    resize(width, height) {
        const radius = Math.min(width, height) * PLAYER_CONFIG.SIZE_RATIO;
        const x = this.isLeft ? width * PLAYER_CONFIG.LEFT_X_RATIO : width * PLAYER_CONFIG.RIGHT_X_RATIO;
        const y = height * PLAYER_CONFIG.Y_RATIO;
        
        this.circle.setPosition(x, y);
        this.circle.setRadius(radius);
        this.circle.body.setCircle(radius);
    }
    
    clearGraphics() {
        this.indicator.clear();
        this.thumbLine.clear();
    }
}

class Target {
    constructor(scene, x, y, radius, color, isLeft) {
        this.scene = scene;
        this.isLeft = isLeft;
        this.baseRadius = radius;
        this.color = color;
        
        // Health system
        this.maxHealth = TARGET_CONFIG.MAX_HEALTH;
        this.health = this.maxHealth;
        this.lastHealthDrain = 0;
        
        // Speed scaling
        this.speedMultiplier = 1;
        this.respawnCount = 0;
        this.SPEED_INCREASE_PER_RESPAWN = 0.2; // 20% faster each respawn
        this.baseSpeed = Phaser.Math.FloatBetween(this.scene.MIN_TARGET_SPEED, this.scene.MAX_TARGET_SPEED);
        
        // Create the dot with outline
        this.dot = scene.add.circle(x, y, radius, color)
            .setStrokeStyle(TARGET_CONFIG.OUTLINE_WIDTH, TARGET_CONFIG.OUTLINE_COLOR, TARGET_CONFIG.OUTLINE_ALPHA);
        scene.physics.add.existing(this.dot);
        this.dot.body.setCircle(radius);
        this.dot.body.setCollideWorldBounds(true);
        this.dot.body.setBounce(1);
        
        // Initialize movement
        this.setRandomVelocity();
        
        // Cooldown for particle spawning
        this.spawnCooldown = 0;
    }

    setRandomVelocity() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const currentSpeed = this.baseSpeed * this.speedMultiplier;
        
        this.dot.body.setVelocity(
            Math.cos(angle) * currentSpeed,
            Math.sin(angle) * currentSpeed
        );
    }

    respawn() {
        // Increment respawn counter and update speed
        this.respawnCount++;
        this.speedMultiplier = 1 + (this.respawnCount * this.SPEED_INCREASE_PER_RESPAWN);
        
        // Get a new base speed that's at least as fast as the previous one
        const minNewBaseSpeed = this.baseSpeed;
        this.baseSpeed = Phaser.Math.FloatBetween(
            Math.max(this.scene.MIN_TARGET_SPEED, minNewBaseSpeed),
            Math.max(this.scene.MAX_TARGET_SPEED, minNewBaseSpeed)
        );
        
        // Reset health
        this.health = this.maxHealth;
        
        // Reset size to full size and maintain outline
        this.dot.setRadius(this.baseRadius);
        this.dot.body.setCircle(this.baseRadius);
        this.dot.setStrokeStyle(TARGET_CONFIG.OUTLINE_WIDTH, TARGET_CONFIG.OUTLINE_COLOR, TARGET_CONFIG.OUTLINE_ALPHA);
        
        // Find new random position
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        const margin = this.baseRadius * 2;
        
        // Define spawn area based on which side (left/right) the dot belongs to
        const minX = this.isLeft ? margin : width/2 + margin;
        const maxX = this.isLeft ? width/2 - margin : width - margin;
        const minY = margin;
        const maxY = height - margin;
        
        // Set new random position
        const newX = Phaser.Math.Between(minX, maxX);
        const newY = Phaser.Math.Between(minY, maxY);
        this.dot.setPosition(newX, newY);
        
        // Set new random velocity with increased speed
        this.setRandomVelocity();
    }

    update(delta) {
        // Update spawn cooldown
        this.spawnCooldown = Math.max(0, this.spawnCooldown - delta);
        
        // Check if we need to randomize velocity (if moving too slow)
        const velocity = this.dot.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const minSpeed = this.baseSpeed * this.speedMultiplier * 0.9; // Allow slight variation
        if (speed < minSpeed) {
            this.setRandomVelocity();
        }
    }
    
    checkOverlap(playerCircle) {
        const isOverlapping = this.scene.physics.overlap(playerCircle.circle, this.dot);
        
        if (isOverlapping) {
            // Handle particle effects
            if (this.spawnCooldown <= 0) {
                this.createSparkle();
                this.spawnCooldown = PARTICLE_CONFIG.SPAWN_COOLDOWN;
            }
            
            // Handle health drain
            const now = this.scene.game.loop.time;
            if (now - this.lastHealthDrain >= TARGET_CONFIG.HEALTH_DRAIN_INTERVAL) {
                this.health -= TARGET_CONFIG.HEALTH_DRAIN_AMOUNT;
                this.lastHealthDrain = now;
                
                // Add time bonus when dot takes damage
                this.scene.addTimeBonus();
                
                // Update dot size based on health with minimum size
                const healthRatio = this.health / this.maxHealth;
                const newRadius = TARGET_CONFIG.MIN_DOT_SIZE + 
                    (this.baseRadius - TARGET_CONFIG.MIN_DOT_SIZE) * healthRatio;
                this.dot.setRadius(newRadius);
                this.dot.body.setCircle(newRadius);
                this.dot.setStrokeStyle(TARGET_CONFIG.OUTLINE_WIDTH, TARGET_CONFIG.OUTLINE_COLOR, TARGET_CONFIG.OUTLINE_ALPHA);
                
                // Check if dot is depleted
                if (this.health <= 0) {
                    this.respawn();
                }
            }
        }
        
        return isOverlapping;
    }
    
    createSparkle() {
        this.scene.createParticles(this.dot.x, this.dot.y, this.isLeft, this.color);
    }
    
    resize(width, height) {
        const dotRadius = Math.min(width, height) * TARGET_CONFIG.SIZE_RATIO;
        this.baseRadius = dotRadius;
        
        // Set current radius based on health with minimum size
        const healthRatio = this.health / this.maxHealth;
        const currentRadius = TARGET_CONFIG.MIN_DOT_SIZE + 
            (this.baseRadius - TARGET_CONFIG.MIN_DOT_SIZE) * healthRatio;
        
        // Update dot and maintain outline
        this.dot.setRadius(currentRadius);
        this.dot.body.setCircle(currentRadius);
        this.dot.setStrokeStyle(TARGET_CONFIG.OUTLINE_WIDTH, TARGET_CONFIG.OUTLINE_COLOR, TARGET_CONFIG.OUTLINE_ALPHA);
        
        // Reposition based on whether it's left or right
        const x = this.isLeft ? width * TARGET_CONFIG.LEFT_X_RATIO : width * TARGET_CONFIG.RIGHT_X_RATIO;
        const y = height * TARGET_CONFIG.Y_RATIO;
        this.dot.setPosition(x, y);
    }
}

class Particle {
    constructor(x, y, color) {
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
            0xFFFFFF : color;  // Either white or the dot's color
    }

    update(delta) {
        this.x += Math.cos(this.angle) * this.speed * delta;
        this.y += Math.sin(this.angle) * this.speed * delta;
        this.life -= PARTICLE_CONFIG.LIFE_DECAY;
        this.size *= PARTICLE_CONFIG.SIZE_DECAY;
        return this.life > 0 && this.size >= PARTICLE_CONFIG.MIN_SIZE;
    }
}

// Game configuration and initialization
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
    scene: [MainMenu, GameScene]  // MainMenu is the first scene to load
};

const game = new Phaser.Game(config); 