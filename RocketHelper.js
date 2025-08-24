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
// Default rocket scale if not available from mesh
var ROCKET_SCALE = 1.5;
export var RocketHelper = /*#__PURE__*/ function() {
    "use strict";
    function RocketHelper() {
        _class_call_check(this, RocketHelper);
    }
    _create_class(RocketHelper, null, [
        {
            key: "calculateTipPosition",
            value: /**
   * Calculates the position of the rocket's tip based on the rocket's position and rotation
   * @param {THREE.Object3D} rocket - The rocket object
   * @param {number} rocketLength - The length of the rocket from center to tip
   * @returns {THREE.Vector3} The position of the rocket's tip in world space
   */ function calculateTipPosition(rocket) {
                var rocketLength = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0.8;
                if (!rocket) {
                    console.warn('Rocket object is undefined');
                    return new THREE.Vector3();
                }
                // Find the rocket mesh within the group for proper scaling
                var rocketMesh = null;
                if (rocket.children && rocket.children.length > 0) {
                    rocketMesh = rocket.children[0]; // Typically the first child is the rocket mesh
                }
                // Get the rocket's current angle from its rotation
                // Rocket's forward direction is determined by its rotation.z
                var rotationAngle = rocket.rotation.z;
                // Calculate the proper rocket length based on scale
                // If we have a mesh, use its scale, otherwise use a default multiplier
                var scaleFactor = rocketMesh ? rocketMesh.scale.y : ROCKET_SCALE || 1.5;
                var adjustedLength = rocketLength * scaleFactor;
                // Calculate direction vector based on the rocket's current rotation
                // The rotationAngle already has the PI/2 adjustment applied in Rocket.js
                // so we don't need to add it again here
                var direction = new THREE.Vector3(Math.cos(rotationAngle), Math.sin(rotationAngle), 0).normalize().multiplyScalar(adjustedLength);
                // Calculate the tip position by adding the direction vector to the rocket's position
                var tipPosition = rocket.position.clone().add(direction);
                // Keep the tip at the same z position as the rocket
                tipPosition.z = rocket.position.z;
                // Optional debugging
                if (rocket.userData && rocket.userData.debug) {
                    console.log("Rocket rotation:", rotationAngle);
                    console.log("Rotation with PI/2 offset:", rotationAngle + Math.PI / 2);
                    console.log("Adjusted length:", adjustedLength);
                    console.log("Direction vector:", direction);
                    console.log("Calculated tip position:", tipPosition);
                }
                return tipPosition;
            }
        }
    ]);
    return RocketHelper;
}();
