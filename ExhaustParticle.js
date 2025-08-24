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
var PARTICLE_LIFETIME_MIN = 0.3; // Seconds
var PARTICLE_LIFETIME_MAX = 0.8;
var PARTICLE_SCALE_START = 0.15;
var PARTICLE_SCALE_END = 0.02;
var PARTICLE_OPACITY_START = 0.8;
var PARTICLE_OPACITY_END = 0;
var PARTICLE_COLORS = [
    0xFFFFFF,
    0xFF00FF,
    0x00FFFF
]; // White, Neon Pink, Neon Blue
export var ExhaustParticle = /*#__PURE__*/ function() {
    "use strict";
    function ExhaustParticle(position, velocity) {
        _class_call_check(this, ExhaustParticle);
        // Geometry and Material (simple sphere)
        var geometry = new THREE.SphereGeometry(1, 6, 6); // Slightly lower poly for performance maybe
        var chosenColor = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
        var material = new THREE.MeshBasicMaterial({
            color: chosenColor,
            transparent: true,
            opacity: PARTICLE_OPACITY_START,
            depthWrite: false
        });
        this.mesh = new THREE.Mesh(geometry, material);
        // Initial state
        this.mesh.position.copy(position);
        this.velocity = velocity.clone();
        this.lifetime = 0;
        this.maxLifetime = THREE.MathUtils.randFloat(PARTICLE_LIFETIME_MIN, PARTICLE_LIFETIME_MAX);
        this.currentScale = PARTICLE_SCALE_START;
        this.mesh.scale.set(this.currentScale, this.currentScale, this.currentScale);
        this.isAlive = true;
    }
    _create_class(ExhaustParticle, [
        {
            key: "update",
            value: function update(delta) {
                if (!this.isAlive) return;
                this.lifetime += delta;
                if (this.lifetime >= this.maxLifetime) {
                    this.isAlive = false;
                    // Optional: Pool objects instead of disposing/GC'ing
                    if (this.mesh.parent) {
                        this.mesh.parent.remove(this.mesh);
                    }
                    // Don't dispose geometry/material if pooling, just reset properties
                    // For now, we are disposing:
                    this.mesh.geometry.dispose();
                    this.mesh.material.dispose();
                    return;
                }
                // Update position
                this.mesh.position.addScaledVector(this.velocity, delta);
                // Update scale (shrink over time)
                var lifeRatio = this.lifetime / this.maxLifetime;
                this.currentScale = THREE.MathUtils.lerp(PARTICLE_SCALE_START, PARTICLE_SCALE_END, lifeRatio);
                this.mesh.scale.set(this.currentScale, this.currentScale, this.currentScale);
                // Update opacity (fade out over time)
                this.mesh.material.opacity = THREE.MathUtils.lerp(PARTICLE_OPACITY_START, PARTICLE_OPACITY_END, lifeRatio);
            // Optional: Add slight random drift or gravity effect here if desired
            // this.velocity.y -= 0.1 * delta; // Example gravity
            }
        }
    ]);
    return ExhaustParticle;
}();
