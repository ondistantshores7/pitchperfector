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
export var ImpactEffect = /*#__PURE__*/ function() {
    "use strict";
    function ImpactEffect(scene, position) {
        var isCorrect = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
        _class_call_check(this, ImpactEffect);
        this.scene = scene;
        this.position = position.clone();
        this.particles = [];
        this.lifetime = 0;
        this.maxLifetime = 1.0; // Extended duration for effect visibility
        // Enhanced color palette based on hit correctness
        var colors = isCorrect ? [
            0x00FF00,
            0x00FF88,
            0x88FF00,
            0xAAFFAA,
            0xFFFFFF
        ] : [
            0xFF0000,
            0xFF8800,
            0xFF00FF,
            0xFFAAAA,
            0xFFFFFF
        ]; // Red variants for incorrect
        // Create more particles for better visual effect
        var particleCount = isCorrect ? 40 : 30; // Significantly more particles 
        for(var i = 0; i < particleCount; i++){
            // Create angular brick-like particles with random sizes
            var width = THREE.MathUtils.randFloat(0.05, 0.2);
            var height = THREE.MathUtils.randFloat(0.05, 0.2);
            var depth = THREE.MathUtils.randFloat(0.02, 0.1);
            // Create more varied 3D geometries for particles
            var geometry = void 0;
            // Randomly select from different geometry types for visual variety
            var geometryType = Math.floor(Math.random() * 4);
            switch(geometryType){
                case 0:
                    // Standard box with beveled edges for better light interaction
                    geometry = new THREE.BoxGeometry(width, height, depth, 2, 2, 2);
                    break;
                case 1:
                    // Dodecahedron for angular but more complex shape
                    var radius = (width + height + depth) / 6;
                    geometry = new THREE.DodecahedronGeometry(radius, 0);
                    break;
                case 2:
                    // Octahedron for crystal-like shards
                    var octRadius = (width + height) / 4;
                    geometry = new THREE.OctahedronGeometry(octRadius, 0);
                    break;
                case 3:
                default:
                    // Tetrahedron for simplest shard-like shape
                    var tetraRadius = (width + height) / 3;
                    geometry = new THREE.TetrahedronGeometry(tetraRadius, 0);
            }
            // Use MeshStandardMaterial for proper lighting and reflections
            var material = new THREE.MeshStandardMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                transparent: true,
                opacity: 1.0,
                roughness: THREE.MathUtils.randFloat(0.3, 0.8),
                metalness: THREE.MathUtils.randFloat(0.1, 0.5),
                flatShading: true // Enable flat shading for more angular look
            });
            var particle = new THREE.Mesh(geometry, material);
            // Set initial position with slight random offset for better burst effect
            particle.position.copy(this.position).add(new THREE.Vector3(THREE.MathUtils.randFloatSpread(0.1), THREE.MathUtils.randFloatSpread(0.1), THREE.MathUtils.randFloatSpread(0.1)));
            // More dynamic initial rotation with intentional bias
            // This creates more visually interesting starting orientations
            particle.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
            // Add slight scale variation for each axis to make particles less uniform
            var scaleVariation = THREE.MathUtils.randFloat(0.8, 1.2);
            particle.scale.x *= scaleVariation;
            particle.scale.y *= THREE.MathUtils.randFloat(0.8, 1.2);
            particle.scale.z *= THREE.MathUtils.randFloat(0.8, 1.2);
            // Set random velocity in all directions
            var speed = THREE.MathUtils.randFloat(4, 12); // Increased speed range
            var angle = Math.random() * Math.PI * 2;
            var elevation = Math.random() * Math.PI - Math.PI / 2;
            var velocity = new THREE.Vector3(Math.cos(angle) * Math.cos(elevation) * speed, Math.sin(elevation) * speed, Math.sin(angle) * Math.cos(elevation) * speed);
            particle.userData.velocity = velocity;
            particle.userData.drag = THREE.MathUtils.randFloat(0.92, 0.98);
            // Enhanced rotation dynamics with acceleration
            particle.userData.rotationVelocity = new THREE.Vector3(THREE.MathUtils.randFloatSpread(5), THREE.MathUtils.randFloatSpread(5), THREE.MathUtils.randFloatSpread(5));
            // Add rotation acceleration for more dynamic motion
            particle.userData.rotationAcceleration = new THREE.Vector3(THREE.MathUtils.randFloatSpread(2), THREE.MathUtils.randFloatSpread(2), THREE.MathUtils.randFloatSpread(2));
            // Add random axis of rotation for more natural tumbling
            particle.userData.rotationAxis = new THREE.Vector3(THREE.MathUtils.randFloatSpread(1), THREE.MathUtils.randFloatSpread(1), THREE.MathUtils.randFloatSpread(1)).normalize();
            // Add to scene and tracking array
            this.scene.add(particle);
            this.particles.push(particle);
        }
        // Add a point light that matches the explosion color for dynamic lighting
        var lightColor = isCorrect ? 0x00FF00 : 0xFF0000;
        this.explosionLight = new THREE.PointLight(lightColor, 2, 10);
        this.explosionLight.position.copy(this.position);
        this.scene.add(this.explosionLight);
        // Add an enhanced flash effect with more detail
        var flashGeometry = new THREE.SphereGeometry(1, 16, 16);
        var flashMaterial = new THREE.MeshBasicMaterial({
            color: isCorrect ? 0x00FF00 : 0xFF0000,
            transparent: true,
            opacity: 0.7
        });
        this.flash = new THREE.Mesh(flashGeometry, flashMaterial);
        this.flash.position.copy(this.position);
        this.scene.add(this.flash);
    }
    _create_class(ImpactEffect, [
        {
            key: "update",
            value: function update(delta) {
                this.lifetime += delta;
                if (this.lifetime >= this.maxLifetime) {
                    this.destroy();
                    return false;
                }
                // Update explosion light intensity
                if (this.explosionLight) {
                    var lightProgress = this.lifetime / (this.maxLifetime * 0.4);
                    if (lightProgress < 1) {
                        this.explosionLight.intensity = 2 * (1 - lightProgress);
                    } else if (this.explosionLight.parent) {
                        this.scene.remove(this.explosionLight);
                        this.explosionLight = null;
                    }
                }
                // Flash effect (quickly grows then fades)
                if (this.flash) {
                    var flashProgress = this.lifetime / (this.maxLifetime * 0.3); // Faster flash relative to longer lifetime
                    if (flashProgress < 1) {
                        this.flash.scale.set(1 + flashProgress * 3, 1 + flashProgress * 3, 1 + flashProgress * 3);
                        this.flash.material.opacity = 0.7 * (1 - flashProgress);
                    } else if (this.flash.parent) {
                        this.scene.remove(this.flash);
                        this.flash.material.dispose();
                        this.flash.geometry.dispose();
                        this.flash = null;
                    }
                }
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    // Update particles
                    for(var _iterator = this.particles[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var particle = _step.value;
                        // Update velocity with drag
                        particle.userData.velocity.multiplyScalar(particle.userData.drag);
                        // Add slight gravity
                        particle.userData.velocity.y -= 5 * delta;
                        // Update position
                        particle.position.addScaledVector(particle.userData.velocity, delta);
                        // Apply enhanced rotation with acceleration and axis-based rotation
                        if (particle.userData.rotationVelocity && particle.userData.rotationAcceleration) {
                            // Apply rotation acceleration to velocity
                            particle.userData.rotationVelocity.x += particle.userData.rotationAcceleration.x * delta;
                            particle.userData.rotationVelocity.y += particle.userData.rotationAcceleration.y * delta;
                            particle.userData.rotationVelocity.z += particle.userData.rotationAcceleration.z * delta;
                            // Apply standard Euler rotation
                            particle.rotation.x += particle.userData.rotationVelocity.x * delta;
                            particle.rotation.y += particle.userData.rotationVelocity.y * delta;
                            particle.rotation.z += particle.userData.rotationVelocity.z * delta;
                            // Also apply axis rotation for more complex tumbling
                            if (particle.userData.rotationAxis) {
                                // Calculate rotation speed based on velocity magnitude
                                var speed = particle.userData.rotationVelocity.length() * 0.2;
                                particle.rotateOnAxis(particle.userData.rotationAxis, speed * delta);
                            }
                        }
                        // More gradual fade out with slight pulsing
                        var fadeProgress = this.lifetime / this.maxLifetime;
                        // Add slight oscillation to opacity for twinkling effect
                        var pulse = Math.sin(fadeProgress * Math.PI * 6) * 0.1;
                        particle.material.opacity = Math.max(0, 1 - fadeProgress + pulse);
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
                return true;
            }
        },
        {
            key: "destroy",
            value: function destroy() {
                // Clean up explosion light if it still exists
                if (this.explosionLight) {
                    this.scene.remove(this.explosionLight);
                    this.explosionLight = null;
                }
                // Clean up flash if it still exists
                if (this.flash) {
                    this.scene.remove(this.flash);
                    this.flash.material.dispose();
                    this.flash.geometry.dispose();
                    this.flash = null;
                }
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    // Clean up all particles
                    for(var _iterator = this.particles[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var particle = _step.value;
                        this.scene.remove(particle);
                        particle.geometry.dispose();
                        particle.material.dispose();
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
                this.particles = [];
            }
        }
    ]);
    return ImpactEffect;
}();
