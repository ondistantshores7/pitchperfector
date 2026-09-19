function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes(arr) {
    if (Array.isArray(arr)) return arr;
}
function _array_without_holes(arr) {
    if (Array.isArray(arr)) return _array_like_to_array(arr);
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
function _iterable_to_array(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _iterable_to_array_limit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
        for(_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true){
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
        }
    } catch (err) {
        _d = true;
        _e = err;
    } finally{
        try {
            if (!_n && _i["return"] != null) _i["return"]();
        } finally{
            if (_d) throw _e;
        }
    }
    return _arr;
}
function _non_iterable_rest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _non_iterable_spread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _sliced_to_array(arr, i) {
    return _array_with_holes(arr) || _iterable_to_array_limit(arr, i) || _unsupported_iterable_to_array(arr, i) || _non_iterable_rest();
}
function _to_consumable_array(arr) {
    return _array_without_holes(arr) || _iterable_to_array(arr) || _unsupported_iterable_to_array(arr) || _non_iterable_spread();
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
}
import * as THREE from 'three';
import { NOTES, SOLFEGE_MAP } from './constants.js';
import { resolveRelativeNote } from './scoreUtils.js';
// Helper set for chromatic intervals (semitones relative to tonic or previous note)
var chromaticIntervals = new Set([
    1,
    3,
    6,
    8,
    10
]); // Intervals representing chromatic steps relative to the previous note
// Helper set for diatonic scale intervals (semitones relative to tonic or previous note)
var diatonicIntervals = new Set([
    0,
    2,
    4,
    5,
    7,
    9,
    11
]); // Do, Re, Mi, Fa, So, La, Ti
export var LevelManager = /*#__PURE__*/ function() {
    "use strict";
    function LevelManager() {
        _class_call_check(this, LevelManager);
        this.levels = this.defineLevels();
        this.noteNames = Object.keys(NOTES); // C3, C#3, D3...
        this.baseNote = 'C4'; // Middle C as a common reference
        // Expose NOTES directly for AudioManager and other components if needed
        this.NOTES_MAP = NOTES;
        // Create a reverse map from Solfege name to interval (e.g., "Do": 0, "Re": 2)
        // This is needed by AudioManager to convert target solfege strings to notes.
        this.solfegeIntervals = Object.entries(SOLFEGE_MAP).reduce(function(acc, param) {
            var _param = _sliced_to_array(param, 2), interval = _param[0], name = _param[1];
            acc[name] = parseInt(interval, 10);
            return acc;
        }, {});
    }
    _create_class(LevelManager, [
        {
            key: "defineLevels",
            value: function defineLevels() {
                // Define difficulty parameters for each level
                // Intervals: Max jump size allowed (in semitones)
                // Range: Max distance from base note (in semitones)
                // Points: Scoring for correct/incorrect
                // Threshold: Score needed to advance
                var levels = {};
                for(var i = 1; i <= 10; i++){
                    levels[i] = {
                        maxInterval: 2 + Math.floor(i * 1.2),
                        maxRange: 5 + i * 2,
                        minJump: 0,
                        pointsCorrect: 90 + i * 10,
                        pointsIncorrect: -(45 + i * 5),
                        levelUpThreshold: 500 + i * 500,
                        questionsPerLevel: 10
                    };
                }
                // Adjust level 10 scoring specifically based on prompt
                levels[10].pointsCorrect = 200;
                levels[10].pointsIncorrect = -100;
                return levels;
            }
        },
        {
            key: "getScoring",
            value: function getScoring(level) {
                var config = this.levels[level] || this.levels[1];
                return {
                    pointsCorrect: config.pointsCorrect,
                    pointsIncorrect: config.pointsIncorrect
                };
            }
        },
        {
            key: "getLevelUpThreshold",
            value: function getLevelUpThreshold(level) {
                var _this_levels_level;
                // Threshold to reach *before* starting the next level
                return ((_this_levels_level = this.levels[level]) === null || _this_levels_level === void 0 ? void 0 : _this_levels_level.levelUpThreshold) || Infinity;
            }
        },
        {
            key: "getQuestionsPerLevel",
            value: function getQuestionsPerLevel() {
                // For now, constant across levels, but could vary
                return this.levels[1].questionsPerLevel;
            }
        },
        {
            key: "generateQuestion",
            value: function generateQuestion(level) {
                var config = this.levels[level] || this.levels[10]; // Default to hardest if level out of bounds
                var pattern = this.generatePitchPattern(level, config);
                if (!pattern) return null; // Could happen if generation fails
                var correctAnswer = this.patternToSolfegeString(pattern);
                var options = this.generateOptions(pattern, correctAnswer, level, config);
                // Return both note names and frequencies for the pattern
                return {
                    patternNames: pattern,
                    patternFrequencies: pattern.map(function(noteName) {
                        return NOTES[noteName];
                    }),
                    options: this.shuffleArray(options),
                    correctAnswer: correctAnswer
                };
            }
        },
        {
            key: "generatePitchPattern",
            value: function generatePitchPattern(level, config) {
                var _this = this;
                var length = 3; // Fixed pattern length
                // --- Level 2 Specific Pattern Generation ---
                if (level === 2) {
                    var allowedPatternsL2 = [
                        [
                            0,
                            2,
                            4
                        ],
                        [
                            0,
                            4,
                            4
                        ],
                        [
                            0,
                            4,
                            2
                        ],
                        [
                            0,
                            0,
                            4
                        ],
                        [
                            0,
                            2,
                            2
                        ],
                        [
                            0,
                            4,
                            0
                        ] // Do-Mi-Do
                    ];
                    var tonicIndex = this.noteNames.indexOf(this.baseNote); // Start on C4
                    if (tonicIndex === -1) {
                        console.error("Base note C4 not found in NOTES");
                        return null;
                    }
                    // Select one of the allowed interval patterns randomly
                    var intervalPattern = allowedPatternsL2[THREE.MathUtils.randInt(0, allowedPatternsL2.length - 1)];
                    var noteIndices = intervalPattern.map(function(interval) {
                        return tonicIndex + interval;
                    });
                    // Validate indices are within bounds
                    if (noteIndices.some(function(index) {
                        return index < 0 || index >= _this.noteNames.length;
                    })) {
                        console.warn("Generated Level 2 pattern indices out of bounds: ".concat(noteIndices, ". Tonic: ").concat(this.noteNames[tonicIndex]));
                        // Could retry with a different tonic or pattern, but return null for now
                        return null;
                    }
                    var generatedPattern = noteIndices.map(function(index) {
                        return _this.noteNames[index];
                    });
                    console.log("Generated Level 2 pattern: ".concat(generatedPattern.join(', ')));
                    return generatedPattern; // Return the specific pattern for level 2
                } else if (level === 3) {
                    var allowedPatternsL3 = [
                        // From Level 2
                        [
                            0,
                            2,
                            4
                        ],
                        [
                            0,
                            4,
                            4
                        ],
                        [
                            0,
                            4,
                            2
                        ],
                        [
                            0,
                            0,
                            4
                        ],
                        [
                            0,
                            2,
                            2
                        ],
                        [
                            0,
                            4,
                            0
                        ],
                        // New for Level 3
                        [
                            0,
                            4,
                            7
                        ] // Do-Mi-Sol
                    ];
                    var tonicIndex1 = this.noteNames.indexOf(this.baseNote); // Start on C4
                    if (tonicIndex1 === -1) {
                        console.error("Base note C4 not found in NOTES");
                        return null;
                    }
                    // Select one of the allowed interval patterns randomly
                    var intervalPattern1 = allowedPatternsL3[THREE.MathUtils.randInt(0, allowedPatternsL3.length - 1)];
                    var noteIndices1 = intervalPattern1.map(function(interval) {
                        return tonicIndex1 + interval;
                    });
                    // Validate indices are within bounds
                    if (noteIndices1.some(function(index) {
                        return index < 0 || index >= _this.noteNames.length;
                    })) {
                        console.warn("Generated Level 3 pattern indices out of bounds: ".concat(noteIndices1, ". Tonic: ").concat(this.noteNames[tonicIndex1]));
                        return null;
                    }
                    var generatedPattern1 = noteIndices1.map(function(index) {
                        return _this.noteNames[index];
                    });
                    console.log("Generated Level 3 pattern: ".concat(generatedPattern1.join(', ')));
                    return generatedPattern1; // Return the specific pattern for level 3
                } else if (level === 4) {
                    var allowedPatternsL4 = [
                        [
                            0,
                            2,
                            4
                        ],
                        [
                            0,
                            4,
                            4
                        ],
                        [
                            0,
                            4,
                            2
                        ],
                        [
                            0,
                            4,
                            0
                        ],
                        [
                            0,
                            7,
                            0
                        ],
                        [
                            0,
                            7,
                            7
                        ],
                        [
                            0,
                            7,
                            4
                        ],
                        [
                            0,
                            0,
                            7
                        ] // Do-Do-Sol
                    ];
                    var tonicIndex2 = this.noteNames.indexOf(this.baseNote); // Start on C4
                    if (tonicIndex2 === -1) {
                        console.error("Base note C4 not found in NOTES");
                        return null;
                    }
                    var intervalPattern2 = allowedPatternsL4[THREE.MathUtils.randInt(0, allowedPatternsL4.length - 1)];
                    var noteIndices2 = intervalPattern2.map(function(interval) {
                        return tonicIndex2 + interval;
                    });
                    if (noteIndices2.some(function(index) {
                        return index < 0 || index >= _this.noteNames.length;
                    })) {
                        console.warn("Generated Level 4 pattern indices out of bounds: ".concat(noteIndices2, ". Tonic: ").concat(this.noteNames[tonicIndex2]));
                        return null;
                    }
                    var generatedPattern2 = noteIndices2.map(function(index) {
                        return _this.noteNames[index];
                    });
                    console.log("Generated Level 4 pattern: ".concat(generatedPattern2.join(', ')));
                    return generatedPattern2;
                } else if (level === 5) {
                    var allowedPatternsL5 = [
                        // From Level 4
                        [
                            0,
                            2,
                            4
                        ],
                        [
                            0,
                            4,
                            4
                        ],
                        [
                            0,
                            4,
                            2
                        ],
                        [
                            0,
                            4,
                            0
                        ],
                        [
                            0,
                            7,
                            0
                        ],
                        [
                            0,
                            7,
                            7
                        ],
                        [
                            0,
                            7,
                            4
                        ],
                        [
                            0,
                            0,
                            7
                        ],
                        // New for Level 5
                        [
                            0,
                            9,
                            7
                        ],
                        [
                            0,
                            0,
                            9
                        ],
                        [
                            0,
                            9,
                            0
                        ],
                        [
                            0,
                            7,
                            9
                        ],
                        [
                            0,
                            9,
                            4
                        ],
                        [
                            0,
                            4,
                            9
                        ] // Do-Mi-La
                    ];
                    var tonicIndex3 = this.noteNames.indexOf(this.baseNote); // Start on C4
                    if (tonicIndex3 === -1) {
                        console.error("Base note C4 not found in NOTES");
                        return null;
                    }
                    var intervalPattern3 = allowedPatternsL5[THREE.MathUtils.randInt(0, allowedPatternsL5.length - 1)];
                    var noteIndices3 = intervalPattern3.map(function(interval) {
                        return tonicIndex3 + interval;
                    });
                    if (noteIndices3.some(function(index) {
                        return index < 0 || index >= _this.noteNames.length;
                    })) {
                        console.warn("Generated Level 5 pattern indices out of bounds: ".concat(noteIndices3, ". Tonic: ").concat(this.noteNames[tonicIndex3]));
                        return null;
                    }
                    var generatedPattern3 = noteIndices3.map(function(index) {
                        return _this.noteNames[index];
                    });
                    console.log("Generated Level 5 pattern: ".concat(generatedPattern3.join(', ')));
                    return generatedPattern3;
                } else if (level === 6) {
                    var allowedPatternsL6 = [
                        [
                            0,
                            11,
                            9
                        ],
                        [
                            0,
                            9,
                            5
                        ],
                        [
                            0,
                            9,
                            2
                        ],
                        [
                            0,
                            11,
                            7
                        ],
                        [
                            0,
                            9,
                            11
                        ],
                        [
                            0,
                            4,
                            9
                        ],
                        [
                            0,
                            11,
                            2
                        ],
                        [
                            0,
                            11,
                            4
                        ],
                        // [0, 9, 11], // Do-La-Ti (Duplicate from above)
                        [
                            0,
                            2,
                            11
                        ],
                        [
                            0,
                            2,
                            9
                        ],
                        [
                            0,
                            2,
                            7
                        ],
                        [
                            0,
                            4,
                            7
                        ],
                        [
                            0,
                            11,
                            0
                        ],
                        [
                            0,
                            11,
                            5
                        ] // Do-Ti-Fa
                    ];
                    var tonicIndex4 = this.noteNames.indexOf(this.baseNote); // Start on C4
                    if (tonicIndex4 === -1) {
                        console.error("Base note C4 not found in NOTES");
                        return null;
                    }
                    var intervalPattern4 = allowedPatternsL6[THREE.MathUtils.randInt(0, allowedPatternsL6.length - 1)];
                    var noteIndices4 = intervalPattern4.map(function(interval) {
                        return tonicIndex4 + interval;
                    });
                    // Validate indices are within bounds (also inherently checks octave for these patterns)
                    if (noteIndices4.some(function(index) {
                        return index < 0 || index >= _this.noteNames.length;
                    })) {
                        console.warn("Generated Level 6 pattern indices out of bounds: ".concat(noteIndices4, ". Tonic: ").concat(this.noteNames[tonicIndex4]));
                        return null;
                    }
                    var generatedPattern4 = noteIndices4.map(function(index) {
                        return _this.noteNames[index];
                    });
                    console.log("Generated Level 6 pattern: ".concat(generatedPattern4.join(', ')));
                    return generatedPattern4;
                }
                // --- Default Pattern Generation for other levels (L1, L7+) ---
                // Note: Levels 2-6 have specific 'else if' blocks above and will return before reaching this code.
                var currentNoteIndex = this.noteNames.indexOf(this.baseNote);
                var pattern = [];
                var tonicNoteIndex = -1; // Store the index of the first note (tonic)
                for(var i = 0; i < length; i++){
                    // Use full note range available, clamped by overall max range from base note
                    var minAllowedIndex = Math.max(0, this.noteNames.indexOf(this.baseNote) - config.maxRange);
                    var maxAllowedIndex = Math.min(this.noteNames.length - 1, this.noteNames.indexOf(this.baseNote) + config.maxRange);
                    var candidates = [];
                    // Iterate through *all* possible notes within the allowed range
                    for(var targetIndex = minAllowedIndex; targetIndex <= maxAllowedIndex; targetIndex++){
                        if (i > 0) {
                            var intervalFromPrevious = Math.abs(targetIndex - currentNoteIndex);
                            var intervalFromTonic = (targetIndex - tonicNoteIndex + 1200) % 12; // Ensure tonicNoteIndex is set
                            // --- Universal Rule ---
                            // --- Level-Specific Rules ---
                            if (level === 1) {
                                // L1: Only Do, Re, Mi relative to tonic. Allow repeats. No interval check vs previous needed.
                                var allowedTonicIntervalsL1 = new Set([
                                    0,
                                    2,
                                    4
                                ]); // Do, Re, Mi
                                if (!allowedTonicIntervalsL1.has(intervalFromTonic)) continue;
                                // NEW: Ensure target note is within the same octave as the tonic
                                if (targetIndex < tonicNoteIndex || targetIndex >= tonicNoteIndex + 12) continue;
                            // Allow repeats for L1, skip the check: if (targetIndex === currentNoteIndex) continue;
                            } else if (level === 2) {
                                continue; // Should not be reached if level 2 logic is correct
                            } else if (level === 3) {
                                continue; // Should not be reached if level 3 logic is correct
                            } else if (level === 4) {
                                continue; // Should not be reached if level 4 logic is correct
                            } else if (level === 5) {} else if (level === 5) {
                                continue; // Should not be reached if level 5 logic is correct
                            } else if (level === 6) {} else {
                                // Rule: Check if target note is diatonic relative to the TONIC for levels <= 7
                                if (level <= 7) {
                                    var allowedTonicIntervals = diatonicIntervals; // Use Do, Re, Mi, Fa, Sol, La, Ti
                                    if (!allowedTonicIntervals.has(intervalFromTonic)) continue;
                                }
                                // Rule: No immediate repeats for levels >= 2 (L1 allows repeats)
                                if (level >= config.minJump && targetIndex === currentNoteIndex) continue;
                                // Rule: Jump size from PREVIOUS note must be within level's interval limits
                                if (intervalFromPrevious < config.minJump || intervalFromPrevious > config.maxInterval) continue;
                            // Rule: For L7 specifically (and potentially others below chromatic levels), avoid *chromatic* intervals from previous note
                            // This prevents jumps like C->F# if F# isn't diatonic to C, even if the interval size (6) is allowed.
                            // However, the primary check is intervalFromTonic for L7. Let's rely on that for now.
                            // if (level === 7 && chromaticIntervals.has(intervalFromPrevious)) continue; // This might be too restrictive. Re-eval if needed.
                            }
                        }
                        // If all checks passed for the current level (or if i === 0)
                        candidates.push(targetIndex);
                    }
                    if (candidates.length === 0) {
                        console.error("No valid candidates at level ".concat(level, ", position ").concat(i, " starting from ").concat(this.noteNames[currentNoteIndex], ". Config:"), config);
                        // Fallback or error handling needed? For now, return null.
                        // Attempting a simpler fallback: maybe just repeat the last note if possible?
                        if (i > 0) {
                            pattern.push(this.noteNames[currentNoteIndex]); // Repeat previous
                            // Keep currentNoteIndex the same for next iteration
                            console.warn("Using fallback: repeating previous note.");
                            continue; // Go to next iteration
                        } else {
                            // Cannot even generate the first note
                            console.error("Cannot generate even the first note.");
                            return null;
                        }
                    }
                    // Select a random candidate
                    var nextIndex = candidates[THREE.MathUtils.randInt(0, candidates.length - 1)];
                    pattern.push(this.noteNames[nextIndex]);
                    currentNoteIndex = nextIndex; // Update for the next iteration
                    // Store the tonic index after the first note is selected
                    if (i === 0) {
                        tonicNoteIndex = nextIndex;
                    }
                }
                return pattern; // Returns array of note names like ['C4', 'E4', 'G4']
            }
        },
        {
            key: "patternToSolfegeString",
            value: function patternToSolfegeString(pattern) {
                var _this = this;
                // Convert note names to Solfege relative to the first note (tonic)
                if (!pattern || pattern.length === 0) return "";
                var tonicIndex = this.noteNames.indexOf(pattern[0]);
                return pattern.map(function(noteName) {
                    var noteIndex = _this.noteNames.indexOf(noteName);
                    var interval = (noteIndex - tonicIndex + 1200) % 12; // Interval in semitones (handle wrap around)
                    return SOLFEGE_MAP[interval] || '?'; // Map interval to Solfege syllable
                }).join(', '); // e.g., "Do, Mi, So"
            }
        },
        {
            // } // REMOVED extra closing brace
            // Generates a single plausible incorrect pattern variation
            key: "generateSingleVariation",
            value: function generateSingleVariation(level, pattern, config) {
                var variation = _to_consumable_array(pattern);
                var changeIndex = THREE.MathUtils.randInt(0, pattern.length - 1);
                var currentNote = pattern[changeIndex];
                var currentIndex = this.noteNames.indexOf(currentNote);
                var variantCandidates = [];
                var minAllowedIndex = Math.max(0, this.noteNames.indexOf(this.baseNote) - config.maxRange);
                var maxAllowedIndex = Math.min(this.noteNames.length - 1, this.noteNames.indexOf(this.baseNote) + config.maxRange);
                // Consider shifts of 1-3 semitones for generating incorrect answers
                for(var shift = -3; shift <= 3; shift++){
                    if (shift === 0) continue; // Must be different note
                    var interval = Math.abs(shift);
                    // Enforce global jump limits (use maxInterval from config for variation generation)
                    // minJump doesn't strictly apply here as we want plausible *errors*
                    if (interval > config.maxInterval) continue;
                    // Avoid creating variations that result in a *chromatic interval* relative to the original note below level 7
                    var potentialIndex = THREE.MathUtils.clamp(currentIndex + shift, minAllowedIndex, maxAllowedIndex);
                    var resultingInterval = Math.abs(potentialIndex - currentIndex); // Interval from original note
                    if (level < 7 && chromaticIntervals.has(resultingInterval)) continue;
                    // Calculate potential new index and clamp it to the overall allowed range
                    var idx = potentialIndex; // Use the already calculated and clamped index
                    // Ensure the new index is actually different from the original
                    if (idx === currentIndex) continue;
                    variantCandidates.push(idx);
                }
                if (variantCandidates.length > 0) {
                    var newIndex = variantCandidates[THREE.MathUtils.randInt(0, variantCandidates.length - 1)];
                    variation[changeIndex] = this.noteNames[newIndex];
                } else {
                    // Fallback if no valid +/- 1-3 shift found respecting rules
                    // Try a simple +/- 2 shift clamped
                    console.warn("Could not find standard variation for level ".concat(level, ". Falling back."));
                    var fallbackShift = (Math.random() < 0.5 ? -1 : 1) * 2; // +/- 2
                    var newIndex1 = THREE.MathUtils.clamp(currentIndex + fallbackShift, minAllowedIndex, maxAllowedIndex);
                    if (newIndex1 !== currentIndex) {
                        variation[changeIndex] = this.noteNames[newIndex1];
                    } else {
                        // If even +/- 2 fails, just shift by +1 or -1 (might violate rules, but ensures variation)
                        fallbackShift = currentIndex > 0 ? -1 : 1;
                        newIndex1 = THREE.MathUtils.clamp(currentIndex + fallbackShift, minAllowedIndex, maxAllowedIndex);
                        if (newIndex1 !== currentIndex) {
                            variation[changeIndex] = this.noteNames[newIndex1];
                        }
                    // If still no change, the original pattern is returned (will be filtered out later)
                    }
                }
                return variation; // Return the pattern array ['C4', 'D4', 'E4']
            }
        },
        {
            key: "generateOptions",
            value: function generateOptions(correctPattern, correctAnswerString, level, config) {
                var options = new Set([
                    correctAnswerString
                ]); // Use Set to avoid duplicates easily
                var attempts = 0;
                var allowedSyllables = this.getAllowedSyllablesForLevel(level);
                // Generate 3 incorrect options
                while(options.size < 4 && attempts < 30){
                    var variationPattern = this.generateSingleVariation(level, correctPattern, config);
                    // Convert variation pattern to Solfege string relative to its *own* first note
                    // This creates relative pitch errors which are common mistakes.
                    var variationString = this.patternToSolfegeString(variationPattern);
                    // Ensure generated option is different, valid, and contains only allowed syllables for the level
                    if (variationString && variationString !== correctAnswerString && this.isValidOptionForLevel(variationString, allowedSyllables)) {
                        options.add(variationString);
                    }
                    attempts++;
                }
                // If not enough unique options generated, add simple placeholders (should be rare)
                var placeholderOptions = [
                    "Do, Re, Mi",
                    "Do, Mi, So",
                    "Do, Fa, La",
                    "Do, So, Ti"
                ];
                var placeholderIndex = 0;
                while(options.size < 4 && placeholderIndex < placeholderOptions.length){
                    var placeholder = placeholderOptions[placeholderIndex++];
                    if (!options.has(placeholder)) {
                        options.add(placeholder);
                    }
                }
                // Final check to ensure 4 options
                if (options.size < 4) {
                    console.warn("Could not generate 4 unique valid options for level ".concat(level, ". Found: ").concat(options.size));
                    // Add very simple fallbacks if absolutely necessary
                    var fallbackOptions = [
                        "Do, Do, Do",
                        "Do, Re, Mi",
                        "Do, Mi, So",
                        "So, Mi, Do"
                    ];
                    var fbIndex = 0;
                    while(options.size < 4 && fbIndex < fallbackOptions.length){
                        if (this.isValidOptionForLevel(fallbackOptions[fbIndex], allowedSyllables)) {
                            options.add(fallbackOptions[fbIndex]);
                        }
                        fbIndex++;
                    }
                }
                return this.shuffleArray(Array.from(options)); // Use existing shuffle method
            }
        },
        {
            key: "getAllowedSyllablesForLevel",
            value: function getAllowedSyllablesForLevel(level) {
                // Define allowed Solfege syllables based on level complexity
                if (level <= 2) return new Set([
                    'Do',
                    'Re',
                    'Mi'
                ]); // L1, L2
                if (level <= 3) return new Set([
                    'Do',
                    'Re',
                    'Mi',
                    'Fa',
                    'So'
                ]); // L3
                if (level <= 5) return new Set([
                    'Do',
                    'Re',
                    'Mi',
                    'Fa',
                    'So',
                    'La'
                ]); // L4, L5
                if (level <= 6) return new Set([
                    'Do',
                    'Re',
                    'Mi',
                    'Fa',
                    'So',
                    'La',
                    'Ti'
                ]); // L6 (Full diatonic)
                // L7+ can potentially include chromatic alterations (Di, Ri, Fi, Si, Li)
                return new Set(Object.values(SOLFEGE_MAP)); // Allow all syllables for L7+
            }
        },
        {
            key: "isValidOptionForLevel",
            value: function isValidOptionForLevel(optionString, allowedSyllables) {
                if (!optionString) return false;
                var syllables = optionString.split(',').map(function(s) {
                    return s.trim();
                });
                return syllables.every(function(syllable) {
                    return allowedSyllables.has(syllable);
                });
            }
        },
        {
            key: "shuffleArray",
            value: function shuffleArray(array) {
                for(var i = array.length - 1; i > 0; i--){
                    var j = Math.floor(Math.random() * (i + 1));
                    var ref;
                    ref = [
                        array[j],
                        array[i]
                    ], array[i] = ref[0], array[j] = ref[1], ref;
                }
                return array;
            }
        },
        {
            // Helper to convert a Solfege string back to note names relative to a tonic
            key: "solfegeStringToNotes",
            value: function solfegeStringToNotes(solfegeString, tonicNote) {
                var syllables = solfegeString.split(',').map(function(s) {
                    return s.trim();
                });
                var tonicIndex = this.noteNames.indexOf(tonicNote);
                if (tonicIndex === -1) {
                    console.error("Invalid tonic note provided:", tonicNote);
                    return null; // Or throw an error
                }
                // Create reverse mapping: Solfege syllable -> Interval
                var intervalMap = Object.entries(SOLFEGE_MAP).reduce(function(acc, param) {
                    var _param = _sliced_to_array(param, 2), interval = _param[0], syllable = _param[1];
                    acc[syllable] = parseInt(interval, 10);
                    // Handle alternative names if needed (e.g., Me -> 3) - SOLFEGE_MAP uses 'Ri' for minor 3rd currently
                    // if (syllable === 'Me') acc[syllable] = 3; // Example
                    return acc;
                }, {});
                var patternNotes = [];
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    for(var _iterator = syllables[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var syllable = _step.value;
                        var interval = intervalMap[syllable];
                        if (interval === undefined) {
                            console.warn("Unknown Solfege syllable: ".concat(syllable));
                            // Optionally return null or default note if syllable is bad
                            return null; // Indicate failure
                        }
                        var noteName = resolveRelativeNote(this.noteNames, tonicNote, interval);
                        if (!noteName) {
                            console.warn("Could not resolve syllable ".concat(syllable, " from tonic ").concat(tonicNote));
                            return null;
                        }
                        patternNotes.push(noteName);
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
                return patternNotes; // Returns array like ['C4', 'E4', 'G4']
            }
        }
    ]);
    return LevelManager;
}();
