/** YYYY-MM-DD → DD/MM/YYYY */
export function formatISODate(isoDate: string): string {
    const [y, m, d] = isoDate.split('-');
    if (!y || !m || !d) return isoDate;
    return `${d}/${m}/${y}`;
}

/** YYYY-MM-DD → Date local (null se inválida). */
export function parseISODateLocal(iso: string): Date | null {
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

/** DD/MM/YYYY → Date local. */
export function parseDMY(s: string): Date {
    const [d, m, y] = s.split('/').map(Number);
    return new Date(y, m - 1, d);
}

/** Dias entre hoje (00:00) e uma data DD/MM/YYYY (negativo = vencida). */
export function daysUntilDMY(s: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((parseDMY(s).getTime() - today.getTime()) / 86400000);
}

/** Rótulos PT-BR dos tipos de manutenção. */
export const typeLabel: Record<string, string> = {
    preventive: 'Preventiva',
    predictive: 'Preditiva',
    corrective: 'Corretiva',
};
