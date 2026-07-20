import { LatheStatus } from '../models/fleet.model';

export interface StatusMeta {
    label: string;
    cssVar: string;
    dot: string;
    text: string;
    bg: string;
    badge: string;
}

export const STATUS_META: Record<LatheStatus, StatusMeta> = {
    operational: {
        label: 'Operacional',
        cssVar: 'var(--status-green)',
        dot: 'bg-[var(--status-green)]',
        text: 'text-[var(--status-green)]',
        bg: 'bg-[var(--status-green)]',
        badge: 'tag tag-green',
    },
    warning: {
        label: 'Atenção',
        cssVar: 'var(--status-yellow)',
        dot: 'bg-[var(--status-yellow)]',
        text: 'text-[var(--status-yellow)]',
        bg: 'bg-[var(--status-yellow)]',
        badge: 'tag tag-yellow',
    },
    critical: {
        label: 'Crítico',
        cssVar: 'var(--status-red)',
        dot: 'bg-[var(--status-red)]',
        text: 'text-[var(--status-red)]',
        bg: 'bg-[var(--status-red)]',
        badge: 'tag tag-red',
    },
    maintenance: {
        label: 'Manutenção',
        // Roxo em vez de azul: azul é reservado para ações/links (Carbon Design System).
        cssVar: 'var(--status-purple)',
        dot: 'bg-[var(--status-purple)]',
        text: 'text-[var(--status-purple)]',
        bg: 'bg-[var(--status-purple)]',
        badge: 'tag tag-purple',
    },
};

/** Índice de anomalia (0–99) derivado de status × vibração. */
export function anomalyScore(status: string, vibration: number): number {
    if (status === 'critical') return Math.min(99, Math.round(vibration * 14));
    if (status === 'warning') return Math.min(65, Math.round(vibration * 10));
    return Math.max(0, Math.round(vibration * 3));
}

/** Rótulo do score de operação (cards hero). */
export function scoreLabel(eff: number): string {
    if (eff >= 80) return 'NO CAMINHO';
    if (eff >= 55) return 'ATENÇÃO';
    return 'CRÍTICO';
}

/** Rótulo curto do header (badge ao lado do número grande). */
export function scoreHeadline(eff: number): { label: string; badge: string } {
    if (eff >= 80) return { label: 'ÓTIMO', badge: 'tag tag-blue' };
    if (eff >= 55) return { label: 'ESTÁVEL', badge: 'tag tag-yellow' };
    return { label: 'ALERTA', badge: 'tag tag-red' };
}

/** Cor de texto por faixa de eficiência (85/60). */
export function efficiencyText(v: number): string {
    if (v >= 85) return 'text-[var(--status-green)]';
    if (v >= 60) return 'text-[var(--status-yellow)]';
    return 'text-[var(--status-red)]';
}

/** Cor de fundo por faixa de eficiência (85/60). */
export function efficiencyBg(v: number): string {
    if (v >= 85) return 'bg-[var(--status-green)]';
    if (v >= 60) return 'bg-[var(--status-yellow)]';
    return 'bg-[var(--status-red)]';
}

/** Score de saúde (0–100) recalculado da telemetria viva. */
export function computeHealthScore(temperature: number, vibration: number, rpm: number, baseRpm: number): number {
    let score = 100;
    if (temperature > 55) score -= (temperature - 55) * 2;
    if (vibration > 3.5) score -= (vibration - 3.5) * 8;
    const rpmFloor = baseRpm * 0.9;
    if (baseRpm > 0 && rpm < rpmFloor) score -= ((rpmFloor - rpm) / baseRpm) * 100;
    return Math.max(0, Math.min(100, Math.round(score)));
}

/** Deriva o status operacional a partir do score/vibração (nunca usar sobre `maintenance`). */
export function deriveStatus(score: number, vibration: number): LatheStatus {
    if (score < 55 || vibration > 5.5) return 'critical';
    if (score < 80 || vibration > 3.5) return 'warning';
    return 'operational';
}
