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
export var TargetCollisionManager = /*#__PURE__*/ function() {
    "use strict";
    function TargetCollisionManager(game) {
        _class_call_check(this, TargetCollisionManager);
        this.game = game;
        // How much targets should bounce apart after collision
        this.bounceFactor = 0.4; // Reduced for gentler repulsion instead of bouncy collisions
        // Minimum distance between targets (based on their scale)
        this.minDistance = 1.5; // Further increased for better separation
        // Create a list of UI element zones to avoid
        this.uiElements = [];
    }
    _create_class(TargetCollisionManager, [
        {
            key: "update",
            value: function update(delta) {
                var targets = this.game.answerTargets;
                // Skip if there are fewer than 2 targets
                if (targets.length < 2) return;
                // Update UI elements to avoid - this ensures we have current positions
                this.updateUIElements();
                // Check collisions between all pairs of targets
                for(var i = 0; i < targets.length; i++){
                    var targetA = targets[i];
                    // Skip targets that are not active
                    if (targetA.isHit || targetA.isSelected || !targetA.sprite) continue;
                    // First check for collisions with UI elements
                    this.checkUICollisions(targetA, delta);
                    // Then check for collisions with other targets
                    for(var j = i + 1; j < targets.length; j++){
                        var targetB = targets[j];
                        // Skip targets that are not active
                        if (targetB.isHit || targetB.isSelected || !targetB.sprite) continue;
                        // Check for collision between these two targets
                        this.checkTargetCollision(targetA, targetB);
                    }
                }
            }
        },
        {
            key: "updateUIElements",
            value: function updateUIElements() {
                // Get camera properties for calculating screen coordinates
                var camera = this.game.camera;
                if (!camera) return;
                var vFOV = THREE.MathUtils.degToRad(camera.fov);
                var targetZ = -15; // Z-plane where targets move
                var distance = Math.abs(targetZ);
                var visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
                var visibleWidth = visibleHeight * camera.aspect;
                // Clear previous UI elements
                this.uiElements = [];
                // Define UI areas to avoid (in world coordinates)
                // Calculate width relative to screen aspect ratio
                var screenWidthFactor = visibleWidth / 2;
                var screenHeightFactor = visibleHeight / 2;
                // Define Play Pattern button zone
                if (this.game.ui && this.game.ui.playPatternButton && this.game.ui.playPatternButton.style.visibility !== 'hidden') {
                    this.uiElements.push({
                        x: 0,
                        y: screenHeightFactor * 0.4,
                        width: screenWidthFactor * 0.6,
                        height: screenHeightFactor * 0.2 // Height relative to screen
                    });
                }
                // Define Next Pattern button zone
                if (this.game.ui && this.game.ui.nextPatternButton && this.game.ui.nextPatternButton.style.visibility !== 'hidden') {
                    this.uiElements.push({
                        x: 0,
                        y: screenHeightFactor * 0.7,
                        width: screenWidthFactor * 0.6,
                        height: screenHeightFactor * 0.2
                    });
                }
                // Define header area (Score/Level/Feedback - Top 15%)
                this.uiElements.push({
                    x: 0,
                    y: screenHeightFactor * 0.85,
                    width: visibleWidth,
                    height: screenHeightFactor * 0.3 // Height covering 15% (0.15 * 2)
                });
                // Define piano area (bottom of screen)
                this.uiElements.push({
                    x: 0,
                    y: -screenHeightFactor * 0.8,
                    width: visibleWidth,
                    height: screenHeightFactor * 0.35 // Bottom 15% of screen
                });
            }
        },
        {
            key: "checkUICollisions",
            value: function checkUICollisions(target, delta) {
                if (!target.sprite || !target.velocity) return;
                var position = target.sprite.position;
                // Store original position for restoration if needed
                var originalPosition = position.clone();
                // Apply velocity to get next position
                var nextPosition = originalPosition.clone().addScaledVector(target.velocity, delta);
                // Get target dimensions
                var targetWidth = target.sprite.scale.x;
                var targetHeight = target.sprite.scale.y;
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    // Check each UI element
                    for(var _iterator = this.uiElements[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var element = _step.value;
                        // Calculate element boundaries
                        var halfWidth = element.width / 2;
                        var halfHeight = element.height / 2;
                        var elementLeft = element.x - halfWidth;
                        var elementRight = element.x + halfWidth;
                        var elementTop = element.y + halfHeight;
                        var elementBottom = element.y - halfHeight;
                        // Calculate target boundaries at next position
                        var targetLeft = nextPosition.x - targetWidth / 2;
                        var targetRight = nextPosition.x + targetWidth / 2;
                        var targetTop = nextPosition.y + targetHeight / 2;
                        var targetBottom = nextPosition.y - targetHeight / 2;
                        // Check for intersection
                        if (targetRight > elementLeft && targetLeft < elementRight && targetTop > elementBottom && targetBottom < elementTop) {
                            // Collision detected - determine which side to bounce from
                            var overlapLeft = targetRight - elementLeft;
                            var overlapRight = elementRight - targetLeft;
                            var overlapTop = targetTop - elementBottom;
                            var overlapBottom = elementTop - targetBottom;
                            // Find the minimum overlap to determine bounce direction
                            var minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                            // Collision detected - Apply separation and reflect velocity
                            var separationForce = 1.1; // How strongly to push away
                            // Apply separation based on the minimum overlap direction
                            if (minOverlap === overlapLeft) {
                                position.x = elementLeft - targetWidth / 2 - 0.05; // Move slightly past edge
                                target.velocity.x = Math.abs(target.velocity.x) * -0.5; // Reflect X velocity gently
                            } else if (minOverlap === overlapRight) {
                                position.x = elementRight + targetWidth / 2 + 0.05;
                                target.velocity.x = Math.abs(target.velocity.x) * 0.5; // Reflect X velocity gently
                            } else if (minOverlap === overlapTop) {
                                position.y = elementBottom - targetHeight / 2 - 0.05;
                                target.velocity.y = Math.abs(target.velocity.y) * -0.5; // Reflect Y velocity gently
                            } else {
                                position.y = elementTop + targetHeight / 2 + 0.05;
                                target.velocity.y = Math.abs(target.velocity.y) * 0.5; // Reflect Y velocity gently
                            }
                            // Add a small outward push to prevent getting stuck
                            var pushDirection = new THREE.Vector3().subVectors(position, new THREE.Vector3(element.x, element.y, position.z)).normalize();
                            target.velocity.addScaledVector(pushDirection, separationForce * 0.5); // Apply small push
                            // Dampen velocity after collision
                            target.velocity.multiplyScalar(0.85);
                            break;
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally{
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return != null) {
                            _iterator.return();
                        }
                    } finally{
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }
        },
        {
            key: "checkTargetCollision",
            value: function checkTargetCollision(targetA, targetB) {
                // Get positions
                var posA = targetA.sprite.position;
                var posB = targetB.sprite.position;
                // Get collision radii (using the larger of width/height for simplicity)
                // Use full width/height for better separation
                var radiusA = Math.max(targetA.sprite.scale.x, targetA.sprite.scale.y);
                var radiusB = Math.max(targetB.sprite.scale.x, targetB.sprite.scale.y);
                // Calculate distance between centers
                var distance = posA.distanceTo(posB);
                // Minimum distance to prevent overlap (plus a small buffer)
                var minDistance = (radiusA + radiusB) * this.minDistance;
                // Check if they're too close
                if (distance < minDistance) {
                    // Calculate collision normal
                    var normal = new THREE.Vector3().subVectors(posB, posA).normalize();
                    // Calculate relative velocity
                    var relativeVelocity = new THREE.Vector3().subVectors(targetB.velocity, targetA.velocity);
                    // Calculate velocity along the normal
                    var velAlongNormal = relativeVelocity.dot(normal);
                    // Skip if objects are moving away from each other
                    if (velAlongNormal > 0) return;
                    // Calculate impulse scalar
                    var impulse = -(1 + this.bounceFactor) * velAlongNormal;
                    // Apply impulse to velocities
                    var impulseVector = normal.clone().multiplyScalar(impulse);
                    // For equal mass objects, split the impulse equally
                    targetA.velocity.sub(impulseVector.clone().multiplyScalar(0.5));
                    targetB.velocity.add(impulseVector.clone().multiplyScalar(0.5));
                    // Move them apart to prevent overlap
                    var overlap = minDistance - distance;
                    var separationVector = normal.clone().multiplyScalar(overlap * 0.7); // Increased for stronger separation
                    posA.sub(separationVector);
                    posB.add(separationVector);
                    // Reduced randomization for smoother and more predictable movement
                    targetA.velocity.x += THREE.MathUtils.randFloatSpread(0.15);
                    targetA.velocity.y += THREE.MathUtils.randFloatSpread(0.15);
                    targetB.velocity.x += THREE.MathUtils.randFloatSpread(0.15);
                    targetB.velocity.y += THREE.MathUtils.randFloatSpread(0.15);
                    // Stronger damping to reduce bouncy behavior
                    targetA.velocity.multiplyScalar(0.85);
                    targetB.velocity.multiplyScalar(0.85);
                }
            }
        }
    ]);
    return TargetCollisionManager;
}();
