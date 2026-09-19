function _class_call_check(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js'; // Import FontLoader
import { setupScene } from './sceneSetup.js';
import { UI } from './ui.js';
import { Piano } from './piano.js';
import { LevelManager } from './levelManager.js';
import { AudioManager } from './audioManager.js';
import { Rocket } from './Rocket.js'; // Import the Rocket class
import { Bullet } from './Bullet.js'; // Import the Bullet class
import { AnswerTarget } from './AnswerTarget.js'; // Import AnswerTarget
import { CollisionManager } from './CollisionManager.js'; // Import CollisionManager
import { TargetCollisionManager } from './TargetCollisionManager.js'; // Import TargetCollisionManager
import { GAME_STATE, NOTES, THEME_MUSIC_URL } from './constants.js'; // Import NOTES
import { ImpactEffect } from './ImpactEffect.js'; // Import ImpactEffect class
import { Asteroid } from './Asteroid.js'; // Import the Asteroid class
import { calculateStreakBonus, formatSolfegeDisplay } from './scoreUtils.js';
import { isHighScore, loadHighScores, recordHighScore } from './highScores.js';
import confetti from 'https://esm.sh/canvas-confetti@1.9.3';
var MAX_ASTEROIDS = 7; // Maximum number of asteroids on screen (Reduced by approx half)
export var Game = /*#__PURE__*/ function() {
    "use strict";
    function Game(container) {
        var _this = this;
        _class_call_check(this, Game);
        this.container = container;
        this.gameState = GAME_STATE.START_SCREEN;
        this.currentLevel = 1;
        this.startingLevel = 1;
        this.score = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.currentQuestion = null; // { pattern: [note1, note2, note3], options: [opt1, opt2, opt3, opt4], correctAnswer: correctOpt }
        this.questionIndex = 0; // Index within the current level's questions
        this._autoPlayToken = 0;
        this._flameConfettiCooldown = 0;
        // Basic Three.js setup
        // Import and store createShootingStarMesh function
        var _setupScene = setupScene(container), scene = _setupScene.scene, camera = _setupScene.camera, renderer = _setupScene.renderer, stars = _setupScene.stars, createShootingStarMesh = _setupScene.createShootingStarMesh;
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.stars = stars; // Keep reference for animation
        this.createShootingStarMesh = createShootingStarMesh; // Store the function
        // Shooting Stars
        this.shootingStars = [];
        this.shootingStarSpawnTimer = 0;
        this.shootingStarSpawnInterval = 0.7; // Average seconds between stars (Increased frequency)
        // Audio
        this.audioManager = new AudioManager(this); // Pass the game instance
        // Game Components
        this.levelManager = new LevelManager();
        this.piano = new Piano(this.scene, this.audioManager);
        this.ui = new UI(container, this); // Pass game instance for callbacks
        // Raycasting for piano interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        // Rocket Ship
        this.rocket = new Rocket(this.scene);
        this.rocket.setCameraReference(this.camera); // Pass camera for bounds calculation
        this.keysPressed = {}; // To track keyboard input for rocket
        // Bullets
        this.bullets = [];
        this.shootCooldown = 0.2; // Seconds between shots
        this.shootTimer = 0;
        // Impact effects
        this.impactEffects = [];
        // Answer Targets in 3D scene
        this.answerTargets = [];
        // Font for 3D Text
        this.textFont = null;
        // Asteroids
        this.asteroids = [];
        this.asteroidSpawnTimer = 0;
        this.asteroidSpawnInterval = 1.5; // Average seconds between new asteroids
        // Collision detection
        this.collisionManager = new CollisionManager(this);
        // Target-to-target collision detection
        this.targetCollisionManager = new TargetCollisionManager(this);
        // Debug flags REMOVED - tip marker is now always visible
        // this.debugTipMarkerVisible = false;
        // Game loop
        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        // Event listeners
        this.setupEventHandlers();
        // Create dedicated canvas for confetti
        this.confettiCanvas = document.createElement('canvas');
        this.confettiCanvas.style.position = 'absolute';
        this.confettiCanvas.style.top = '0';
        this.confettiCanvas.style.left = '0';
        this.confettiCanvas.style.width = '100%';
        this.confettiCanvas.style.height = '100%';
        this.confettiCanvas.style.pointerEvents = 'none'; // Don't capture mouse events
        this.confettiCanvas.style.zIndex = '1'; // Base layer for effects
        this.container.appendChild(this.confettiCanvas);
        // Set z-index for the main renderer canvas to be above confetti
        this.renderer.domElement.style.position = 'relative'; // Needed for z-index
        this.renderer.domElement.style.zIndex = '2'; // Above confetti
        // Create confetti instance linked to this canvas
        this.customConfetti = confetti.create(this.confettiCanvas, {
            resize: true,
            useWorker: true // Use worker thread for performance
        });
        // --- Load Font ---
        var fontLoader = new FontLoader();
        var fontUrl = 'https://unpkg.com/three@0.161.0/examples/fonts/helvetiker_regular.typeface.json';
        fontLoader.load(fontUrl, function(font) {
            _this.textFont = font;
            console.log("3D Text Font loaded successfully.");
        // If targets already exist when font loads, might need to update them (optional)
        }, undefined, function(error) {
            console.error('Error loading 3D Text Font:', error);
        });
    }
    _create_class(Game, [
        {
            key: "setupEventHandlers",
            value: function setupEventHandlers() {
                // UI interaction logic is mostly handled within UI.js
                window.addEventListener('resize', this.onWindowResize.bind(this), false);
                // Listen for clicks on the canvas for piano interaction
                this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this), false);
                // Listen for keyboard events for rocket control
                window.addEventListener('keydown', this.onKeyDown.bind(this), false);
                window.addEventListener('keyup', this.onKeyUp.bind(this), false);
            }
        },
        {
            key: "start",
            value: function start() {
                this.ui.showStartScreen();
                // --- Show rocket specifically for start screen ---
                this.rocket.show();
                // Position the rocket above the title on the start screen
                this.rocket.group.position.set(0, 4.5, -20); // Adjust Y value as needed, Z behind targets
                this.rocket.group.rotation.z = 0; // Point straight up for start screen visual
                this.animate();
                // Start loading and playing background music
                this.audioManager.loadBackgroundMusic(THEME_MUSIC_URL);
            }
        },
        {
            key: "startGame",
            value: function startGame() {
                var allowedStates = [
                    GAME_STATE.START_SCREEN,
                    GAME_STATE.GAME_OVER,
                    GAME_STATE.HIGH_SCORE_ENTRY,
                    GAME_STATE.PAUSED
                ];
                if (allowedStates.indexOf(this.gameState) === -1) {
                    return;
                }
                var fromMenu = this.gameState === GAME_STATE.START_SCREEN;
                this.audioManager.resumeContext(); // Ensure context is running before stopping/starting audio
                this.audioManager.stopBackgroundMusic(); // Stop the theme music
                this.audioManager.stopPattern();
                this.gameState = GAME_STATE.PLAYING;
                if (fromMenu) {
                    this.startingLevel = parseInt(this.ui.levelSelect.value, 10) || this.currentLevel || 1;
                }
                this.currentLevel = this.startingLevel || this.currentLevel || 1;
                this.score = 0;
                this.streak = 0;
                this.bestStreak = 0;
                this.questionIndex = 0;
                this.keysPressed = {};
                this.clearAnswerTargets();
                this.clearAsteroids();
                this.clearBullets();
                this.ui.hideOverlays();
                this.ui.showGameScreen(this.currentLevel, this.score);
                this.ui.updateStats(this.getHudStats());
                this.piano.show();
                this.rocket.show(); // Show the rocket when game starts
                // Set the rocket's Z position deeper than the answer targets
                this.rocket.group.position.z = -25; // Further behind the answer targets (which are at z=-15)
                for(var i = 0; i < MAX_ASTEROIDS / 2; i++){
                    this.spawnAsteroid();
                }
                this.loadNextQuestion();
            }
        },
        {
            key: "selectLevel",
            value: function selectLevel(level) {
                this.currentLevel = parseInt(level, 10);
                // If already playing, jump to the new level, keep the score
                if (this.gameState === GAME_STATE.PLAYING) {
                    // this.score = 0; // Keep score when changing level manually
                    this.questionIndex = 0;
                    // this.ui.updateScore(this.score); // No need to update score display if it didn't change
                    this.ui.updateLevel(this.currentLevel);
                    this.loadNextQuestion();
                } else if (this.gameState === GAME_STATE.START_SCREEN) {
                    this.startingLevel = this.currentLevel;
                    this.ui.updateLevel(this.currentLevel); // Update dropdown visual
                }
            }
        },
        {
            key: "playCurrentPattern",
            value: function playCurrentPattern() {
                var _this = this;
                if (this.currentQuestion && this.gameState === GAME_STATE.PLAYING) {
                    // Pass both note names and frequencies, along with the highlight callback
                    var patternData = this.currentQuestion.patternNames.map(function(name, index) {
                        return {
                            noteName: name,
                            frequency: _this.currentQuestion.patternFrequencies[index]
                        };
                    });
                    // Define slower durations for pattern playback
                    var patternNoteDuration = 0.8; // Double the default
                    var patternGapDuration = 0.3; // Slightly longer gap between notes
                    this.audioManager.playPattern(patternData, // Pass piano highlighting callback if highlighting is enabled, otherwise null
                    this.ui.pianoHighlighting ? this.piano.highlightKey.bind(this.piano) : null, patternNoteDuration, patternGapDuration, {
                        force: true
                    });
                }
            }
        },
        {
            key: "submitAnswer",
            value: function submitAnswer(selectedAnswer, buttonElement) {
                if (!this.currentQuestion || this.gameState !== GAME_STATE.PLAYING) return;
                var _this_levelManager_getScoring = this.levelManager.getScoring(this.currentLevel), pointsCorrect = _this_levelManager_getScoring.pointsCorrect, pointsIncorrect = _this_levelManager_getScoring.pointsIncorrect;
                var correctAnswer = this.currentQuestion.correctAnswer;
                var matchingTarget = this.findAnswerTarget(selectedAnswer);
                if (!buttonElement) {
                    buttonElement = this.ui.getButtonForOption(selectedAnswer);
                }
                // Always play the selected pattern audio, regardless of piano highlighting state
                var tonicNote = this.currentQuestion.patternNames[0];
                var selectedNotes = this.levelManager.solfegeStringToNotes(selectedAnswer, tonicNote);
                if (selectedNotes) {
                    var selectedPatternData = selectedNotes.map(function(name) {
                        return {
                            noteName: name,
                            // --- Use the frequency corresponding to the actual selected note name ---
                            frequency: NOTES[name],
                            // Add piano characteristics to each note
                            attack: 0.005,
                            decay: 0.3,
                            sustain: 0.7,
                            release: 0.6 // Longer release tail
                        };
                    });
                    // If piano highlighting is enabled, pass the highlighting callback, otherwise null
                    var highlightCallback = this.ui.pianoHighlighting ? this.piano.highlightKey.bind(this.piano) : null;
                    this.audioManager.playPattern(selectedPatternData, highlightCallback, 0.6, 0.15, {
                        force: true
                    });
                }
                if (selectedAnswer === correctAnswer) {
                    // --- Correct Answer ---
                    this.audioManager.playCorrectSound();
                    this.triggerCorrectAnimation(); // Confetti
                    this.ui.highlightCorrectOption(correctAnswer);
                    if (matchingTarget) {
                        matchingTarget.hit(true);
                    }
                    // Only update score and reveal 'Next' button on the *first* correct selection
                    if (!this.hasSolvedCurrentQuestion()) {
                        this.streak += 1;
                        this.bestStreak = Math.max(this.bestStreak, this.streak);
                        var bonus = calculateStreakBonus(this.streak, pointsCorrect);
                        this.score += pointsCorrect + bonus;
                        this.ui.updateScore(this.score);
                        this.ui.updateStats(this.getHudStats());
                        this.ui.showFeedback(bonus ? "Correct! +".concat(pointsCorrect, " (+").concat(bonus, " streak)") : 'Correct!', true);
                        this.ui.showNextPatternButton();
                    } else {
                        this.ui.showFeedback('Correct!', true);
                    }
                // Do NOT advance question here - that happens when "Next Pattern" is clicked
                } else {
                    // --- Incorrect Answer ---
                    if (this.hasSolvedCurrentQuestion()) {
                        this.audioManager.playIncorrectSound();
                        this.ui.showFeedback('Already solved — hit Next Pattern.', false);
                        return;
                    }
                    var alreadyEliminated = buttonElement && buttonElement.dataset.eliminated === 'true' || matchingTarget && matchingTarget.hasBeenScored;
                    this.audioManager.playIncorrectSound();
                    this.streak = 0;
                    this.ui.updateStats(this.getHudStats());
                    this.ui.showFeedback('Incorrect! Try again.', false);
                    if (buttonElement) {
                        this.triggerIncorrectButtonAnimation(buttonElement);
                    }
                    if (alreadyEliminated) {
                        return;
                    }
                    if (buttonElement) {
                        buttonElement.dataset.eliminated = 'true';
                    }
                    this.ui.markEliminatedOption(selectedAnswer);
                    if (matchingTarget) {
                        matchingTarget.hasBeenScored = true;
                        matchingTarget.hit(false);
                    }
                    this.score = Math.max(0, this.score + pointsIncorrect);
                    this.ui.updateScore(this.score);
                }
            }
        },
        {
            // Method to handle advancing the game state (will be called by "Next Pattern" button)
            key: "proceedToNextQuestion",
            value: function proceedToNextQuestion() {
                if (this.gameState !== GAME_STATE.PLAYING) return;
                this.audioManager.stopPattern();
                this.questionIndex++;
                var levelUpThreshold = this.levelManager.getLevelUpThreshold(this.currentLevel);
                if (this.score >= levelUpThreshold && this.currentLevel < 10) {
                    this.levelUp(); // levelUp now handles loading the first question of the new level
                } else if (this.questionIndex >= this.levelManager.getQuestionsPerLevel()) {
                    // Reached end of questions for the level
                    if (this.currentLevel < 10) {
                        // Didn't score enough, but finished questions - level up anyway for now
                        this.levelUp();
                    } else {
                        this.endGame('Level 10 Complete!');
                    }
                } else {
                    // Load the next question within the current level
                    this.loadNextQuestion();
                }
                // Hide the "Next Pattern" button
                this.ui.hideNextPatternButton();
                // Reset button highlights for the new question (redundant if loadNextQuestion does it, but safe)
                this.ui.resetAnswerButtonHighlights();
                // Reset rocket position and angle
                this.rocket.show(); // Re-use show() to reset position, velocity, and angle
            }
        },
        {
            key: "levelUp",
            value: function levelUp() {
                this.currentLevel++;
                this.questionIndex = 0; // Reset question index for the new level
                // Score carries over
                this.ui.updateLevel(this.currentLevel);
                this.ui.showFeedback("Level ".concat(this.currentLevel, "!"), true);
                // Load the first question of the new level immediately
                this.loadNextQuestion();
            }
        },
        {
            key: "loadNextQuestion",
            value: function loadNextQuestion() {
                if (this.gameState !== GAME_STATE.PLAYING) return;
                // --- Clear old Answer Targets ---
                this.clearAnswerTargets();
                this.currentQuestion = this.levelManager.generateQuestion(this.currentLevel);
                if (this.currentQuestion) {
                    this.ui.resetAnswerButtonHighlights(); // Ensure buttons are reset before displaying new ones
                    this.ui.displayQuestion(this.currentQuestion.options); // Displays UI buttons
                    // --- Create new Answer Targets in 3D space ---
                    this.createAnswerTargets(this.currentQuestion.options);
                    // Reset all answer buttons when loading a new question
                    var answerButtons = this.ui.answerContainer.querySelectorAll('button');
                    answerButtons.forEach(function(button) {
                        button.dataset.selected = 'false';
                    });
                    this.scheduleAutoPlay();
                    this.ui.updateStats(this.getHudStats());
                } else {
                    this.endGame('Game Complete!');
                }
            }
        },
        {
            key: "triggerCorrectAnimation",
            value: function triggerCorrectAnimation() {
                // Neon star confetti burst using the dedicated canvas
                this.customConfetti({
                    particleCount: 150,
                    spread: 100,
                    origin: {
                        y: 0.6
                    },
                    colors: [
                        '#00FFFF',
                        '#FF00FF',
                        '#FFFFFF',
                        '#00FF00'
                    ],
                    // Revert to stars for correct answer
                    shapes: [
                        'star'
                    ],
                    scalar: 1.5 // Adjust size as needed
                });
            }
        },
        {
            key: "triggerIncorrectButtonAnimation",
            value: function triggerIncorrectButtonAnimation(buttonElement) {
                // Log animation trigger
                console.log("Triggering incorrect animation for button:", buttonElement);
                // Apply shake animation
                if (buttonElement) {
                    // Remove the shake class first to allow re-triggering
                    buttonElement.classList.remove('shake');
                    // Force a reflow to restart the animation
                    void buttonElement.offsetWidth;
                    // Add the class back to trigger the animation again
                    buttonElement.classList.add('shake');
                    // Apply the eliminated style, but now it can be re-triggered
                    setTimeout(function() {
                        if (buttonElement) {
                            buttonElement.classList.remove('shake');
                            // Apply eliminated style AFTER shaking
                            buttonElement.style.backgroundColor = 'rgba(50, 0, 0, 0.6)'; // Dark red, semi-transparent
                            buttonElement.style.opacity = '0.7'; // Slightly faded
                            buttonElement.style.boxShadow = 'none'; // Remove shadow
                            buttonElement.style.color = '#FF6666'; // Lighter red text for visibility on dark bg
                            buttonElement.style.borderColor = '#8B0000'; // Darker red border
                        }
                    }, 500); // Duration of shake animation
                }
                // Calculate button position for confetti origin
                var confettiOrigin = {
                    y: 0.6,
                    x: 0.5
                }; // Default origin
                if (buttonElement) {
                    var rect = buttonElement.getBoundingClientRect();
                    var x = (rect.left + rect.width / 2) / window.innerWidth;
                    var y = (rect.top + rect.height / 2) / window.innerHeight;
                    // Ensure origin values are between 0 and 1
                    confettiOrigin = {
                        x: Math.max(0, Math.min(1, x)),
                        y: Math.max(0, Math.min(1, y))
                    };
                }
                // Trigger confetti from the button's position (or default)
                this.customConfetti({
                    particleCount: 80,
                    spread: 90,
                    startVelocity: 25,
                    decay: 0.99,
                    gravity: 1,
                    origin: confettiOrigin,
                    colors: [
                        '#FF0000',
                        '#DC143C',
                        '#8B0000'
                    ],
                    shapes: [
                        'circle'
                    ],
                    scalar: 0.5 // Smaller particles
                });
            }
        },
        {
            // New method to trigger incorrect animation for 3D targets
            key: "triggerIncorrectAnimation",
            value: function triggerIncorrectAnimation(position) {
                // Convert 3D position to screen coordinates for confetti
                var screenPos = this.worldToScreen(position);
                // Create red explosion confetti effect
                this.customConfetti({
                    particleCount: 100,
                    spread: 120,
                    startVelocity: 30,
                    decay: 0.88,
                    gravity: 1.2,
                    origin: screenPos,
                    colors: [
                        '#FF0000',
                        '#DC143C',
                        '#8B0000'
                    ],
                    shapes: [
                        'circle'
                    ],
                    scalar: 0.7
                });
            }
        },
        {
            key: "hasSolvedCurrentQuestion",
            value: function hasSolvedCurrentQuestion() {
                return this.ui && this.ui.nextPatternButton && this.ui.nextPatternButton.style.visibility === 'visible';
            }
        },
        {
            key: "getHudStats",
            value: function getHudStats() {
                return {
                    question: this.questionIndex + 1,
                    total: this.levelManager.getQuestionsPerLevel(),
                    streak: this.streak,
                    muted: this.audioManager.muted
                };
            }
        },
        {
            key: "findAnswerTarget",
            value: function findAnswerTarget(solfegeText) {
                return this.answerTargets.find(function(target) {
                    return target.solfegeText === solfegeText || target.originalSolfegeText === solfegeText;
                }) || null;
            }
        },
        {
            key: "clearBullets",
            value: function clearBullets() {
                this.bullets.forEach(function(bullet) {
                    if (bullet && bullet.isAlive) bullet.destroy();
                });
                this.bullets = [];
            }
        },
        {
            key: "scheduleAutoPlay",
            value: function scheduleAutoPlay() {
                var _this = this;
                this._autoPlayToken += 1;
                var token = this._autoPlayToken;
                setTimeout(function() {
                    if (_this._autoPlayToken === token && _this.gameState === GAME_STATE.PLAYING) {
                        _this.playCurrentPattern();
                    }
                }, 350);
            }
        },
        {
            key: "endGame",
            value: function endGame(message) {
                this.audioManager.stopPattern();
                this.clearBullets();
                this.ui.hideNextPatternButton();
                var scores = loadHighScores();
                var qualifies = isHighScore(this.score, scores);
                this.gameState = qualifies ? GAME_STATE.HIGH_SCORE_ENTRY : GAME_STATE.GAME_OVER;
                this.ui.showGameOverScreen({
                    title: message || 'Game Complete!',
                    score: this.score,
                    level: this.currentLevel,
                    bestStreak: this.bestStreak,
                    highScores: scores,
                    showNameEntry: qualifies
                });
                this.audioManager.playCorrectSound();
            }
        },
        {
            key: "submitHighScore",
            value: function submitHighScore(name) {
                var scores = recordHighScore({
                    name: name,
                    score: this.score,
                    level: this.currentLevel,
                    date: new Date().toISOString()
                });
                this.gameState = GAME_STATE.GAME_OVER;
                this.ui.refreshGameOverHighScores(scores);
            }
        },
        {
            key: "returnToMenu",
            value: function returnToMenu() {
                this.audioManager.stopPattern();
                this.gameState = GAME_STATE.START_SCREEN;
                this.currentLevel = this.startingLevel || this.currentLevel || 1;
                this.ui.updateLevel(this.currentLevel);
                this.keysPressed = {};
                this.clearAnswerTargets();
                this.clearAsteroids();
                this.clearBullets();
                this.piano.hide();
                this.ui.hideOverlays();
                this.ui.showStartScreen();
                this.rocket.show();
                this.rocket.group.position.set(0, 4.5, -20);
                this.rocket.group.rotation.z = 0;
                this.audioManager.loadBackgroundMusic(THEME_MUSIC_URL);
            }
        },
        {
            key: "togglePause",
            value: function togglePause() {
                if (this.gameState === GAME_STATE.PLAYING) {
                    this.gameState = GAME_STATE.PAUSED;
                    this.keysPressed = {};
                    this.rocket.isThrusting = false;
                    this.ui.showPauseOverlay();
                } else if (this.gameState === GAME_STATE.PAUSED) {
                    this.gameState = GAME_STATE.PLAYING;
                    this.ui.hidePauseOverlay();
                }
            }
        },
        {
            key: "toggleMute",
            value: function toggleMute() {
                this.audioManager.toggleMute();
                this.ui.updateMuteButton(this.audioManager.muted);
                this.ui.updateStats(this.getHudStats());
            }
        },
        {
            // Placeholder kept for older UI hooks
            key: "enterHighScore",
            value: function enterHighScore() {
                if (this.gameState === GAME_STATE.PLAYING) {
                    this.endGame('High Score Check');
                }
            }
        },
        {
            key: "spawnAsteroid",
            value: function spawnAsteroid() {
                // Find a safe spawn position (avoid center initially)
                var targetZ = -15;
                var vFOV = THREE.MathUtils.degToRad(this.camera.fov);
                var visibleHeight = 2 * Math.tan(vFOV / 2) * Math.abs(targetZ);
                var visibleWidth = visibleHeight * this.camera.aspect;
                var edgeMarginX = visibleWidth / 2;
                var edgeMarginY = visibleHeight / 2;
                var xPos, yPos;
                // Choose a random edge (top, bottom, left, right) to spawn from
                var side = Math.floor(Math.random() * 4);
                switch(side){
                    case 0:
                        xPos = THREE.MathUtils.randFloatSpread(visibleWidth);
                        yPos = edgeMarginY * 1.1; // Slightly off-screen
                        break;
                    case 1:
                        xPos = THREE.MathUtils.randFloatSpread(visibleWidth);
                        yPos = -edgeMarginY * 1.1; // Slightly off-screen
                        break;
                    case 2:
                        xPos = -edgeMarginX * 1.1; // Slightly off-screen
                        yPos = THREE.MathUtils.randFloatSpread(visibleHeight);
                        break;
                    case 3:
                        xPos = edgeMarginX * 1.1; // Slightly off-screen
                        yPos = THREE.MathUtils.randFloatSpread(visibleHeight);
                        break;
                }
                var position = new THREE.Vector3(xPos, yPos, targetZ);
                var newAsteroid = new Asteroid(this.scene, this.camera, position);
                this.asteroids.push(newAsteroid);
            }
        },
        {
            key: "clearAsteroids",
            value: function clearAsteroids() {
                this.asteroids.forEach(function(asteroid) {
                    return asteroid.removeFromScene();
                });
                this.asteroids = [];
            }
        },
        {
            key: "onWindowResize",
            value: function onWindowResize() {
                this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
                this.ui.onResize(); // Adjust overlay UI if needed
            }
        },
        {
            key: "onPointerDown",
            value: function onPointerDown(event) {
                // Calculate mouse position in normalized device coordinates (-1 to +1) for raycasting
                var rect = this.renderer.domElement.getBoundingClientRect();
                this.mouse.x = (event.clientX - rect.left) / rect.width * 2 - 1;
                this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
                // Update the picking ray with the camera and mouse position
                this.raycaster.setFromCamera(this.mouse, this.camera);
                if (this.gameState === GAME_STATE.PLAYING) {
                    var targetSprites = this.answerTargets.filter(function(target) {
                        return !!target.sprite;
                    }).map(function(target) {
                        return target.sprite;
                    });
                    var targetHits = targetSprites.length ? this.raycaster.intersectObjects(targetSprites) : [];
                    if (targetHits.length > 0) {
                        var hitTarget = targetHits[0].object.userData.answerTarget;
                        if (hitTarget) {
                            this.audioManager.playClickSound();
                            this.submitAnswer(hitTarget.solfegeText, this.ui.getButtonForOption(hitTarget.solfegeText));
                            return;
                        }
                    }
                }
                // Calculate objects intersecting the picking ray
                var intersects = this.raycaster.intersectObjects(this.piano.getKeys()); // Only check piano keys
                if (intersects.length > 0) {
                    // The first intersected object is the closest one
                    var intersectedKey = intersects[0].object;
                    // Ensure it's a key with note data before proceeding
                    if (intersectedKey.userData.noteFrequency) {
                        this.piano.playKey(intersectedKey);
                    }
                }
            }
        },
        {
            // --- Keyboard Handlers for Rocket ---
            key: "onKeyDown",
            value: function onKeyDown(event) {
                if (this.ui && this.ui.isCapturingText) {
                    return;
                }
                this.keysPressed[event.key] = true;
                this.keysPressed[event.code] = true;
                var controlCodes = [
                    'ArrowUp',
                    'ArrowDown',
                    'ArrowLeft',
                    'ArrowRight',
                    'Space'
                ];
                if (controlCodes.indexOf(event.code) !== -1 || event.key === ' ') {
                    event.preventDefault();
                }
                if (event.repeat) return;
                if (event.code === 'Escape') {
                    if (this.gameState === GAME_STATE.PLAYING || this.gameState === GAME_STATE.PAUSED) {
                        this.togglePause();
                    }
                    return;
                }
                if (event.code === 'KeyM') {
                    this.toggleMute();
                    return;
                }
                if (this.gameState === GAME_STATE.START_SCREEN && (event.code === 'Enter' || event.code === 'Space')) {
                    this.audioManager.playCorrectSound();
                    this.startGame();
                    return;
                }
                if (this.gameState === GAME_STATE.PAUSED && event.code === 'Enter') {
                    this.togglePause();
                    return;
                }
                if (this.gameState !== GAME_STATE.PLAYING) return;
                if (event.code === 'KeyP') {
                    this.playCurrentPattern();
                    return;
                }
                if (event.code === 'Enter' && this.hasSolvedCurrentQuestion()) {
                    this.proceedToNextQuestion();
                    return;
                }
                // --- Shooting Logic ---
                if (event.code === 'Space' && this.shootTimer <= 0) {
                    // --- FIRING LOGIC Using Current Rocket State ---
                    // Ensure the rocket's world matrix is up-to-date based on the *last* animation frame
                    this.rocket.group.updateMatrixWorld(true);
                    // 1) Calculate Start Position using the current tip position
                    var startPos = this.rocket.getTipPosition(); // Gets world position of the tip marker
                    startPos.z = -15; // Ensure bullet starts exactly on the target Z-plane
                    // 2) Calculate Direction Vector using current rotation
                    // Get the current rotation angle directly from the group's rotation
                    var currentRotationZ = this.rocket.group.rotation.z;
                    // Add PI/2 because the rocket asset points UP (local Y+) when rotation.z is 0
                    var fireAngle = currentRotationZ + Math.PI / 2;
                    var directionVector = new THREE.Vector3(Math.cos(fireAngle), Math.sin(fireAngle), 0).normalize();
                    // 3) Calculate Velocity Vector
                    var bulletVelocity = directionVector.clone().multiplyScalar(Bullet.BULLET_SPEED || 24.0);
                    // 4) Spawn bullet
                    var bullet = new Bullet(startPos, bulletVelocity, this.scene, this.camera);
                    this.bullets.push(bullet);
                    this.audioManager.playShootSound();
                    // 5) Reset cooldown
                    this.shootTimer = this.shootCooldown;
                    // Optional kickback (using the same current fire angle)
                    var kick = 0.05;
                    var kickbackDirection = directionVector.clone().multiplyScalar(-kick); // Opposite direction
                    this.rocket.group.position.add(kickbackDirection);
                }
            }
        },
        {
            key: "onKeyUp",
            value: function onKeyUp(event) {
                this.keysPressed[event.key] = false;
                this.keysPressed[event.code] = false;
            }
        },
        {
            key: "animate",
            value: function animate() {
                requestAnimationFrame(this.animate);
                var delta = this.clock.getDelta();
                // Animate stars
                this.stars.rotation.y += delta * 0.01;
                this.stars.rotation.x += delta * 0.005;
                if (this.gameState === GAME_STATE.PAUSED) {
                    this.renderer.render(this.scene, this.camera);
                    return;
                }
                // --- Rocket Control (Update regardless of game state) ---
                // Process input if the rocket is visible
                if (this.rocket.group.visible) {
                    this.rocket.update(delta, this.keysPressed); // Update rocket state
                }
                // --- Shooting Star Logic ---
                this.shootingStarSpawnTimer -= delta;
                if (this.shootingStarSpawnTimer <= 0) {
                    var newStar = this.createShootingStarMesh();
                    this.scene.add(newStar);
                    this.shootingStars.push(newStar);
                    // Reset timer with some randomness (reduced positive range for more consistency)
                    this.shootingStarSpawnTimer = this.shootingStarSpawnInterval + THREE.MathUtils.randFloat(-0.2, 0.8);
                }
                // Update and remove shooting stars
                for(var i = this.shootingStars.length - 1; i >= 0; i--){
                    var star = this.shootingStars[i];
                    star.userData.lifetime += delta;
                    // Update position
                    star.position.addScaledVector(star.userData.velocity, delta);
                    // Fade out
                    var lifeRatio = star.userData.lifetime / star.userData.maxLifetime;
                    if (lifeRatio > 0.7) {
                        star.material.opacity = THREE.MathUtils.lerp(0.8, 0, (lifeRatio - 0.7) / 0.3);
                    }
                    // Remove if lifetime exceeded
                    if (star.userData.lifetime >= star.userData.maxLifetime) {
                        this.scene.remove(star);
                        star.geometry.dispose();
                        star.material.dispose();
                        this.shootingStars.splice(i, 1);
                    }
                }
                // Update game components if needed (e.g., animations)
                // this.piano.update(delta);
                // --- Update Answer Targets FIRST ---
                for(var i1 = this.answerTargets.length - 1; i1 >= 0; i1--){
                    var target = this.answerTargets[i1];
                    // Removal is handled within target.hit() via setTimeout
                    // Only update targets that haven't been hit yet
                    if (!target.isHit) {
                        target.update(delta); // This recalculates the bounding box
                    }
                }
                // Check for collisions between answer targets
                if (this.answerTargets.length > 1) {
                    this.targetCollisionManager.update(delta);
                }
                // --- Update Bullets and Check Collisions ---
                this.shootTimer = Math.max(0, this.shootTimer - delta); // Decrease cooldown timer
                for(var i2 = this.bullets.length - 1; i2 >= 0; i2--){
                    var bullet = this.bullets[i2];
                    bullet.update(delta); // Update bullet position (sets current and previous pos)
                    // Safety check for bullets going too far off-screen
                    if (bullet.isAlive) {
                        var targetZ = -15; // Reference Z plane for visibility calculation
                        var vFOV = THREE.MathUtils.degToRad(this.camera.fov);
                        var visibleHeightAtTarget = 2 * Math.tan(vFOV / 2) * Math.abs(targetZ);
                        var visibleWidthAtTarget = visibleHeightAtTarget * this.camera.aspect;
                        var offScreenFactor = 1.5; // How far off-screen before removal (e.g., 1.5 times visible width/height)
                        var maxDistanceX = visibleWidthAtTarget / 2 * offScreenFactor;
                        var maxDistanceY = visibleHeightAtTarget / 2 * offScreenFactor;
                        // Check if bullet is beyond these boundaries
                        if (Math.abs(bullet.mesh.position.x) > maxDistanceX || Math.abs(bullet.mesh.position.y) > maxDistanceY) {
                            bullet.destroy(); // Assumes destroy() sets isAlive = false and cleans up the THREE.js mesh
                        }
                    }
                    // Check for collisions using the CollisionManager (targets AND asteroids)
                    // Only check if bullet is still alive after the off-screen check
                    if (bullet.isAlive && this.gameState === GAME_STATE.PLAYING) {
                        // The checkBulletTargetCollisions now also calls checkBulletAsteroidCollisions
                        // and will handle playing the pattern of the *hit target*
                        this.collisionManager.checkBulletTargetCollisions(bullet);
                    }
                    // Clean up bullets from the array if they are no longer alive (hit target, asteroid, OR went off-screen)
                    if (!bullet.isAlive) {
                        this.bullets.splice(i2, 1);
                    // No need to call destroy() here, it was called immediately on hit
                    }
                } // End of bullet loop
                // Update impact effects
                for(var i3 = this.impactEffects.length - 1; i3 >= 0; i3--){
                    var effect = this.impactEffects[i3];
                    var alive = effect.update(delta);
                    if (!alive) {
                        this.impactEffects.splice(i3, 1);
                    }
                }
                // --- Update Asteroids ---
                if (this.gameState === GAME_STATE.PLAYING) {
                    // Spawn new asteroids periodically if below max
                    this.asteroidSpawnTimer -= delta;
                    if (this.asteroids.length < MAX_ASTEROIDS && this.asteroidSpawnTimer <= 0) {
                        this.spawnAsteroid();
                        this.asteroidSpawnTimer = this.asteroidSpawnInterval + THREE.MathUtils.randFloat(-0.5, 0.5);
                    }
                    // Update existing asteroids and remove hit ones
                    for(var i4 = this.asteroids.length - 1; i4 >= 0; i4--){
                        var asteroid = this.asteroids[i4];
                        asteroid.update(delta);
                        if (asteroid.isHit) {
                            // The asteroid itself handles timed removal in its hit() method
                            // We just need to remove it from our game array after its internal timer finishes
                            // This check assumes removeFromScene() nullifies the asteroid's scene property
                            if (!asteroid.scene) {
                                this.asteroids.splice(i4, 1);
                            }
                        }
                    }
                }
                // --- Target update loop removed from here ---
                this.renderer.render(this.scene, this.camera);
                // --- Rocket Flame Confetti ---
                if (this.rocket.isThrusting && this.rocket.group.visible) {
                    this._flameConfettiCooldown -= delta;
                    if (this._flameConfettiCooldown <= 0) {
                        this.triggerFlameConfetti();
                        this._flameConfettiCooldown = 0.07;
                    }
                } else {
                    this._flameConfettiCooldown = 0;
                }
            }
        },
        {
            // --- Helper Methods for Answer Targets ---
            key: "createAnswerTargets",
            value: function createAnswerTargets(options) {
                var _this = this;
                var _this_currentQuestion;
                var displayMode = this.ui.displayMode; // Get current display mode from UI
                var tonicNote = (_this_currentQuestion = this.currentQuestion) === null || _this_currentQuestion === void 0 ? void 0 : _this_currentQuestion.patternNames[0];
                options.forEach(function(solfegeOption, index) {
                    var displayText = formatSolfegeDisplay(solfegeOption); // Default to Solfege
                    // Determine display text based on UI mode (similar logic to ui.displayQuestion)
                    if (displayMode === 'pitch' && tonicNote) {
                        var notesArray = _this.levelManager.solfegeStringToNotes(solfegeOption, tonicNote);
                        if (notesArray) {
                            var sharpToFlatMap = {
                                'F#': 'Gb',
                                'C#': 'Db',
                                'G#': 'Ab',
                                'D#': 'Eb',
                                'A#': 'Bb'
                            };
                            var flatKeyTonics = [
                                'F',
                                'Bb',
                                'Eb',
                                'Ab',
                                'Db',
                                'Gb'
                            ];
                            // 1. Determine the canonical tonic name for key signature check
                            var rawTonicName = tonicNote.replace(/\d+$/, '');
                            var _sharpToFlatMap_rawTonicName;
                            var canonicalTonicName = (_sharpToFlatMap_rawTonicName = sharpToFlatMap[rawTonicName]) !== null && _sharpToFlatMap_rawTonicName !== void 0 ? _sharpToFlatMap_rawTonicName : rawTonicName; // Convert G# to Ab etc. for the check
                            // 2. Determine if the key signature uses flats
                            var useFlats = flatKeyTonics.includes(canonicalTonicName);
                            // 3. Convert notes in the option array based on useFlats
                            displayText = notesArray.map(function(note) {
                                var noteName = note.replace(/\d+$/, '');
                                // Convert sharps to flats ONLY if the key uses flats
                                if (useFlats && sharpToFlatMap[noteName]) {
                                    return sharpToFlatMap[noteName];
                                }
                                // No conversion needed or key uses sharps, return original (or sharp) name
                                return noteName;
                            }).join(', ');
                        } else {
                            console.warn('Failed to convert target Solfege "'.concat(solfegeOption, '" to pitch names.'));
                        // Fallback: displayText remains Solfege
                        }
                    }
                    // Calculate position: Cluster targets near top-center (below title area) at Z = -15
                    var numOptions = options.length;
                    var clusterWidth = 8; // How wide the cluster area is
                    var clusterHeight = 3; // How high the cluster area is
                    var clusterCenterX = 0;
                    var clusterCenterY = 6.5; // Positioned much higher on the screen to avoid Play Pattern button
                    var targetZ = -15; // Keep fixed Z
                    // Distribute targets within the cluster area
                    var xPos = clusterCenterX + (index - (numOptions - 1) / 2) * (clusterWidth / Math.max(1, numOptions - 1) || 1);
                    var yPos = clusterCenterY + THREE.MathUtils.randFloatSpread(clusterHeight); // Random Y within the height
                    var position = new THREE.Vector3(xPos, yPos, targetZ);
                    // Create the target instance, passing the loaded font
                    // Only create if font is loaded to avoid errors
                    // Create the target instance, passing the camera
                    var target = new AnswerTarget(_this.scene, _this.camera, displayText, solfegeOption, position);
                    // Check if sprite was created successfully before adding
                    if (target.sprite) {
                        _this.answerTargets.push(target);
                    } else {
                        console.error("Failed to add AnswerTarget to list because sprite creation failed:", solfegeOption);
                    }
                });
            }
        },
        {
            key: "clearAnswerTargets",
            value: function clearAnswerTargets() {
                // Reset selection state when clearing targets
                this.answerTargets.forEach(function(target) {
                    target.isSelected = false;
                    target.isHit = false;
                });
                this.answerTargets.forEach(function(target) {
                    return target.removeFromScene();
                });
                this.answerTargets = [];
            }
        },
        {
            // Helper to convert 3D world position to 2D screen position (0-1 range)
            key: "worldToScreen",
            value: function worldToScreen(worldVector) {
                var vector = worldVector.clone();
                vector.project(this.camera); // Project 3D point to NDC (-1 to 1)
                var x = vector.x * 0.5 + 0.5; // Convert x from [-1, 1] to [0, 1]
                var y = vector.y * -0.5 + 0.5; // Convert y from [-1, 1] to [0, 1] (invert y)
                // Clamp values to prevent confetti from appearing off-screen if rocket is partially visible
                return {
                    x: Math.max(0, Math.min(1, x)),
                    y: Math.max(0, Math.min(1, y))
                };
            }
        },
        {
            key: "triggerFlameConfetti",
            value: function triggerFlameConfetti() {
                // Calculate the flame origin point slightly below the rocket's center, in world space
                // Get angle directly from visual rotation
                var angle = this.rocket.group.rotation.z + Math.PI / 2;
                var baseOffset = 1.0; // Adjust as needed, relative to rocket size
                var flameOriginOffset = new THREE.Vector3(Math.cos(angle + Math.PI) * baseOffset, Math.sin(angle + Math.PI) * baseOffset, 0);
                var flameWorldPos = this.rocket.group.position.clone().add(flameOriginOffset);
                // Convert world position to screen coordinates for confetti
                var origin = this.worldToScreen(flameWorldPos);
                // Calculate confetti ejection angle (opposite to rocket thrust direction)
                var ejectionAngleDegrees = (angle + Math.PI) * 180 / Math.PI % 360;
                // Fire confetti
                this.customConfetti({
                    particleCount: 8,
                    angle: ejectionAngleDegrees,
                    spread: 25,
                    startVelocity: 30,
                    decay: 1.0,
                    gravity: 0.1,
                    drift: THREE.MathUtils.randFloat(-0.5, 0.5),
                    origin: origin,
                    colors: [
                        '#FFFFFF',
                        '#FF00FF',
                        '#00FFFF'
                    ],
                    // Use music note shapes for exhaust
                    shapes: [
                        'M5 1v11.5c0 2.48-1.98 4.5-4.43 4.5S.14 14.98.14 12.5s1.98-4.5 4.43-4.5c.3 0 .58.03.86.08V1h-.86z',
                        'M5 0v11.41c-.79-.26-1.67-.41-2.57-.41C1.1 11 0 12.1 0 13.43S1.1 15.87 2.43 15.87c1.28 0 2.33-1.05 2.43-2.34.01-.15.01-.3.01-.45V0H5z' // Quarter Note
                    ],
                    scalar: THREE.MathUtils.randFloat(0.6, 1.0),
                    zIndex: 1 // Ensure it's on the confetti canvas layer
                });
            }
        }
    ]);
    return Game;
}();
