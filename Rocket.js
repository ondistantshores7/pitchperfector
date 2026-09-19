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
            key: "isDown",
            value: function isDown(keysPressed, keys) {
                if (!keysPressed) return false;
                return keys.some(function(key) {
                    return !!keysPressed[key];
                });
            }
        },
        {
            key: "turnLeft",
            value: function turnLeft(delta) {
                this.group.rotation.z += this.turnSpeed * delta;
            }
        },
        {
            key: "turnRight",
            value: function turnRight(delta) {
                this.group.rotation.z -= this.turnSpeed * delta;
            }
        },
        {
            key: "update",
            value: function update(delta, keysPressed) {
                if (!this.group.visible) return;
                keysPressed = keysPressed || {};
                if (this.isDown(keysPressed, [
                    'ArrowLeft',
                    'a',
                    'A',
                    'KeyA'
                ])) {
                    this.turnLeft(delta);
                }
                if (this.isDown(keysPressed, [
                    'ArrowRight',
                    'd',
                    'D',
                    'KeyD'
                ])) {
                    this.turnRight(delta);
                }
                var thrustAppliedThisFrame = this.isDown(keysPressed, [
                    'ArrowUp',
                    'w',
                    'W',
                    'KeyW'
                ]);
                if (thrustAppliedThisFrame) {
                    var angle = this.group.rotation.z + Math.PI / 2;
                    var direction = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
                    this.velocity.addScaledVector(direction, this.acceleration * delta);
                }
                this.isThrusting = thrustAppliedThisFrame;
                this.group.position.addScaledVector(this.velocity, delta);
                this.velocity.multiplyScalar(Math.pow(this.drag, delta * 60));
                var exhaustAngle = this.group.rotation.z + Math.PI / 2;
                this.exhaustSystem.update(delta, this.isThrusting, this.group.position, exhaustAngle);
                var bounds = {
                    x: 12,
                    y: 8
                };
                if (this.camera) {
                    var distance = Math.abs(this.group.position.z - this.camera.position.z);
                    var vFOV = THREE.MathUtils.degToRad(this.camera.fov);
                    var visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
                    var visibleWidth = visibleHeight * this.camera.aspect;
                    bounds = {
                        x: visibleWidth * 0.52,
                        y: visibleHeight * 0.48
                    };
                }
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
