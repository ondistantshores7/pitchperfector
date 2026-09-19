// Game States
export var GAME_STATE = {
    LOADING: 'LOADING',
    START_SCREEN: 'START_SCREEN',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
    HIGH_SCORE_ENTRY: 'HIGH_SCORE_ENTRY'
};
export var THEME_MUSIC_URL = 'https://play.rosebud.ai/assets/Pitch Perfector Theme.mp3?CFIc';
export var MUTE_STORAGE_KEY = 'pitchPerfector.muted';
// Musical Notes (Frequencies in Hz) - C3 to C5 Range
// Using standard A4 = 440 Hz tuning
export var NOTES = {
    'C3': 130.81,
    'C#3': 138.59,
    'D3': 146.83,
    'D#3': 155.56,
    'E3': 164.81,
    'F3': 174.61,
    'F#3': 185.00,
    'G3': 196.00,
    'G#3': 207.65,
    'A3': 220.00,
    'A#3': 233.08,
    'B3': 246.94,
    'C4': 261.63,
    'C#4': 277.18,
    'D4': 293.66,
    'D#4': 311.13,
    'E4': 329.63,
    'F4': 349.23,
    'F#4': 369.99,
    'G4': 392.00,
    'G#4': 415.30,
    'A4': 440.00,
    'A#4': 466.16,
    'B4': 493.88,
    'C5': 523.25 // End note included for range calculation
};
// Solfege mapping (relative to tonic = 0 semitones)
export var SOLFEGE_MAP = {
    0: 'Do',
    1: 'Di',
    2: 'Re',
    3: 'Ri',
    4: 'Mi',
    5: 'Fa',
    6: 'Fi',
    7: 'So',
    8: 'Si',
    9: 'La',
    10: 'Li',
    11: 'Ti' // Major 7th
};
// Other constants
export var MAX_LEVELS = 10;
