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
var ASTEROID_COLOR = 0x00FFFF; // Neon Blue
var ASTEROID_SIZE_MIN = 0.15;
var ASTEROID_SIZE_MAX = 0.4;
var ASTEROID_SPEED_MIN = 0.2;
var ASTEROID_SPEED_MAX = 0.8;
export var Asteroid = /*#__PURE__*/ function() {
    "use strict";
    function Asteroid(scene, camera) {
        var position = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : new THREE.Vector3(0, 0, -15);
        _class_call_check(this, Asteroid);
        this.scene = scene;
        this.camera = camera; // Needed for boundary checks
        this.isHit = false;
        // Geometry and Material
        var size = THREE.MathUtils.randFloat(ASTEROID_SIZE_MIN, ASTEROID_SIZE_MAX);
        // Use Icosahedron for a more jagged look than a sphere
        var geometry = new THREE.IcosahedronGeometry(size, 0); // Low detail for chunky look
        var material = new THREE.MeshStandardMaterial({
            color: ASTEROID_COLOR,
            emissive: ASTEROID_COLOR,
            emissiveIntensity: 0.3,
            roughness: 0.6,
            metalness: 0.2
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.userData.asteroid = this; // Link back to the class instance
        // Random initial velocity
        var speed = THREE.MathUtils.randFloat(ASTEROID_SPEED_MIN, ASTEROID_SPEED_MAX);
        this.velocity = new THREE.Vector3(THREE.MathUtils.randFloatSpread(1), THREE.MathUtils.randFloatSpread(1), 0 // Keep movement on the Z plane
        ).normalize().multiplyScalar(speed);
        this.boundingBox = new THREE.Box3();
        this.computeBoundingBox(); // Compute initial box
        this.scene.add(this.mesh);
    }
    _create_class(Asteroid, [
        {
            key: "computeBoundingBox",
            value: function computeBoundingBox() {
                if (!this.mesh) return;
                // Ensure matrix is up to date
                this.mesh.updateMatrixWorld(true);
                // Compute bounding box based on geometry, add slight padding
                var geometryRadius = this.mesh.geometry.parameters.radius || ASTEROID_SIZE_MAX; // Estimate radius
                var padding = 0.1; // Small padding
                var size = geometryRadius + padding;
                // Note: This simple box doesn't account for rotation, but asteroids aren't rotating much yet
                this.boundingBox.set(new THREE.Vector3(this.mesh.position.x - size, this.mesh.position.y - size, this.mesh.position.z - size), new THREE.Vector3(this.mesh.position.x + size, this.mesh.position.y + size, this.mesh.position.z + size));
            }
        },
        {
            key: "update",
            value: function update(delta) {
                if (!this.mesh || this.isHit) return;
                // Apply velocity
                this.mesh.position.addScaledVector(this.velocity, delta);
                // Boundary Check (Wrap around screen)
                var targetZ = this.mesh.position.z;
                var vFOV = THREE.MathUtils.degToRad(this.camera.fov);
                var visibleHeight = 2 * Math.tan(vFOV / 2) * Math.abs(targetZ);
                var visibleWidth = visibleHeight * this.camera.aspect;
                var boundaryX = visibleWidth / 2 + (this.mesh.geometry.parameters.radius || ASTEROID_SIZE_MAX); // Add radius to wrap fully off-screen
                var boundaryY = visibleHeight / 2 + (this.mesh.geometry.parameters.radius || ASTEROID_SIZE_MAX);
                if (this.mesh.position.x > boundaryX) this.mesh.position.x = -boundaryX;
                if (this.mesh.position.x < -boundaryX) this.mesh.position.x = boundaryX;
                if (this.mesh.position.y > boundaryY) this.mesh.position.y = -boundaryY;
                if (this.mesh.position.y < -boundaryY) this.mesh.position.y = boundaryY;
                // Keep asteroid on the Z plane
                this.mesh.position.z = -15;
                // Update bounding box after moving
                this.computeBoundingBox();
            }
        },
        {
            key: "hit",
            value: function hit() {
                var _this = this;
                if (this.isHit) return; // Can only be hit once
                this.isHit = true;
                console.log("Asteroid hit!");
                // TODO: Trigger explosion effect here
                // Schedule removal shortly after hit
                setTimeout(function() {
                    return _this.removeFromScene();
                }, 100); // Quick removal for now
            }
        },
        {
            key: "removeFromScene",
            value: function removeFromScene() {
                if (this.scene && this.mesh) {
                    this.scene.remove(this.mesh);
                }
                if (this.mesh) {
                    if (this.mesh.geometry) this.mesh.geometry.dispose();
                    if (this.mesh.material) this.mesh.material.dispose();
                }
                // Nullify references
                this.scene = null;
                this.camera = null;
                this.mesh = null;
            }
        }
    ]);
    return Asteroid;
}();
