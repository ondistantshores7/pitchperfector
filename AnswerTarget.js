// AnswerTarget.js - Using Sprites for 2D look
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
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import * as THREE from 'three';
// Removed TextGeometry import
// --- Constants for Texture Drawing ---
// Doubled dimensions for texture canvas to increase apparent size
var CANVAS_WIDTH_PX = 512; // Base texture resolution width (e.g., 256 * 2)
var CANVAS_HEIGHT_PX = 128; // Base texture resolution height (e.g., 64 * 2)
var FONT_SIZE_PX = 40; // Font size in pixels for canvas (e.g., 20 * 2)
var PADDING_PX = 10; // Padding around text (e.g., 5 * 2)
var BORDER_PX = 6; // Border thickness in pixels (e.g., 3 * 2)
// --- Sprite Scale in World Units ---
// Adjust these to control the final visual size in the 3D scene
var SPRITE_SCALE_X = 0.32;
var SPRITE_SCALE_Y = 0.09;
export var AnswerTarget = /*#__PURE__*/ function() {
    "use strict";
    function AnswerTarget(scene, camera, answerText, solfegeText) {
        var position = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : new THREE.Vector3(0, 0, -15);
        _class_call_check(this, AnswerTarget);
        this.scene = scene;
        this.camera = camera; // Store camera reference
        this.answerText = answerText; // Text displayed (Solfege or Pitch)
        this.solfegeText = solfegeText; // The actual answer value (always Solfege)
        this.originalSolfegeText = solfegeText;
        this.hasBeenScored = false;
        // Apply a random offset to the initial position to spread targets out more
        var spreadX = THREE.MathUtils.randFloatSpread(8); // Wider horizontal spread (-4 to +4)
        var spreadY = THREE.MathUtils.randFloatSpread(4); // Wider vertical spread (-2 to +2)
        position.x += spreadX;
        position.y += spreadY;
        this.originalPosition = position.clone(); // Store original position for recreating
        this.isHit = false;
        this.isSelected = false; // New flag to track if target has been selected
        this.velocity = new THREE.Vector3(THREE.MathUtils.randFloat(-0.15, 0.15), THREE.MathUtils.randFloat(-0.1, 0.1), THREE.MathUtils.randFloat(0.4, 1.0) // Keep Z movement the same
        );
        // No font needed
        this.texture = null;
        this.spriteMaterial = null;
        this.sprite = null;
        this.boundingBox = new THREE.Box3(); // Initialize boundingBox EARLY
        // Create the sprite
        this.createTargetSprite();
        if (this.sprite) {
            this.sprite.position.copy(position);
            // Scale the sprite to the desired world size
            this.sprite.scale.set(SPRITE_SCALE_X, SPRITE_SCALE_Y, 1);
            // Ensure the sprite material uses the correct depth settings
            this.spriteMaterial.needsUpdate = true;
            this.scene.add(this.sprite);
            // Compute initial bounding box
            this.computeBoundingBox();
            // Store reference to this instance in sprite's userData
            this.sprite.userData.answerTarget = this;
            this.sprite.userData.solfegeText = this.solfegeText; // Also store solfege for direct access if needed
        } else {
            console.error("Failed to create sprite for AnswerTarget:", this.answerText);
        }
    }
    _create_class(AnswerTarget, [
        {
            key: "createTargetTexture",
            value: function createTargetTexture() {
                var isHit = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false, isCorrect = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
                var canvas = document.createElement('canvas');
                canvas.width = CANVAS_WIDTH_PX;
                canvas.height = CANVAS_HEIGHT_PX;
                var ctx = canvas.getContext('2d');
                // Determine colors based on state
                var bgColor = '#FFFFFF'; // White
                var borderColor = '#FF00FF'; // Magenta
                var textColor = '#FF00FF'; // Magenta
                if (isHit) {
                    if (isCorrect) {
                        bgColor = '#00FF00'; // Green
                        borderColor = '#008000'; // Dark Green
                        textColor = '#003300'; // Darker Green
                    } else {
                        bgColor = '#FF0000'; // Red
                        borderColor = '#8B0000'; // Dark Red
                        textColor = '#FFFFFF'; // White text on red
                    }
                }
                // --- Draw Background ---
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                // --- Draw Border ---
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = BORDER_PX;
                // Offset rect by half line width for sharp inner corners
                ctx.strokeRect(BORDER_PX / 2, BORDER_PX / 2, canvas.width - BORDER_PX, canvas.height - BORDER_PX);
                // --- Draw Text ---
                ctx.fillStyle = textColor;
                // Use the same retro font as UI for consistency
                ctx.font = "".concat(FONT_SIZE_PX, 'px "Press Start 2P", cursive, sans-serif');
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                // Apply a small wordwrap if text is very long
                if (this.answerText.length > 15) {
                    var parts = this.answerText.split(', ');
                    var midpoint = Math.ceil(parts.length / 2);
                    var firstLine = parts.slice(0, midpoint).join(', ');
                    var secondLine = parts.slice(midpoint).join(', ');
                    ctx.fillText(firstLine, canvas.width / 2, canvas.height / 2 - 20);
                    ctx.fillText(secondLine, canvas.width / 2, canvas.height / 2 + 20);
                } else {
                    // Display text directly, assuming conversions happened in game.js
                    // (Or apply the same logic here if needed, but game.js should handle it)
                    var displayText = this.answerText; // Use the already-determined display text
                    ctx.fillText(displayText, canvas.width / 2, canvas.height / 2);
                }
                return new THREE.CanvasTexture(canvas);
            }
        },
        {
            key: "createTargetSprite",
            value: function createTargetSprite() {
                this.texture = this.createTargetTexture();
                var _obj;
                this.spriteMaterial = new THREE.SpriteMaterial((_obj = {
                    map: this.texture,
                    transparent: true,
                    opacity: 0.95,
                    depthTest: true,
                    depthWrite: true,
                    sizeAttenuation: false
                }, _define_property(_obj, "depthTest", true), _define_property(_obj, "depthWrite", true), _obj));
                this.sprite = new THREE.Sprite(this.spriteMaterial);
                // Set render order higher than rocket (-1) but lower than bullets (3)
                this.sprite.renderOrder = 2;
            }
        },
        {
            // Recompute bounding box (needed if sprite moves/scales)
            key: "computeBoundingBox",
            value: function computeBoundingBox() {
                if (!this.sprite || !this.boundingBox) {
                    console.warn("computeBoundingBox called before sprite or boundingBox initialized.");
                    return;
                }
                // Ensure sprite's matrix world is updated
                this.sprite.updateMatrixWorld(true);
                // Calculate bounding box based on sprite's position and scale
                // Box3.setFromObject doesn't work well with sprites directly, manually create it
                var baseHalfWidth = this.sprite.scale.x / 2;
                var baseHalfHeight = this.sprite.scale.y / 2;
                var padding = 1.5; // Significantly increased padding for much easier hits
                var halfWidth = baseHalfWidth + padding;
                var halfHeight = baseHalfHeight + padding;
                // Make the bounding box very thick along Z for much easier hits
                var halfDepth = 5; // Very large depth (Total depth 10 units)
                var centerZ = this.sprite.position.z; // Get the target's actual Z
                // Make the Z extent of the box much larger to dramatically improve hit detection with bullets
                this.boundingBox.set(new THREE.Vector3(this.sprite.position.x - halfWidth, this.sprite.position.y - halfHeight, centerZ - halfDepth), new THREE.Vector3(this.sprite.position.x + halfWidth, this.sprite.position.y + halfHeight, centerZ + halfDepth));
            }
        },
        {
            // Method to update the target (e.g., animations)
            key: "update",
            value: function update(delta) {
                // No rotation for 2D look
                // this.group.rotation.y += delta * 0.15; // REMOVED
                // --- Apply Velocity ---
                if (this.sprite && !this.isSelected) {
                    // Store previous position for collision response
                    var prevPosition = this.sprite.position.clone();
                    // Apply velocity
                    this.sprite.position.addScaledVector(this.velocity, delta);
                    // --- Dynamic Boundary Checks & Bounce ---
                    var targetZ = this.sprite.position.z;
                    // Calculate visible height/width at the target's depth
                    var vFOV = THREE.MathUtils.degToRad(this.camera.fov); // Vertical FOV in radians
                    var visibleHeight = 2 * Math.tan(vFOV / 2) * Math.abs(targetZ);
                    var visibleWidth = visibleHeight * this.camera.aspect;
                    // Define boundaries slightly inside the visible edges
                    var boundaryX = visibleWidth / 2 * 0.9; // Use 90% of half-width
                    var boundaryY = visibleHeight / 2 * 0.9; // Use 90% of half-height
                    // Bounce off horizontal walls with more energy and randomization
                    if (Math.abs(this.sprite.position.x) > boundaryX) {
                        this.velocity.x *= -0.9; // Gentler horizontal reflection
                        this.sprite.position.x = Math.sign(this.sprite.position.x) * boundaryX; // Clamp position
                        // Add minimal vertical randomization on wall bounce
                        this.velocity.y += THREE.MathUtils.randFloatSpread(0.1);
                    }
                    // Bounce off vertical walls with more energy and randomization
                    if (Math.abs(this.sprite.position.y) > boundaryY) {
                        this.velocity.y *= -0.9; // Gentler vertical reflection
                        this.sprite.position.y = Math.sign(this.sprite.position.y) * boundaryY; // Clamp position
                        // Add minimal horizontal randomization on wall bounce
                        this.velocity.x += THREE.MathUtils.randFloatSpread(0.1);
                    }
                    // Ensure targets don't stall - add minimum velocity if moving too slowly
                    var minSpeed = 0.1; // Reduced minimum speed for gentler motion
                    var currentSpeed = this.velocity.length();
                    if (currentSpeed < minSpeed) {
                        // Normalize and scale to minimum speed
                        this.velocity.normalize().multiplyScalar(minSpeed);
                        // Add minimal randomness to direction
                        this.velocity.x += THREE.MathUtils.randFloatSpread(0.05);
                        this.velocity.y += THREE.MathUtils.randFloatSpread(0.05);
                    }
                    // UI collision detection now handled by TargetCollisionManager
                    // Prevent target from going behind the camera or getting too close
                    var targetZPlane = -15; // Define the fixed Z-plane
                    // Keep targets strictly on the Z = -15 plane
                    if (this.sprite.position.z !== targetZPlane) {
                        this.sprite.position.z = targetZPlane;
                        this.velocity.z = 0; // Stop any Z movement if it somehow occurred
                    }
                }
                // --- Update Bounding Box ---
                // Only compute if not hit or selected, otherwise it's about to be removed or shouldn't be interacted with
                if (!this.isSelected) {
                    this.computeBoundingBox(); // Update box after moving
                }
            }
        },
        {
            // Method to handle being hit, now accepts correctness
            key: "hit",
            value: function hit(isCorrect) {
                var _this = this;
                // Allow multiple hits for incorrect targets
                if (isCorrect && (this.isHit || this.isSelected)) {
                    return; // Only allow one hit for correct targets
                }
                // Handle REPEATED incorrect hits (already hit at least once)
                if (!isCorrect && this.isHit) {
                    // Apply the incorrect pulse effect on each hit
                    this.applyIncorrectPulse();
                    // Exit early to prevent running the 'first incorrect hit' logic again
                    return;
                }
                // If we reach here, it's either a CORRECT hit OR the FIRST incorrect hit.
                if (isCorrect) {
                    this.isHit = true;
                    this.isSelected = true; // Mark as selected when hit
                    // For correct hits, change to green
                    if (this.texture) {
                        this.texture.dispose(); // Dispose old texture
                    }
                    this.texture = this.createTargetTexture(true, true);
                    this.spriteMaterial.map = this.texture;
                    // Schedule removal after a short delay to see the effect
                    setTimeout(function() {
                        return _this.removeFromScene();
                    }, 500);
                } else {
                    // --- Incorrect Hit Visuals ---
                    // Only change texture/material if this is the *first* incorrect hit
                    if (this.spriteMaterial && !this.isHit) {
                        if (this.texture) {
                            this.texture.dispose(); // Dispose old texture
                        }
                        var canvas = document.createElement('canvas');
                        canvas.width = CANVAS_WIDTH_PX;
                        canvas.height = CANVAS_HEIGHT_PX;
                        var ctx = canvas.getContext('2d');
                        // 1. Set transparent background
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        // 2. Draw red border
                        ctx.strokeStyle = '#FF0000'; // Red border
                        ctx.lineWidth = BORDER_PX;
                        ctx.strokeRect(BORDER_PX / 2, BORDER_PX / 2, canvas.width - BORDER_PX, canvas.height - BORDER_PX);
                        // 3. Draw white text
                        ctx.fillStyle = '#FFFFFF'; // White text
                        ctx.font = "".concat(FONT_SIZE_PX, 'px "Press Start 2P", cursive, sans-serif');
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        // Apply wordwrap logic if needed (same as before)
                        if (this.answerText.length > 15) {
                            var parts = this.answerText.split(', ');
                            var midpoint = Math.ceil(parts.length / 2);
                            var firstLine = parts.slice(0, midpoint).join(', ');
                            var secondLine = parts.slice(midpoint).join(', ');
                            ctx.fillText(firstLine, canvas.width / 2, canvas.height / 2 - FONT_SIZE_PX * 0.6); // Adjust vertical spacing
                            ctx.fillText(secondLine, canvas.width / 2, canvas.height / 2 + FONT_SIZE_PX * 0.6);
                        } else {
                            var displayText = this.answerText;
                            ctx.fillText(displayText, canvas.width / 2, canvas.height / 2);
                        }
                        // 4. Apply the new texture
                        this.texture = new THREE.CanvasTexture(canvas);
                        this.spriteMaterial.map = this.texture;
                        this.spriteMaterial.color.set(0xFFFFFF); // Reset color tint to white (transparency comes from texture)
                        this.spriteMaterial.opacity = 1.0; // Ensure full opacity (transparency is baked in)
                        this.spriteMaterial.needsUpdate = true;
                        // Apply pulse effect only when texture changes (first incorrect hit)
                        this.applyIncorrectPulse();
                    }
                    // NOW mark as hit (allows multiple incorrect hits but only changes texture once)
                    this.isHit = true;
                }
            } // <<< Added closing brace for the hit() method
        },
        {
            key: "applyIncorrectPulse",
            value: function applyIncorrectPulse() {
                var _this = this;
                // Visual feedback: Quick scale pulse only, no fade out for incorrect answers
                var initialScaleX = this.sprite.scale.x;
                var initialScaleY = this.sprite.scale.y;
                var pulseScaleFactor = 1.5; // Increased for more visible effect
                var duration = 0.25; // Shorter duration for quicker feedback
                // Force animation to start from beginning by clearing any existing animation
                if (this._pulseAnimationId) {
                    cancelAnimationFrame(this._pulseAnimationId);
                    this._pulseAnimationId = null;
                }
                // Make sure the sprite is always visible when pulsing
                if (this.sprite && this.spriteMaterial) {
                    this.spriteMaterial.opacity = 1.0;
                }
                var elapsed = 0;
                var animatePulse = function(timestamp) {
                    if (!_this.sprite) return; // Guard against removal during animation
                    var deltaTime = (timestamp - (animatePulse.lastTime || timestamp)) / 1000;
                    animatePulse.lastTime = timestamp;
                    elapsed += deltaTime;
                    var progress = Math.min(1, elapsed / duration);
                    // Scale up then down (peak at half duration)
                    var scaleProgress = Math.sin(progress * Math.PI); // 0 -> 1 -> 0 sine wave
                    var currentScaleX = initialScaleX * (1 + (pulseScaleFactor - 1) * scaleProgress);
                    var currentScaleY = initialScaleY * (1 + (pulseScaleFactor - 1) * scaleProgress);
                    _this.sprite.scale.set(currentScaleX, currentScaleY, 1);
                    // No opacity change for incorrect answers
                    if (progress < 1) {
                        _this._pulseAnimationId = requestAnimationFrame(animatePulse);
                    } else {
                        // Reset scale when done
                        _this.sprite.scale.set(initialScaleX, initialScaleY, 1);
                        _this._pulseAnimationId = null;
                    }
                };
                animatePulse.lastTime = performance.now(); // Initialize lastTime
                this._pulseAnimationId = requestAnimationFrame(animatePulse);
            }
        },
        {
            key: "hitEffect",
            value: function hitEffect(isCorrect) {
                var _this = this;
                // Visual feedback: Quick scale pulse and fade out - only for correct answers
                var initialScaleX = this.sprite.scale.x;
                var initialScaleY = this.sprite.scale.y;
                var pulseScaleFactor = 1.4; // How much bigger it gets momentarily
                var duration = 0.5; // Total duration of the effect in seconds (matches removal delay)
                var elapsed = 0;
                var animatePulse = function(timestamp) {
                    if (!_this.sprite || !_this.spriteMaterial) return; // Guard against removal during animation
                    var deltaTime = (timestamp - (animatePulse.lastTime || timestamp)) / 1000;
                    animatePulse.lastTime = timestamp;
                    elapsed += deltaTime;
                    var progress = Math.min(1, elapsed / duration);
                    // Scale up then down (peak at half duration)
                    var scaleProgress = Math.sin(progress * Math.PI); // 0 -> 1 -> 0 sine wave
                    var currentScaleX = initialScaleX * (1 + (pulseScaleFactor - 1) * scaleProgress);
                    var currentScaleY = initialScaleY * (1 + (pulseScaleFactor - 1) * scaleProgress);
                    _this.sprite.scale.set(currentScaleX, currentScaleY, 1);
                    // Fade out
                    _this.spriteMaterial.opacity = 1.0 - progress;
                    if (progress < 1) {
                        requestAnimationFrame(animatePulse);
                    }
                };
                animatePulse.lastTime = performance.now(); // Initialize lastTime
                requestAnimationFrame(animatePulse);
            }
        },
        {
            // Method to remove the target from the scene and dispose resources
            key: "removeFromScene",
            value: function removeFromScene() {
                if (this.scene && this.sprite) {
                    this.scene.remove(this.sprite);
                }
                // Dispose texture and material
                if (this.texture) {
                    this.texture.dispose();
                }
                if (this.spriteMaterial) {
                    this.spriteMaterial.dispose();
                }
                // Nullify references
                this.scene = null;
                this.sprite = null;
                this.texture = null;
                this.spriteMaterial = null;
            }
        }
    ]);
    return AnswerTarget;
}();
