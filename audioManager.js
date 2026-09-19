// Helper constants for note calculations
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
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
function _ts_generator(thisArg, body) {
    var f, y, t, g, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    };
    return g = {
        next: verb(0),
        "throw": verb(1),
        "return": verb(2)
    }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(_)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
var NOTE_NAMES_SHARP = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B"
];
var NOTE_SEMITONES_SHARP = NOTE_NAMES_SHARP.reduce(function(acc, name, i) {
    acc[name] = i;
    return acc;
}, {});
// Add common flat aliases, mapping to the same sharp semitone index
NOTE_SEMITONES_SHARP["Db"] = 1;
NOTE_SEMITONES_SHARP["Eb"] = 3;
NOTE_SEMITONES_SHARP["Gb"] = 6;
NOTE_SEMITONES_SHARP["Ab"] = 8;
NOTE_SEMITONES_SHARP["Bb"] = 10;
export var AudioManager = /*#__PURE__*/ function() {
    "use strict";
    function AudioManager(gameInstance) {
        _class_call_check(this, AudioManager);
        this.game = gameInstance; // Store game instance
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.isPlaying = false;
        this.playbackToken = 0;
        this.activeNotes = [];
        this.muted = false;
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.notesGain = this.audioContext.createGain();
        this.notesGain.gain.setValueAtTime(0.85, this.audioContext.currentTime);
        this.notesGain.connect(this.masterGain);
        this.sfxGain = this.audioContext.createGain();
        this.sfxGain.gain.setValueAtTime(0.9, this.audioContext.currentTime);
        this.sfxGain.connect(this.masterGain);
        this.gainNode = this.notesGain; // Back-compat alias for older callers
        this.backgroundMusicSource = null; // Reference to the background music node
        this.backgroundGainNode = this.audioContext.createGain(); // Separate gain for background music
        this.backgroundGainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime); // Lower volume for BGM
        // --- Lofi Effect ---
        this.backgroundLowPassFilter = this.audioContext.createBiquadFilter();
        this.backgroundLowPassFilter.type = 'lowpass';
        this.backgroundLowPassFilter.frequency.setValueAtTime(3000, this.audioContext.currentTime); // Cut frequencies above 3kHz
        this.backgroundLowPassFilter.Q.setValueAtTime(1, this.audioContext.currentTime); // Standard resonance
        // Connect Filter -> Gain -> Master
        this.backgroundLowPassFilter.connect(this.backgroundGainNode);
        this.backgroundGainNode.connect(this.masterGain);
        this.applyStoredMute();
    }
    _create_class(AudioManager, [
        {
            // Resume audio context on first user gesture (required by browsers)
            key: "resumeContext",
            value: function resumeContext() {
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            }
        },
        {
            key: "applyStoredMute",
            value: function applyStoredMute() {
                try {
                    this.setMuted(localStorage.getItem('pitchPerfector.muted') === '1', true);
                } catch (error) {
                    this.setMuted(false, true);
                }
            }
        },
        {
            key: "setMuted",
            value: function setMuted(muted) {
                var skipPersist = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
                this.muted = !!muted;
                if (this.masterGain) {
                    this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, this.audioContext.currentTime);
                }
                if (!skipPersist) {
                    try {
                        localStorage.setItem('pitchPerfector.muted', this.muted ? '1' : '0');
                    } catch (error) {
                    // Ignore quota / private-mode failures
                    }
                }
                return this.muted;
            }
        },
        {
            key: "toggleMute",
            value: function toggleMute() {
                return this.setMuted(!this.muted);
            }
        },
        {
            key: "stopPattern",
            value: function stopPattern() {
                var _this = this;
                this.playbackToken = (this.playbackToken || 0) + 1;
                this.isPlaying = false;
                var now = this.audioContext.currentTime;
                this.activeNotes.slice().forEach(function(voice) {
                    try {
                        voice.gain.gain.cancelScheduledValues(now);
                        voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), now);
                        voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
                        voice.oscillator.stop(now + 0.04);
                    } catch (error) {
                    // Already stopped
                    }
                });
                this.activeNotes = [];
                if (this._patternResetTimer) {
                    clearTimeout(this._patternResetTimer);
                    this._patternResetTimer = null;
                }
            }
        },
        {
            key: "playNote",
            value: function playNote(noteName, frequency) {
                var _this = this;
                var duration = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0.4, delay = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0, onPlayCallback = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : null;
                this.resumeContext(); // Ensure context is active
                if (!frequency) {
                    console.warn("Attempted to play note with invalid frequency:", frequency);
                    return;
                }
                // Trigger the callback if provided
                if (onPlayCallback) {
                    // Use a timeout to slightly delay the visual highlight to better sync with audio start
                    setTimeout(function() {
                        return onPlayCallback(noteName, duration * 1000);
                    }, delay * 1000); // Pass duration in ms
                }
                var oscillator = this.audioContext.createOscillator();
                var noteGain = this.audioContext.createGain();
                oscillator.type = 'sine'; // Simple tone
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime + delay);
                // Per-note envelope so overlapping piano / pattern notes don't cancel each other
                var attackTime = 0.02;
                var decayTime = duration * 0.8;
                var sustainLevel = 0.1; // Sustain at low volume
                var startAt = this.audioContext.currentTime + delay;
                noteGain.gain.setValueAtTime(0, startAt); // Start silent
                noteGain.gain.linearRampToValueAtTime(0.5, startAt + attackTime); // Attack
                noteGain.gain.linearRampToValueAtTime(sustainLevel, startAt + attackTime + decayTime); // Decay to sustain
                noteGain.gain.linearRampToValueAtTime(0, startAt + duration); // Release
                oscillator.connect(noteGain);
                noteGain.connect(this.notesGain);
                var voice = {
                    oscillator: oscillator,
                    gain: noteGain
                };
                this.activeNotes.push(voice);
                oscillator.onended = function() {
                    var index = _this.activeNotes.indexOf(voice);
                    if (index !== -1) _this.activeNotes.splice(index, 1);
                    try {
                        noteGain.disconnect();
                    } catch (error) {
                    }
                };
                oscillator.start(startAt);
                oscillator.stop(startAt + duration + 0.1); // Stop slightly after fade out
            }
        },
        {
            // Updated signature with defaults matching the new intended use
            key: "playPattern",
            value: function playPattern(patternData) {
                var _this = this;
                var onPlayCallback = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null, noteDuration = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0.8, gapDuration = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0.2, options = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : {};
                // patternData = [{ noteName: 'C4', frequency: 261.63 }, ...]
                this.resumeContext();
                if (!patternData || patternData.length === 0) {
                    return;
                }
                if (this.isPlaying && !options.force) {
                    return;
                }
                if (options.force) {
                    this.stopPattern();
                }
                this.isPlaying = true;
                this.playbackToken = (this.playbackToken || 0) + 1;
                var token = this.playbackToken;
                var currentTime = options.delay || 0;
                patternData.forEach(function(param) {
                    var noteName = param.noteName, frequency = param.frequency;
                    _this.playNote(noteName, frequency, noteDuration, currentTime, onPlayCallback);
                    currentTime += noteDuration + gapDuration;
                });
                if (this._patternResetTimer) {
                    clearTimeout(this._patternResetTimer);
                }
                // Set flag back to false after the last note finishes
                this._patternResetTimer = setTimeout(function() {
                    if (_this.playbackToken === token) {
                        _this.isPlaying = false;
                    }
                    _this._patternResetTimer = null;
                }, currentTime * 1000); // Convert seconds to milliseconds
            }
        },
        {
            key: "playPatternForTarget",
            value: function playPatternForTarget(solfegeText, isCorrect) {
                var onPlayCallback = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
                this.resumeContext();
                if (isCorrect) {
                    this.playCorrectSound();
                } else {
                    this.playIncorrectSound();
                }
                if (!this.game || !this.game.levelManager || !this.game.currentQuestion) {
                    return;
                }
                var tonicNote = this.game.currentQuestion.patternNames[0];
                if (!tonicNote || !solfegeText) {
                    return;
                }
                var patternData = this.solfegeStringToNoteData(solfegeText, tonicNote);
                if (!patternData || patternData.length === 0) {
                    return;
                }
                var highlightCallback = onPlayCallback;
                if (!highlightCallback && this.game.ui && this.game.ui.pianoHighlighting && this.game.piano) {
                    highlightCallback = this.game.piano.highlightKey.bind(this.game.piano);
                }
                this.playPattern(patternData, highlightCallback, isCorrect ? 0.45 : 0.35, 0.1, {
                    force: true,
                    delay: 0.22
                });
            }
        },
        {
            // Helper method to convert solfege string to note data (name and frequency)
            key: "solfegeStringToNoteData",
            value: function solfegeStringToNoteData(solfegeString, tonicNoteNameWithOctave) {
                var _this = this;
                if (!this.game || !this.game.levelManager || !this.game.levelManager.NOTES_MAP || !this.game.levelManager.solfegeIntervals) {
                    console.error("solfegeStringToNoteData: Missing critical levelManager properties (NOTES_MAP or solfegeIntervals).");
                    return [];
                }
                if (!tonicNoteNameWithOctave) {
                    console.error("solfegeStringToNoteData: tonicNoteNameWithOctave is undefined.");
                    return [];
                }
                // Add a guard for undefined or non-string solfegeString
                if (typeof solfegeString !== 'string') {
                    console.warn("solfegeStringToNoteData: solfegeString is not a string or is undefined. Received:", solfegeString);
                    return [];
                }
                var solfegeSteps = solfegeString.split(/,\s*|\s+/); // Split by comma and/or space
                var tonicOctaveNum = parseInt(tonicNoteNameWithOctave.match(/\d+$/)[0]);
                var tonicBaseName = tonicNoteNameWithOctave.replace(/\d+$/, '');
                var tonicSemitoneVal = NOTE_SEMITONES_SHARP[tonicBaseName];
                if (tonicSemitoneVal === undefined) {
                    console.error("solfegeStringToNoteData: Unknown tonic base name: ".concat(tonicBaseName, " from ").concat(tonicNoteNameWithOctave));
                    return [];
                }
                var noteDataArray = [];
                solfegeSteps.forEach(function(solfegeStep) {
                    var interval = _this.game.levelManager.solfegeIntervals[solfegeStep];
                    if (interval === undefined) {
                        console.warn("solfegeStringToNoteData: Unknown solfege syllable: ".concat(solfegeStep));
                        return; // Skip this syllable
                    }
                    var targetRelativeSemitone = tonicSemitoneVal + interval;
                    var currentOctave = tonicOctaveNum;
                    var finalSemitoneInOctave = targetRelativeSemitone;
                    // Adjust octave and semitoneInOctave based on the calculated relative semitone
                    while(finalSemitoneInOctave >= 12){
                        finalSemitoneInOctave -= 12;
                        currentOctave++;
                    }
                    while(finalSemitoneInOctave < 0){
                        finalSemitoneInOctave += 12;
                        currentOctave--;
                    }
                    var noteBaseName = NOTE_NAMES_SHARP[finalSemitoneInOctave];
                    if (!noteBaseName) {
                        console.warn("solfegeStringToNoteData: Could not determine base name for semitone index: ".concat(finalSemitoneInOctave, " (from solfege ").concat(solfegeStep, ", tonic ").concat(tonicNoteNameWithOctave, ")"));
                        return; // Skip this syllable
                    }
                    var noteFullName = "".concat(noteBaseName).concat(currentOctave);
                    var frequency = _this.game.levelManager.NOTES_MAP[noteFullName];
                    if (noteFullName && typeof frequency === 'number') {
                        noteDataArray.push({
                            noteName: noteFullName,
                            frequency: frequency
                        });
                    } else {
                        console.warn("solfegeStringToNoteData: Could not find valid frequency for note: ".concat(noteFullName, " (Solfege: ").concat(solfegeStep, ", Tonic: ").concat(tonicNoteNameWithOctave, ", Derived Freq: ").concat(frequency, ")"));
                        if (!_this.game.levelManager.NOTES_MAP.hasOwnProperty(noteFullName)) {
                            console.warn("...Note ".concat(noteFullName, " does not exist in NOTES_MAP."));
                        } else if (typeof frequency !== 'number') {
                            console.warn("...Frequency for ".concat(noteFullName, " in NOTES_MAP is not a number: ").concat(frequency));
                        }
                    }
                });
                return noteDataArray;
            }
        },
        {
            // --- UI Sound Effects ---
            key: "playClickSound",
            value: function playClickSound() {
                this.resumeContext();
                var osc = this.audioContext.createOscillator();
                var gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.sfxGain); // Route UI clicks through the master mute chain
                osc.type = 'triangle'; // A softer click sound
                osc.frequency.setValueAtTime(880, this.audioContext.currentTime); // A high quick pitch (A5)
                gain.gain.setValueAtTime(0.15, this.audioContext.currentTime); // Lower volume for click
                gain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.1); // Quick fade out
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.1);
            }
        },
        {
            key: "playCorrectSound",
            value: function playCorrectSound() {
                this.resumeContext();
                var osc = this.audioContext.createOscillator();
                var gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.type = 'sine';
                // Ascending tones (e.g., C5 -> G5)
                osc.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
                osc.frequency.linearRampToValueAtTime(783.99, this.audioContext.currentTime + 0.15); // G5
                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime); // Moderate volume
                gain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.25); // Fade out
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.25);
            }
        },
        {
            key: "playIncorrectSound",
            value: function playIncorrectSound() {
                this.resumeContext();
                var osc = this.audioContext.createOscillator();
                var gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.type = 'square'; // Slightly harsher sound
                // Descending tones (e.g., G3 -> C3)
                osc.frequency.setValueAtTime(196.00, this.audioContext.currentTime); // G3
                osc.frequency.linearRampToValueAtTime(130.81, this.audioContext.currentTime + 0.2); // C3
                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 0.3); // Slower fade
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.3);
            }
        },
        {
            // --- New Shooting Sound ---
            key: "playShootSound",
            value: function playShootSound() {
                this.resumeContext();
                var osc = this.audioContext.createOscillator();
                var gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.type = 'triangle'; // A simple, clean wave for a laser sound
                // Quick pitch drop for "pew" effect
                var startTime = this.audioContext.currentTime;
                osc.frequency.setValueAtTime(1200, startTime); // High start pitch
                osc.frequency.exponentialRampToValueAtTime(300, startTime + 0.1); // Drop quickly
                // Volume envelope
                gain.gain.setValueAtTime(0.2, startTime); // Start volume
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15); // Quick decay
                osc.start(startTime);
                osc.stop(startTime + 0.15);
            }
        },
        {
            key: "loadBackgroundMusic",
            value: // --- Background Music ---
            function loadBackgroundMusic(url) {
                var _this = this;
                return _async_to_generator(function() {
                    var response, arrayBuffer, audioBuffer, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                _this.resumeContext(); // Attempt resume early
                                if (_this.backgroundMusicSource) {
                                    _this.stopBackgroundMusic(); // Stop existing music if any
                                }
                                _state.label = 1;
                            case 1:
                                _state.trys.push([
                                    1,
                                    5,
                                    ,
                                    6
                                ]);
                                return [
                                    4,
                                    fetch(url)
                                ];
                            case 2:
                                response = _state.sent();
                                return [
                                    4,
                                    response.arrayBuffer()
                                ];
                            case 3:
                                arrayBuffer = _state.sent();
                                return [
                                    4,
                                    _this.audioContext.decodeAudioData(arrayBuffer)
                                ];
                            case 4:
                                audioBuffer = _state.sent();
                                _this.backgroundMusicSource = _this.audioContext.createBufferSource();
                                _this.backgroundMusicSource.buffer = audioBuffer;
                                _this.backgroundMusicSource.loop = true;
                                // Connect Source -> Filter (instead of directly to Gain)
                                _this.backgroundMusicSource.connect(_this.backgroundLowPassFilter);
                                _this.backgroundMusicSource.start();
                                console.log("Background music started.");
                                return [
                                    3,
                                    6
                                ];
                            case 5:
                                error = _state.sent();
                                console.error("Error loading or playing background music:", error);
                                return [
                                    3,
                                    6
                                ];
                            case 6:
                                return [
                                    2
                                ];
                        }
                    });
                })();
            }
        },
        {
            key: "stopBackgroundMusic",
            value: function stopBackgroundMusic() {
                if (this.backgroundMusicSource) {
                    try {
                        this.backgroundMusicSource.stop();
                        this.backgroundMusicSource.disconnect(); // Disconnect node
                        this.backgroundMusicSource = null;
                        console.log("Background music stopped.");
                    } catch (error) {
                        // Ignore errors if the node was already stopped or disconnected
                        if (error.name !== 'InvalidStateError') {
                            console.error("Error stopping background music:", error);
                        }
                    }
                }
            }
        }
    ]);
    return AudioManager;
}();
