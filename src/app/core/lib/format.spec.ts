import { formatISODate, parseISODateLocal, parseDMY, daysUntilDMY, typeLabel } from './format';

describe('formatISODate', () => {
    it('converts YYYY-MM-DD to DD/MM/YYYY', () => {
        expect(formatISODate('2026-08-01')).toBe('01/08/2026');
    });

    it('returns the input unchanged when missing parts', () => {
        expect(formatISODate('2026-08')).toBe('2026-08');
        expect(formatISODate('')).toBe('');
    });
});

describe('parseISODateLocal', () => {
    it('parses a valid ISO date into a local Date', () => {
        const d = parseISODateLocal('2026-08-01');
        expect(d).not.toBeNull();
        expect(d!.getFullYear()).toBe(2026);
        expect(d!.getMonth()).toBe(7);
        expect(d!.getDate()).toBe(1);
    });

    it('returns null for malformed input', () => {
        expect(parseISODateLocal('')).toBeNull();
        expect(parseISODateLocal('2026-08')).toBeNull();
    });
});

describe('parseDMY', () => {
    it('parses DD/MM/YYYY into a local Date', () => {
        const d = parseDMY('01/08/2026');
        expect(d.getFullYear()).toBe(2026);
        expect(d.getMonth()).toBe(7);
        expect(d.getDate()).toBe(1);
    });
});

describe('daysUntilDMY', () => {
    it('is negative for a date in the past', () => {
        expect(daysUntilDMY('01/01/2000')).toBeLessThan(0);
    });

    it('is positive for a date far in the future', () => {
        expect(daysUntilDMY('01/01/2099')).toBeGreaterThan(0);
    });
});

describe('typeLabel', () => {
    it('maps known maintenance types to PT-BR labels', () => {
        expect(typeLabel['preventive']).toBe('Preventiva');
        expect(typeLabel['predictive']).toBe('Preditiva');
        expect(typeLabel['corrective']).toBe('Corretiva');
    });
});
