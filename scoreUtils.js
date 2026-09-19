export function calculateStreakBonus(streak, basePoints) {
    if (!Number.isFinite(streak) || streak < 2) return 0;
    if (!Number.isFinite(basePoints) || basePoints <= 0) return 0;
    var multiplier = Math.min(0.5, (streak - 1) * 0.1);
    return Math.round(basePoints * multiplier);
}

export function clampScore(score) {
    var value = Number(score);
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.round(value));
}

export function formatSolfegeDisplay(text) {
    return String(text || '').replace(/\bSo\b/g, 'Sol');
}

export function sanitizeInitials(name) {
    var cleaned = String(name || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 3);
    return cleaned || 'AAA';
}
