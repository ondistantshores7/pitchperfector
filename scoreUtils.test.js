import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateStreakBonus, clampScore, formatSolfegeDisplay, sanitizeInitials } from './scoreUtils.js';
import { addHighScore, isHighScore, loadHighScores, MAX_HIGH_SCORES, normalizeHighScores, recordHighScore } from './highScores.js';

function memoryStorage(initial) {
    var data = Object.assign({}, initial);
    return {
        getItem: function(key) {
            return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
        },
        setItem: function(key, value) {
            data[key] = String(value);
        }
    };
}

describe('scoreUtils', function() {
    it('gives no streak bonus on the first correct answer', function() {
        assert.equal(calculateStreakBonus(1, 100), 0);
        assert.equal(calculateStreakBonus(0, 100), 0);
    });

    it('scales streak bonus and caps at 50%', function() {
        assert.equal(calculateStreakBonus(2, 100), 10);
        assert.equal(calculateStreakBonus(3, 100), 20);
        assert.equal(calculateStreakBonus(6, 100), 50);
        assert.equal(calculateStreakBonus(12, 100), 50);
    });

    it('clamps and formats score helpers', function() {
        assert.equal(clampScore(-25), 0);
        assert.equal(clampScore(12.6), 13);
        assert.equal(clampScore('nope'), 0);
        assert.equal(formatSolfegeDisplay('Do, So, Mi'), 'Do, Sol, Mi');
        assert.equal(sanitizeInitials('m.g!'), 'MG');
        assert.equal(sanitizeInitials(''), 'AAA');
    });
});

describe('highScores', function() {
    it('sorts, sanitizes, and trims the leaderboard', function() {
        var scores = normalizeHighScores([
            {
                name: 'bob!!',
                score: 50,
                level: 2
            },
            {
                name: 'ann',
                score: 200,
                level: 4
            },
            {
                name: 'bad',
                score: 'x'
            }
        ]);
        assert.equal(scores.length, 2);
        assert.equal(scores[0].name, 'ANN');
        assert.equal(scores[0].score, 200);
        assert.equal(scores[1].name, 'BOB');
    });

    it('treats a positive score as a high score until the board is full', function() {
        assert.equal(isHighScore(10, []), true);
        assert.equal(isHighScore(0, []), false);
        var full = [];
        for (var i = 0; i < MAX_HIGH_SCORES; i++) {
            full.push({
                name: 'AAA',
                score: 100 - i,
                level: 1
            });
        }
        assert.equal(isHighScore(50, full), false);
        assert.equal(isHighScore(101, full), true);
    });

    it('persists a new score through storage', function() {
        var storage = memoryStorage();
        recordHighScore({
            name: 'mg',
            score: 420,
            level: 3,
            date: '2026-09-19'
        }, storage);
        var loaded = loadHighScores(storage);
        assert.equal(loaded.length, 1);
        assert.equal(loaded[0].name, 'MG');
        assert.equal(loaded[0].score, 420);
        var next = addHighScore({
            name: 'zz',
            score: 10,
            level: 1
        }, loaded);
        assert.equal(next.length, 2);
        assert.equal(next[1].score, 10);
    });
});
