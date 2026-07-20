import { svgPath, seededSeries } from './sparkline';

describe('svgPath', () => {
    it('returns an empty string for fewer than 2 points', () => {
        expect(svgPath([], 0, 1)).toBe('');
        expect(svgPath([5], 0, 1)).toBe('');
    });

    it('starts with M and continues with L commands', () => {
        const path = svgPath([0, 5, 10], 0, 10);
        expect(path.startsWith('M')).toBe(true);
        expect(path.split(' L').length).toBe(3);
    });

    it('clamps values outside the min/max range instead of overflowing the viewBox', () => {
        const path = svgPath([-100, 200], 0, 10, 100, 30);
        // first point below min -> y clamped to height (30), last point above max -> y clamped to 0
        expect(path).toContain('30.0');
        expect(path).toContain('0.0');
    });
});

describe('seededSeries', () => {
    it('is deterministic for the same seed', () => {
        const a = seededSeries('TC-01rpm', 1200, 100);
        const b = seededSeries('TC-01rpm', 1200, 100);
        expect(a).toEqual(b);
    });

    it('produces a different series for a different seed', () => {
        const a = seededSeries('TC-01rpm', 1200, 100);
        const b = seededSeries('TC-02rpm', 1200, 100);
        expect(a).not.toEqual(b);
    });

    it('returns the requested number of points, centered around the base value', () => {
        const series = seededSeries('seed', 50, 5, 20);
        expect(series.length).toBe(20);
        const avg = series.reduce((s, v) => s + v, 0) / series.length;
        expect(avg).toBeGreaterThan(40);
        expect(avg).toBeLessThan(60);
    });
});
