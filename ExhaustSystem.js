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
import { ExhaustParticle } from './ExhaustParticle.js';
var MAX_PARTICLES = 100; // Limit total particles for performance
var SPAWN_RATE = 50; // Particles per second when thrusting
export var ExhaustSystem = /*#__PURE__*/ function() {
    "use strict";
    function ExhaustSystem(scene) {
        _class_call_check(this, ExhaustSystem);
        this.scene = scene;
        this.particles = [];
        this.particleContainer = new THREE.Group(); // Group particles for potentially easier management
        this.particleContainer.renderOrder = 1; // Render particles after rocket (rocket is 0)
        this.scene.add(this.particleContainer);
        this.spawnTimer = 0;
        this.spawnInterval = 1 / SPAWN_RATE; // Time between spawns
    }
    _create_class(ExhaustSystem, [
        {
            key: "spawnParticle",
            value: function spawnParticle(position, baseVelocity, spreadAngle, speedVariation) {
                if (this.particles.length >= MAX_PARTICLES) {
                    // Optional: Could remove the oldest particle if max is reached
                    return;
                }
                // Calculate random velocity variation
                var angleOffset = THREE.MathUtils.randFloatSpread(spreadAngle); // Spread in radians
                var speedMultiplier = 1.0 + THREE.MathUtils.randFloatSpread(speedVariation);
                // Rotate the base velocity slightly and apply speed variation
                var particleVelocity = baseVelocity.clone();
                particleVelocity.applyAxisAngle(new THREE.Vector3(0, 0, 1), angleOffset); // Assuming Z is the up-axis for rotation
                particleVelocity.multiplyScalar(speedMultiplier);
                // Create and add the particle
                var particle = new ExhaustParticle(position, particleVelocity);
                this.particles.push(particle);
                this.particleContainer.add(particle.mesh);
            }
        },
        {
            key: "update",
            value: function update(delta, isThrusting, rocketPosition, rocketAngle) {
                // Spawn new particles if thrusting
                if (isThrusting) {
                    this.spawnTimer += delta;
                    while(this.spawnTimer >= this.spawnInterval){
                        this.spawnTimer -= this.spawnInterval;
                        // Calculate spawn position (slightly behind the rocket center)
                        var baseOffset = 0.8; // Distance behind rocket center (adjust based on ROCKET_SCALE)
                        var spawnOffset = new THREE.Vector3(Math.cos(rocketAngle + Math.PI) * baseOffset, Math.sin(rocketAngle + Math.PI) * baseOffset, 0);
                        var spawnPosition = rocketPosition.clone().add(spawnOffset);
                        // Calculate base velocity (opposite to rocket direction, with some base speed)
                        var baseSpeed = 2.0; // Base speed of exhaust relative to rocket
                        var baseVelocity = new THREE.Vector3(Math.cos(rocketAngle + Math.PI) * baseSpeed, Math.sin(rocketAngle + Math.PI) * baseSpeed, 0);
                        // Spawn configuration
                        var spreadAngle = Math.PI / 6; // ~30 degrees spread
                        var speedVariation = 0.4; // +/- 20% speed variation
                        this.spawnParticle(spawnPosition, baseVelocity, spreadAngle, speedVariation);
                    }
                } else {
                    this.spawnTimer = 0; // Reset timer if not thrusting
                }
                // Update existing particles and remove dead ones
                for(var i = this.particles.length - 1; i >= 0; i--){
                    var particle = this.particles[i];
                    particle.update(delta);
                    if (!particle.isAlive) {
                        // remove from THREE group is handled within particle.update() now
                        this.particles.splice(i, 1);
                    }
                }
            }
        },
        {
            // Call this when the rocket/game is hidden or reset
            key: "clear",
            value: function clear() {
                for(var i = this.particles.length - 1; i >= 0; i--){
                    var particle = this.particles[i];
                    if (particle.mesh.parent) {
                        particle.mesh.parent.remove(particle.mesh);
                    }
                    particle.mesh.geometry.dispose();
                    particle.mesh.material.dispose();
                }
                this.particles = [];
                this.spawnTimer = 0;
            }
        }
    ]);
    return ExhaustSystem;
}();
