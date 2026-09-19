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
var BULLET_LIFETIME = 3.0; // Longer lifetime
// Removed BULLET_SPEED definition from here
var BULLET_SCALE = 0.35; // Increased bullet size for better visibility
var BULLET_HITBOX_RADIUS = 1.5; // Separate hitbox radius for collision detection
var BULLET_COLOR = 0x00FF00; // Bright Green
var BASE_SCALE = 0.25; // Base world scale at a reference distance
var REFERENCE_DISTANCE = 10; // Distance at which BASE_SCALE is applied
export var Bullet = /*#__PURE__*/ function() {
    "use strict";
    function Bullet(startPosition, initialVelocity, scene, camera) {
        _class_call_check(this, Bullet);
        this.scene = scene;
        this.camera = camera; // Store camera reference
        // Removed rocketTipUsed tracking
        // Geometry and Material
        // More visible bullet with glow effect and trail
        var geometry = new THREE.SphereGeometry(0.4, 16, 16); // Slightly larger, smoother sphere
        var material = new THREE.MeshBasicMaterial({
            color: BULLET_COLOR,
            depthWrite: false,
            transparent: true,
            opacity: 1.0
        });
        // Create a more visible trail effect for the bullet
        this.trailGeometry = new THREE.BufferGeometry();
        var trailPositions = new Float32Array(60); // 20 trail segments × 3 coordinates (longer trail)
        this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
        var trailMaterial = new THREE.LineBasicMaterial({
            color: BULLET_COLOR,
            transparent: true,
            opacity: 0.6,
            depthWrite: false
        });
        this.trail = new THREE.Line(this.trailGeometry, trailMaterial);
        this.trailPositions = [];
        for(var i = 0; i < 20; i++){
            this.trailPositions.push(startPosition.clone()); // Use startPosition
        }
        // Add a point light to the bullet for a glow effect
        this.bulletLight = new THREE.PointLight(BULLET_COLOR, 1, 3); // Larger light radius
        this.bulletLight.intensity = 2.0; // Increased intensity for better visibility
        this.mesh = new THREE.Mesh(geometry, material);
        // Initial state
        // Set the mesh position using the provided startPosition (already at Z=-15)
        this.mesh.position.copy(startPosition);
        this.mesh.scale.set(BULLET_SCALE, BULLET_SCALE, BULLET_SCALE); // Larger initial scale
        // Store hitbox radius for collision detection
        this.hitboxRadius = BULLET_HITBOX_RADIUS;
        this.mesh.renderOrder = 3; // Increased render order to be above targets
        this.previousPosition = new THREE.Vector3().copy(startPosition); // Store initial previous position
        // Directly use the provided initialVelocity
        this.velocity = initialVelocity.clone();
        this.speed = this.velocity.length(); // Store speed if needed elsewhere
        // Remove the old velocity calculation block based on rocketTip or angle
        // The velocity is now calculated in game.js and passed directly
        // Set the direction vector to match the actual velocity direction for visual effects
        this.directionVector = this.velocity.clone().normalize();
        // Set initial velocity values for the trail
        this.initialVelocity = this.velocity.clone();
        this.lifetime = 0;
        this.maxLifetime = BULLET_LIFETIME;
        this.isAlive = true;
        // Add bullet and trail to scene
        this.scene.add(this.mesh);
        this.scene.add(this.trail);
        // Add the light as a child of the mesh so it moves with the bullet
        this.mesh.add(this.bulletLight);
        // Add debug indicator for bullet direction (only in development)
        this.addDebugDirectionIndicator();
    }
    _create_class(Bullet, [
        {
            key: "update",
            value: function update(delta) {
                if (!this.isAlive) return;
                // Check lifetime to destroy bullets that stay too long
                this.lifetime += delta;
                if (this.lifetime >= this.maxLifetime) {
                    this.destroy();
                    return;
                }
                // Update position
                // Store current position as previous before updating
                this.previousPosition.copy(this.mesh.position);
                // Update current position
                this.mesh.position.addScaledVector(this.velocity, delta);
                // Force bullets to stay exactly on the target plane at z=-15
                this.mesh.position.z = -15;
                // Update trail effect
                this.trailPositions.pop(); // Remove last position
                this.trailPositions.unshift(this.mesh.position.clone()); // Add current position
                // Update trail geometry
                var positions = this.trailGeometry.attributes.position.array;
                for(var i = 0; i < this.trailPositions.length; i++){
                    var pos = this.trailPositions[i];
                    positions[i * 3] = pos.x;
                    positions[i * 3 + 1] = pos.y;
                    positions[i * 3 + 2] = pos.z;
                }
                this.trailGeometry.attributes.position.needsUpdate = true;
                // Fade trail over distance
                for(var i1 = 0; i1 < this.trailPositions.length; i1++){
                    var opacity = 1 - i1 / this.trailPositions.length;
                    var index = Math.floor(i1 / 3);
                    if (index < positions.length) {
                        this.trail.material.opacity = opacity * 0.6;
                    }
                }
            }
        },
        {
            key: "destroy",
            value: function destroy() {
                if (!this.isAlive) return;
                this.isAlive = false;
                // Remove debug direction indicator if it exists
                if (this.directionIndicator) {
                    if (this.mesh) this.mesh.remove(this.directionIndicator);
                    if (this.directionIndicator.geometry) this.directionIndicator.geometry.dispose();
                    if (this.directionIndicator.material) this.directionIndicator.material.dispose();
                    this.directionIndicator = null;
                }
                // First remove the light to prevent memory leaks
                if (this.bulletLight) {
                    if (this.mesh) this.mesh.remove(this.bulletLight);
                    this.bulletLight = null;
                }
                // Remove trail - make sure it's gone from the scene
                if (this.trail) {
                    if (this.trail.parent) {
                        this.scene.remove(this.trail);
                    }
                    if (this.trail.geometry) this.trail.geometry.dispose();
                    if (this.trail.material) this.trail.material.dispose();
                    this.trail = null;
                }
                // Remove mesh completely - make sure it's gone from the scene
                if (this.mesh) {
                    if (this.mesh.parent) {
                        this.scene.remove(this.mesh);
                    }
                    if (this.mesh.geometry) this.mesh.geometry.dispose();
                    if (this.mesh.material) this.mesh.material.dispose();
                    this.mesh = null;
                }
                // Clear references to previous positions
                this.previousPosition = null;
                this.velocity = null;
                this.trailPositions = null;
                this.trailGeometry = null;
                // Set scene reference to null last
                this.scene = null;
                this.camera = null;
                // Clear extra references
                this.initialVelocity = null;
            }
        },
        {
            // Add optional visual indicator for bullet direction (development helper)
            key: "addDebugDirectionIndicator",
            value: function addDebugDirectionIndicator() {
                // Create a small line showing bullet direction
                var directionGeometry = new THREE.BufferGeometry();
                var directionMaterial = new THREE.LineBasicMaterial({
                    color: 0xffff00,
                    transparent: true,
                    opacity: 0.5
                });
                // Create the direction line points - start at bullet position, extend in velocity direction
                var start = new THREE.Vector3(0, 0, 0);
                // Use the precise direction vector we calculated earlier
                var end = this.directionVector.clone().multiplyScalar(0.5);
                // Set the direction line vertices
                var linePositions = new Float32Array([
                    start.x,
                    start.y,
                    start.z,
                    end.x,
                    end.y,
                    end.z
                ]);
                directionGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
                // Create the direction indicator line
                this.directionIndicator = new THREE.Line(directionGeometry, directionMaterial);
                // Add to bullet mesh
                this.mesh.add(this.directionIndicator);
            }
        }
    ]);
    return Bullet;
}();
// Define BULLET_SPEED as a static property *inside* the class
_define_property(Bullet, "BULLET_SPEED", 24.0);
