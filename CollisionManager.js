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
import { ImpactEffect } from './ImpactEffect.js';
export var CollisionManager = /*#__PURE__*/ function() {
    "use strict";
    function CollisionManager(game) {
        _class_call_check(this, CollisionManager);
        this.game = game;
        this.raycaster = new THREE.Raycaster();
    }
    _create_class(CollisionManager, [
        {
            key: "checkBulletTargetCollisions",
            value: function checkBulletTargetCollisions(bullet) {
                if (!bullet || !bullet.isAlive || !bullet.mesh || !bullet.mesh.position) {
                    return false;
                }
                // Safety check for required properties
                if (!bullet.previousPosition) {
                    console.warn("Bullet missing previousPosition");
                    return false;
                }
                // Debug visualization - add a small marker at bullet position
                if (Math.random() < 0.1) {
                    console.log("Bullet position: ".concat(bullet.mesh.position.x.toFixed(2), ", ").concat(bullet.mesh.position.y.toFixed(2), ", ").concat(bullet.mesh.position.z.toFixed(2)));
                }
                // Calculate bullet's movement vector for this frame
                var bulletMoveVector = new THREE.Vector3().subVectors(bullet.mesh.position, bullet.previousPosition);
                var bulletMoveDistance = bulletMoveVector.length();
                if (bulletMoveDistance === 0) return false;
                // Simplified collision detection since bullets and targets are on the same Z plane
                // We can use a more optimized 2D distance check instead of ray casting
                // Get bullet's current position for direct distance checks
                var bulletPosition = bullet.mesh.position;
                // More forgiving hit detection radius
                // Use the bullet's defined hitbox radius if available, otherwise use default
                var bulletRadius = bullet.hitboxRadius || 2.5;
                // Check for intersection with each target's bounding box
                for(var i = 0; i < this.game.answerTargets.length; i++){
                    var target = this.game.answerTargets[i];
                    // Skip targets that don't have a bounding box (or sprite)
                    // REMOVED: Don't skip targets that are already hit or selected to allow multiple hits.
                    if (!target.boundingBox || !target.sprite) {
                        continue;
                    }
                    // Check for intersection with the target's bounding box
                    var intersectionPoint = new THREE.Vector3();
                    // Debug visualization reduced to avoid console spam
                    if (Math.random() < 0.05) {
                        console.log("Bullet position: ".concat(bullet.mesh.position.x.toFixed(2), ", ").concat(bullet.mesh.position.y.toFixed(2), ", ").concat(bullet.mesh.position.z.toFixed(2)));
                        console.log("Target position: ".concat(target.sprite.position.x.toFixed(2), ", ").concat(target.sprite.position.y.toFixed(2), ", ").concat(target.sprite.position.z.toFixed(2)));
                        console.log("Target bounding box: min(".concat(target.boundingBox.min.x.toFixed(2), ", ").concat(target.boundingBox.min.y.toFixed(2), ", ").concat(target.boundingBox.min.z.toFixed(2), ") max(").concat(target.boundingBox.max.x.toFixed(2), ", ").concat(target.boundingBox.max.y.toFixed(2), ", ").concat(target.boundingBox.max.z.toFixed(2), ")"));
                    }
                    // With bullets and targets on the same Z plane, we can use a much simpler 2D distance check
                    // Get the target's center position
                    var targetCenter = new THREE.Vector2(target.sprite.position.x, target.sprite.position.y);
                    // Get the bullet position in 2D
                    var bulletPos2D = new THREE.Vector2(bulletPosition.x, bulletPosition.y);
                    // Get target dimensions with padding for hit detection
                    var targetWidth = target.sprite.scale.x;
                    var targetHeight = target.sprite.scale.y;
                    // Create a "hit rectangle" around the target for collision detection
                    // Using half-dimensions for distance comparison from center
                    var halfWidth = targetWidth / 2 + bulletRadius;
                    var halfHeight = targetHeight / 2 + bulletRadius;
                    // Calculate distance from bullet to target center
                    var distanceToTarget = bulletPos2D.distanceTo(targetCenter);
                    // Log distance data occasionally for debugging
                    if (Math.random() < 0.05) {
                        console.log("Target: ".concat(target.solfegeText, ", Distance: ").concat(distanceToTarget.toFixed(2)));
                        console.log("Target dimensions: ".concat(targetWidth.toFixed(2), " x ").concat(targetHeight.toFixed(2)));
                        console.log("Hit area: ".concat(halfWidth.toFixed(2), " x ").concat(halfHeight.toFixed(2)));
                    }
                    // First do a quick circle-based check using the distance to center
                    // This is faster than box checks and catches most hits
                    if (distanceToTarget < Math.max(halfWidth, halfHeight)) {
                        // For more precise detection, check if the bullet is inside the target's hit rectangle
                        // This handles rectangular targets better than just a circular check
                        var dx = Math.abs(bulletPos2D.x - targetCenter.x);
                        var dy = Math.abs(bulletPos2D.y - targetCenter.y);
                        if (dx <= halfWidth && dy <= halfHeight) {
                            // Set bullet position to target center for impact effect
                            bullet.mesh.position.x = target.sprite.position.x;
                            bullet.mesh.position.y = target.sprite.position.y;
                            // If it's correct or it hasn't been hit yet, process the hit
                            var isCorrect = target.solfegeText === this.game.currentQuestion.correctAnswer;
                            // Only mark as selected if correct
                            if (isCorrect) {
                                target.isSelected = true;
                            }
                            // Process hit
                            target.hit(isCorrect);
                            // Create impact effect at the hit location
                            // Use the target's sprite position instead of undefined boxCenter
                            var impactPosition = target.sprite.position.clone();
                            var impactEffect = new ImpactEffect(this.game.scene, impactPosition, isCorrect);
                            this.game.impactEffects.push(impactEffect);
                            // Handle game state updates
                            this.handleTargetHit(target, isCorrect);
                            // Ensure the bullet is completely destroyed and all references are gone
                            bullet.isAlive = false;
                            // Immediately remove bullet mesh from scene before cleanup
                            if (bullet.mesh && bullet.mesh.parent) {
                                bullet.scene.remove(bullet.mesh);
                            }
                            // Remove trail immediately
                            if (bullet.trail && bullet.trail.parent) {
                                bullet.scene.remove(bullet.trail);
                            }
                            // Destroy the bullet properly before removing it from the array
                            bullet.destroy();
                            // Remove the bullet from the game's bullets array immediately
                            var bulletIndex = this.game.bullets.findIndex(function(b) {
                                return b === bullet;
                            });
                            if (bulletIndex !== -1) {
                                this.game.bullets.splice(bulletIndex, 1);
                            }
                            // For incorrect targets, keep them in the scene for multiple hits.
                            // We no longer need to modify the game.answerTargets array here,
                            // as the target's 'isHit' or 'isSelected' state doesn't prevent future collisions.
                            // The target.hit() method will handle visual feedback.
                            // Correct targets will still be visually distinct (e.g., different color/effect),
                            // and the game state advancement is handled in handleTargetHit based on the "Next" button visibility.
                            // Also trigger UI feedback that matches the stationary buttons
                            // The audioManager.playPatternForTarget will play the appropriate sound and pattern
                            // based on whether the target is correct or not.
                            // Use target.originalSolfegeText to ensure pure solfege is passed.
                            this.game.audioManager.playPatternForTarget(target.originalSolfegeText, isCorrect, /* onPlayCallback */ null);
                            if (!isCorrect) {
                                // For incorrect hits, create a red explosion similar to stationary answers
                                this.game.triggerIncorrectAnimation(target.sprite.position);
                            } else {
                                // For correct hits, trigger the correct animation
                                this.game.triggerCorrectAnimation();
                            }
                            return true;
                        }
                    }
                }
                // --- NEW: Check collision with asteroids ---
                if (this.checkBulletAsteroidCollisions(bullet)) {
                    return true; // Bullet hit an asteroid, stop further checks
                }
                return false;
            }
        },
        {
            // New method to check bullet collisions with asteroids
            key: "checkBulletAsteroidCollisions",
            value: function checkBulletAsteroidCollisions(bullet) {
                if (!bullet || !bullet.isAlive || !bullet.mesh || !bullet.mesh.position) {
                    return false;
                }
                var bulletPosition = bullet.mesh.position;
                var bulletRadius = bullet.hitboxRadius || 0.5; // Use a radius for bullets too
                for(var i = 0; i < this.game.asteroids.length; i++){
                    var asteroid = this.game.asteroids[i];
                    // Skip asteroids that are already hit or don't have a mesh/bounding box
                    if (asteroid.isHit || !asteroid.mesh || !asteroid.boundingBox) {
                        continue;
                    }
                    // Simple distance check in 2D (since everything is on the Z=-15 plane)
                    var asteroidPos2D = new THREE.Vector2(asteroid.mesh.position.x, asteroid.mesh.position.y);
                    var bulletPos2D = new THREE.Vector2(bulletPosition.x, bulletPosition.y);
                    // Get asteroid radius (approximate from geometry)
                    var asteroidRadius = asteroid.mesh.geometry.parameters.radius || 0.3; // Default if radius not found
                    var distanceSq = bulletPos2D.distanceToSquared(asteroidPos2D);
                    var collisionRadius = bulletRadius + asteroidRadius;
                    var collisionDistanceSq = collisionRadius * collisionRadius;
                    if (distanceSq < collisionDistanceSq) {
                        // Collision detected!
                        console.log("Bullet hit Asteroid!");
                        // Trigger asteroid hit logic (handles removal timer)
                        asteroid.hit();
                        // Trigger confetti explosion at asteroid position
                        var screenPos = this.game.worldToScreen(asteroid.mesh.position.clone());
                        this.game.customConfetti({
                            particleCount: 150,
                            angle: THREE.MathUtils.randFloat(0, 360),
                            spread: THREE.MathUtils.randFloat(30, 60),
                            origin: screenPos,
                            colors: [
                                '#00FFFF',
                                '#FFFFFF',
                                '#87CEEB'
                            ],
                            shapes: [
                                'square',
                                'M0 0 L10 0 L10 2 L0 2 Z'
                            ],
                            scalar: THREE.MathUtils.randFloat(0.4, 0.8),
                            startVelocity: THREE.MathUtils.randFloat(12, 20),
                            decay: THREE.MathUtils.randFloat(0.88, 0.94)
                        });
                        // --- Destroy the bullet ---
                        bullet.isAlive = false;
                        if (bullet.mesh && bullet.mesh.parent) {
                            bullet.scene.remove(bullet.mesh);
                        }
                        if (bullet.trail && bullet.trail.parent) {
                            bullet.scene.remove(bullet.trail);
                        }
                        bullet.destroy(); // Ensure cleanup
                        // Remove bullet from game array immediately
                        var bulletIndex = this.game.bullets.findIndex(function(b) {
                            return b === bullet;
                        });
                        if (bulletIndex !== -1) {
                            this.game.bullets.splice(bulletIndex, 1);
                        }
                        return true; // Bullet hit something, stop checking for this bullet
                    }
                }
                return false; // No asteroid collision detected for this bullet
            }
        },
        {
            key: "handleTargetHit",
            value: function handleTargetHit(target, isCorrect) {
                var _this_game_levelManager_getScoring = this.game.levelManager.getScoring(this.game.currentLevel), pointsCorrect = _this_game_levelManager_getScoring.pointsCorrect, pointsIncorrect = _this_game_levelManager_getScoring.pointsIncorrect;
                if (isCorrect) {
                    // Only update game state if this is the first correct hit
                    // Check if the "Next" button isn't visible yet (first correct hit for this question)
                    if (this.game.ui.nextPatternButton.style.visibility !== 'visible') {
                        // First correct hit logic: Update score, show button, etc.
                        // this.game.audioManager.playCorrectSound(); // Removed: playPatternForTarget handles audio
                        this.game.triggerCorrectAnimation(); // Confetti
                        this.game.ui.showFeedback('Correct!', true);
                        this.game.score += pointsCorrect;
                        this.game.ui.updateScore(this.game.score);
                        this.game.ui.showNextPatternButton();
                    } else {
                        // Subsequent correct hits: Only play sound/confetti, don't change game state again
                        // this.game.audioManager.playCorrectSound(); // Removed: playPatternForTarget handles audio
                        this.game.triggerCorrectAnimation(); // Still trigger confetti
                    // Optionally show brief feedback again
                    // this.game.ui.showFeedback('Correct!', true, 500); // Shorter duration maybe?
                    }
                } else {
                    // Always play sound and trigger animation for every incorrect hit
                    // this.game.audioManager.playIncorrectSound(); // Removed: playPatternForTarget handles audio
                    this.game.triggerIncorrectAnimation(target.sprite.position);
                    this.game.ui.showFeedback('Incorrect!', false);
                    this.game.score = Math.max(0, this.game.score + pointsIncorrect);
                    this.game.ui.updateScore(this.game.score);
                }
            }
        }
    ]);
    return CollisionManager;
}();
