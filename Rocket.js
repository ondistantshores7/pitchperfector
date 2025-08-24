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
import { ExhaustSystem } from './ExhaustSystem.js';
var ROCKET_ASSET_URL = "https://play.rosebud.ai/assets/Rocket.png?Zlrh";
var ROCKET_SCALE = 1.5;
export var Rocket = /*#__PURE__*/ function() {
    "use strict";
    function Rocket(scene) {
        _class_call_check(this, Rocket);
        this.scene = scene;
        this.group = new THREE.Group();
        var textureLoader = new THREE.TextureLoader();
        var rocketTexture = textureLoader.load(ROCKET_ASSET_URL);
        rocketTexture.colorSpace = THREE.SRGBColorSpace;
        var rocketGeometry = new THREE.PlaneGeometry(1, 1);
        var rocketMaterial = new THREE.MeshBasicMaterial({
            map: rocketTexture,
            transparent: true,
            side: THREE.DoubleSide
        });
        this.rocketMesh = new THREE.Mesh(rocketGeometry, rocketMaterial);
        this.rocketMesh.scale.set(ROCKET_SCALE, ROCKET_SCALE, ROCKET_SCALE);
        this.group.add(this.rocketMesh);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = 6;
        this.turnSpeed = Math.PI * 1.5;
        this.drag = 0.97;
        this.isThrusting = false;
        this.group.position.set(0, 0, -20);
        this.group.renderOrder = -5;
        this.scene.add(this.group);
        this.group.visible = false;
        this.exhaustSystem = new ExhaustSystem(scene);
        this.rocketLength = 1.0;
        // Adjustable tip position (in local coordinates, before scaling)
        this.tipLocalX = 0; // Base x-offset; works at center, may need slight tweak
        this.tipLocalY = 0.5; // Base y-offset; top of texture, adjust if needed
        this.xOffsetCorrectionFactor = -0.05; // Adjust this (e.g., 0.01 to 0.1) to correct x-offset based on rocket position
    }
    _create_class(Rocket, [
        {
            key: "show",
            value: function show() {
                this.group.visible = true;
                this.group.position.set(0, -3, -20);
                this.velocity.set(0, 0, 0);
                this.group.rotation.z = 0;
            }
        },
        {
            key: "hide",
            value: function hide() {
                this.group.visible = false;
                this.isThrusting = false;
                this.exhaustSystem.clear();
            }
        },
        {
            key: "thrust",
            value: function thrust(delta) {
                var angle = this.group.rotation.z + Math.PI / 2;
                var direction = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
                this.velocity.addScaledVector(direction, this.acceleration * delta);
                this.isThrusting = true;
            }
        },
        {
            key: "turnLeft",
            value: function turnLeft(delta) {
                this.group.rotation.z += this.turnSpeed * delta;
                console.log("Turn Left - New Rotation Z:", this.group.rotation.z);
            }
        },
        {
            key: "turnRight",
            value: function turnRight(delta) {
                this.group.rotation.z -= this.turnSpeed * delta;
                console.log("Turn Right - New Rotation Z:", this.group.rotation.z);
            }
        },
        {
            key: "update",
            value: function update(delta, keysPressed) {
                if (!this.group.visible) return;
                var thrustAppliedThisFrame = false;
                if (keysPressed['ArrowUp']) {
                    thrustAppliedThisFrame = true;
                    var angle = this.group.rotation.z + Math.PI / 2;
                    var direction = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
                    this.velocity.addScaledVector(direction, this.acceleration * delta);
                }
                this.isThrusting = thrustAppliedThisFrame;
                this.group.position.addScaledVector(this.velocity, delta);
                this.velocity.multiplyScalar(Math.pow(this.drag, delta * 60));
                if (Math.random() < 0.05) {
                    console.log("Group Rotation Z:", this.group.rotation.z);
                }
                var exhaustAngle = this.group.rotation.z + Math.PI / 2;
                this.exhaustSystem.update(delta, this.isThrusting, this.group.position, exhaustAngle);
                var aspect = window.innerWidth / window.innerHeight;
                var worldHeight = (this.camera ? this.camera.getFilmHeight() : 10) * 0.5;
                var worldWidth = worldHeight * aspect;
                var bounds = {
                    x: worldWidth * 2.5,
                    y: worldHeight * 1.5
                };
                if (this.group.position.x > bounds.x) this.group.position.x = -bounds.x;
                if (this.group.position.x < -bounds.x) this.group.position.x = bounds.x;
                if (this.group.position.y > bounds.y) this.group.position.y = -bounds.y;
                if (this.group.position.y < -bounds.y) this.group.position.y = bounds.y;
                this.group.position.z = -20;
            }
        },
        {
            key: "getTipPosition",
            value: function getTipPosition() {
                this.group.updateMatrixWorld(true);
                // Use base tipLocalX and tipLocalY
                var localTipOffset = new THREE.Vector3(this.tipLocalX, this.tipLocalY, 0);
                var worldTipOffset = localTipOffset.applyQuaternion(this.group.getWorldQuaternion(new THREE.Quaternion()));
                var tipWorldPos = this.group.getWorldPosition(new THREE.Vector3()).add(worldTipOffset);
                var planeZ = -15;
                var scaleFactor = planeZ / tipWorldPos.z; // -15 / -20 = 0.75
                var projectedPos = new THREE.Vector3(tipWorldPos.x * scaleFactor, tipWorldPos.y * scaleFactor, planeZ);
                // Apply dynamic x-offset correction based on rocket's x-position
                var xCorrection = -this.xOffsetCorrectionFactor * this.group.position.x;
                projectedPos.x += xCorrection;
                // Debug logging to monitor the correction
                if (Math.random() < 0.05) {
                    var groupPos = this.group.position;
                    var groupRotZ = this.group.rotation.z;
                    console.log("-- getTipPosition (Projected with X Correction) --");
                    console.log("Group Pos: (".concat(groupPos.x.toFixed(3), ", ").concat(groupPos.y.toFixed(3), ", ").concat(groupPos.z.toFixed(3), ")"));
                    console.log("Group Rot Z: ".concat(groupRotZ.toFixed(3)));
                    console.log("Local Tip Offset: (".concat(localTipOffset.x.toFixed(3), ", ").concat(localTipOffset.y.toFixed(3), ", ").concat(localTipOffset.z.toFixed(3), ")"));
                    console.log("World Tip Offset: (".concat(worldTipOffset.x.toFixed(3), ", ").concat(worldTipOffset.y.toFixed(3), ", ").concat(worldTipOffset.z.toFixed(3), ")"));
                    console.log("Actual Tip World Pos: (".concat(tipWorldPos.x.toFixed(3), ", ").concat(tipWorldPos.y.toFixed(3), ", ").concat(tipWorldPos.z.toFixed(3), ")"));
                    console.log("Scale Factor: ".concat(scaleFactor.toFixed(3)));
                    console.log("X Correction: ".concat(xCorrection.toFixed(3), " (Factor: ").concat(this.xOffsetCorrectionFactor, ")"));
                    console.log("Projected Start Pos: (".concat(projectedPos.x.toFixed(3), ", ").concat(projectedPos.y.toFixed(3), ", ").concat(projectedPos.z.toFixed(3), ")"));
                    console.log("--------------------");
                }
                return projectedPos;
            }
        },
        {
            key: "setCameraReference",
            value: function setCameraReference(camera) {
                this.camera = camera;
            }
        }
    ]);
    return Rocket;
}();
