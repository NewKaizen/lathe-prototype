import {
    STATUS_META,
    anomalyScore,
    scoreLabel,
    scoreHeadline,
    efficiencyText,
    efficiencyBg,
    computeHealthScore,
    deriveStatus,
} from './status';

describe('STATUS_META', () => {
    it('has an entry for every LatheStatus with a non-empty label', () => {
        for (const key of ['operational', 'warning', 'critical', 'maintenance'] as const) {
            expect(STATUS_META[key].label.length).toBeGreaterThan(0);
        }
    });
});

describe('anomalyScore', () => {
    it('scales with vibration when critical, capped at 99', () => {
        expect(anomalyScore('critical', 1)).toBe(14);
        expect(anomalyScore('critical', 20)).toBe(99);
    });

    it('scales with vibration when warning, capped at 65', () => {
        expect(anomalyScore('warning', 1)).toBe(10);
        expect(anomalyScore('warning', 20)).toBe(65);
    });

    it('uses a gentler multiplier and floors at 0 otherwise', () => {
        expect(anomalyScore('operational', 1)).toBe(3);
        expect(anomalyScore('operational', 0)).toBe(0);
    });
});

describe('scoreLabel', () => {
    it('returns NO CAMINHO at/above 80', () => {
        expect(scoreLabel(80)).toBe('NO CAMINHO');
        expect(scoreLabel(100)).toBe('NO CAMINHO');
    });

    it('returns ATENÇÃO between 55 and 79', () => {
        expect(scoreLabel(55)).toBe('ATENÇÃO');
        expect(scoreLabel(79)).toBe('ATENÇÃO');
    });

    it('returns CRÍTICO below 55', () => {
        expect(scoreLabel(0)).toBe('CRÍTICO');
        expect(scoreLabel(54)).toBe('CRÍTICO');
    });
});

describe('scoreHeadline', () => {
    it('returns ÓTIMO at/above 80', () => {
        expect(scoreHeadline(80).label).toBe('ÓTIMO');
    });

    it('returns ESTÁVEL between 55 and 79', () => {
        expect(scoreHeadline(60).label).toBe('ESTÁVEL');
    });

    it('returns ALERTA below 55', () => {
        expect(scoreHeadline(10).label).toBe('ALERTA');
    });
});

describe('efficiencyText / efficiencyBg', () => {
    it('uses green tokens at/above 85', () => {
        expect(efficiencyText(85)).toContain('status-green');
        expect(efficiencyBg(85)).toContain('status-green');
    });

    it('uses yellow tokens between 60 and 84', () => {
        expect(efficiencyText(60)).toContain('status-yellow');
        expect(efficiencyBg(84)).toContain('status-yellow');
    });

    it('uses red tokens below 60', () => {
        expect(efficiencyText(59)).toContain('status-red');
        expect(efficiencyBg(0)).toContain('status-red');
    });
});

describe('computeHealthScore', () => {
    it('returns 100 for a perfectly nominal machine', () => {
        expect(computeHealthScore(50, 2, 1200, 1200)).toBe(100);
    });

    it('penalizes high temperature', () => {
        expect(computeHealthScore(65, 2, 1200, 1200)).toBeLessThan(100);
    });

    it('penalizes high vibration', () => {
        expect(computeHealthScore(50, 5, 1200, 1200)).toBeLessThan(100);
    });

    it('penalizes rpm falling below 90% of baseline', () => {
        expect(computeHealthScore(50, 2, 900, 1200)).toBeLessThan(100);
    });

    it('never goes below 0 or above 100', () => {
        expect(computeHealthScore(200, 50, 0, 1200)).toBeGreaterThanOrEqual(0);
        expect(computeHealthScore(0, 0, 1200, 1200)).toBeLessThanOrEqual(100);
    });
});

describe('deriveStatus', () => {
    it('is critical when score is low or vibration is very high', () => {
        expect(deriveStatus(40, 1)).toBe('critical');
        expect(deriveStatus(90, 6)).toBe('critical');
    });

    it('is warning when score or vibration is moderately degraded', () => {
        expect(deriveStatus(70, 1)).toBe('warning');
        expect(deriveStatus(90, 4)).toBe('warning');
    });

    it('is operational when score and vibration are both healthy', () => {
        expect(deriveStatus(90, 1)).toBe('operational');
    });
});
