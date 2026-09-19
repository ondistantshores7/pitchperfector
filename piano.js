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
import { NOTES } from './constants.js';
export var Piano = /*#__PURE__*/ function() {
    "use strict";
    function Piano(scene, audioManager) {
        _class_call_check(this, Piano);
        this.scene = scene;
        this.audioManager = audioManager;
        this.group = new THREE.Group();
        this.keys = {}; // Store references to key meshes { 'C3': mesh, 'C#3': mesh, ... }
        this.highlightingEnabled = true; // New flag to control key highlighting
        this.whiteKeyWidth = 0.5;
        this.whiteKeyHeight = 0.2;
        this.whiteKeyDepth = 2.0;
        this.blackKeyWidth = this.whiteKeyWidth * 0.6;
        this.blackKeyHeight = this.whiteKeyHeight * 1.1; // Slightly taller
        this.blackKeyDepth = this.whiteKeyDepth * 0.6;
        // Animation parameters
        this.pressDepth = this.whiteKeyHeight * 0.25; // How far down the key presses
        this.pressRotation = Math.PI / 60; // Slight tilt when pressed
        this.createKeyboard();
        this.group.position.y = -2.0; // Raised the piano position (less negative)
        this.group.rotation.x = -Math.PI / 12; // Slight tilt
        this.group.renderOrder = 1; // Ensure piano renders after stars (on top)
        this.scene.add(this.group);
        this.group.visible = false; // Hidden initially
    }
    _create_class(Piano, [
        {
            key: "createKeyboard",
            value: function createKeyboard() {
                var _this = this;
                // Create individual materials for each key instead of shared ones
                var whiteKeyColor = 0xffffff;
                var blackKeyColor = 0x333333;
                var keyOrder = this.getKeyOrder('C3', 'C5'); // C3 to C5 inclusive
                var whiteKeyIndex = 0;
                keyOrder.forEach(function(noteName) {
                    var isBlack = noteName.includes('#');
                    var noteFrequency = NOTES[noteName];
                    if (!noteFrequency) {
                        console.warn("Frequency not found for note: ".concat(noteName));
                        return; // Skip if note definition is missing
                    }
                    var keyMesh;
                    if (isBlack) {
                        var geometry = new THREE.BoxGeometry(_this.blackKeyWidth, _this.blackKeyHeight, _this.blackKeyDepth);
                        // Create a unique material instance for each black key
                        var material = new THREE.MeshStandardMaterial({
                            color: blackKeyColor,
                            roughness: 0.7,
                            metalness: 0.1
                        });
                        keyMesh = new THREE.Mesh(geometry, material);
                        // Position black key relative to the preceding white key
                        var offset = (whiteKeyIndex - 1) * _this.whiteKeyWidth + _this.whiteKeyWidth / 2;
                        keyMesh.position.set(offset, _this.whiteKeyHeight / 2, -(_this.whiteKeyDepth - _this.blackKeyDepth) / 2);
                        keyMesh.position.z += 0.01; // Slight offset forward
                        keyMesh.position.y += (_this.blackKeyHeight - _this.whiteKeyHeight) / 2; // Align tops slightly differently if needed
                    } else {
                        var geometry1 = new THREE.BoxGeometry(_this.whiteKeyWidth, _this.whiteKeyHeight, _this.whiteKeyDepth);
                        // Create a unique material instance for each white key
                        var material1 = new THREE.MeshStandardMaterial({
                            color: whiteKeyColor,
                            roughness: 0.7,
                            metalness: 0.1
                        });
                        keyMesh = new THREE.Mesh(geometry1, material1);
                        keyMesh.position.set(whiteKeyIndex * _this.whiteKeyWidth, 0, 0);
                        whiteKeyIndex++;
                        // Add subtle line between white keys (except the last one)
                        if (whiteKeyIndex > 1) {
                            var lineGeometry = new THREE.BoxGeometry(0.01, _this.whiteKeyHeight * 1.05, _this.whiteKeyDepth * 0.98); // Thin line
                            var lineMaterial = new THREE.MeshStandardMaterial({
                                color: 0x555555
                            }); // Dark grey line
                            var lineMesh = new THREE.Mesh(lineGeometry, lineMaterial);
                            // Position it at the boundary between the previous and current white key
                            lineMesh.position.set((whiteKeyIndex - 1) * _this.whiteKeyWidth - _this.whiteKeyWidth / 2, 0, 0.005); // Slightly forward
                            _this.group.add(lineMesh);
                        }
                    }
                    keyMesh.name = noteName; // Store the note name in the mesh
                    keyMesh.userData.originalColor = isBlack ? blackKeyColor : whiteKeyColor;
                    keyMesh.userData.noteFrequency = noteFrequency; // Store frequency for audio playback
                    keyMesh.userData.originalY = keyMesh.position.y; // Store original position for animation
                    keyMesh.userData.originalRotX = keyMesh.rotation.x; // Store original rotation for animation
                    keyMesh.userData.isPressed = false; // Track press state
                    _this.group.add(keyMesh);
                    _this.keys[noteName] = keyMesh;
                });
                // Center the keyboard group horizontally
                var totalWidth = whiteKeyIndex * this.whiteKeyWidth;
                this.group.position.x = -totalWidth / 2 + this.whiteKeyWidth / 2;
            }
        },
        {
            key: "getKeyOrder",
            value: function getKeyOrder(startNote, endNote) {
                var allNotes = Object.keys(NOTES);
                var startIndex = allNotes.indexOf(startNote);
                var endIndex = allNotes.indexOf(endNote);
                if (startIndex === -1 || endIndex === -1) {
                    console.error("Invalid start or end note for piano range");
                    return [];
                }
                return allNotes.slice(startIndex, endIndex + 1);
            }
        },
        {
            key: "show",
            value: function show() {
                this.group.visible = true;
            }
        },
        {
            key: "hide",
            value: function hide() {
                this.group.visible = false;
            }
        },
        {
            key: "getKeys",
            value: function getKeys() {
                // Return an array of the key meshes for raycasting
                return Object.values(this.keys);
            }
        },
        {
            // Method triggered when a key mesh is clicked (via raycasting in Game.js)
            key: "playKey",
            value: function playKey(keyMesh) {
                var durationMs = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 300;
                var noteName = keyMesh.name;
                var frequency = keyMesh.userData.noteFrequency;
                if (noteName && frequency) {
                    // Play the audio note immediately
                    this.audioManager.playNote(noteName, frequency, durationMs / 1000, 0); // Play immediately, duration affects envelope
                    // Only highlight the key visually if highlighting is enabled
                    if (this.highlightingEnabled) {
                        this.highlightKey(noteName, durationMs);
                    }
                // The playNote method in AudioManager already handles an envelope.
                // The call to adjustPianoEnvelope was redundant and incorrect.
                } else {
                    console.warn("Clicked object is not a valid key:", keyMesh);
                }
            }
        },
        {
            // Visual highlight effect
            key: "highlightKey",
            value: function highlightKey(noteName) {
                var duration = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 300;
                var keyMesh = this.keys[noteName];
                if (!keyMesh && noteName) {
                    var match = String(noteName).match(/^([A-G]#?)(\d+)$/);
                    if (match) {
                        keyMesh = this.keys[match[1] + (parseInt(match[2], 10) - 1)] || this.keys[match[1] + (parseInt(match[2], 10) + 1)];
                    }
                }
                if (keyMesh && !keyMesh.userData.isPressed) {
                    keyMesh.userData.isPressed = true; // Prevent re-triggering animation if already pressed
                    var originalColor = keyMesh.userData.originalColor;
                    var originalY = keyMesh.userData.originalY;
                    var originalRotX = keyMesh.userData.originalRotX;
                    // Highlight color
                    var highlightColor = 0x00FFFF; // Cyan
                    keyMesh.material.color.set(highlightColor);
                    keyMesh.material.emissive.set(highlightColor);
                    keyMesh.material.emissiveIntensity = 0.6;
                    // Press down animation
                    keyMesh.position.y = originalY - this.pressDepth;
                    keyMesh.rotation.x = originalRotX + this.pressRotation;
                    setTimeout(function() {
                        // Restore visual state
                        keyMesh.material.color.set(originalColor);
                        keyMesh.material.emissive.set(0x000000);
                        keyMesh.material.emissiveIntensity = 0;
                        keyMesh.position.y = originalY;
                        keyMesh.rotation.x = originalRotX;
                        keyMesh.userData.isPressed = false; // Release press state
                    }, duration); // Duration now passed in ms
                }
            }
        },
        {
            // New method to set highlighting state
            key: "setHighlighting",
            value: function setHighlighting(enabled) {
                this.highlightingEnabled = enabled;
            }
        }
    ]);
    return Piano;
}();
