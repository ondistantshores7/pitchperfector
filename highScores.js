import { clampScore, sanitizeInitials } from './scoreUtils.js';

export var HIGH_SCORE_STORAGE_KEY = 'pitchPerfector.highScores.v1';
export var MAX_HIGH_SCORES = 8;

function getStorage(storage) {
    if (storage) return storage;
    try {
        return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch (error) {
        return null;
    }
}

export function normalizeHighScores(entries) {
    if (!Array.isArray(entries)) return [];
    return entries.filter(function(entry) {
        return entry && Number.isFinite(Number(entry.score));
    }).map(function(entry) {
        return {
            name: sanitizeInitials(entry.name),
            score: clampScore(entry.score),
            level: Math.max(1, Math.round(Number(entry.level)) || 1),
            date: typeof entry.date === 'string' ? entry.date : ''
        };
    }).sort(function(a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return b.level - a.level;
    }).slice(0, MAX_HIGH_SCORES);
}

export function loadHighScores(storage) {
    var store = getStorage(storage);
    if (!store) return [];
    try {
        return normalizeHighScores(JSON.parse(store.getItem(HIGH_SCORE_STORAGE_KEY) || '[]'));
    } catch (error) {
        return [];
    }
}

export function isHighScore(score, scores) {
    var value = clampScore(score);
    if (value <= 0) return false;
    var list = Array.isArray(scores) ? scores : [];
    if (list.length < MAX_HIGH_SCORES) return true;
    return value > list[list.length - 1].score;
}

export function addHighScore(entry, scores) {
    return normalizeHighScores((scores || []).concat([
        entry
    ]));
}

export function saveHighScores(scores, storage) {
    var normalized = normalizeHighScores(scores);
    var store = getStorage(storage);
    if (store) {
        store.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
}

export function recordHighScore(entry, storage) {
    return saveHighScores(addHighScore(entry, loadHighScores(storage)), storage);
}
