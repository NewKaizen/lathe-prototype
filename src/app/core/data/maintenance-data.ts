import { MaintenanceRecord } from '../models/fleet.model';
import { parseDMY } from '../lib/format';

export const TECHNICIANS = ['Carlos Silva', 'Ana Costa', 'João Santos', 'Marcos Oliveira', 'Beatriz Lima'] as const;

const TYPES: MaintenanceRecord['type'][] = ['Preventiva', 'Preditiva', 'Corretiva'];

function toDMY(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
}

function seedOf(id: string): number {
    let s = 0;
    for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) % 9973;
    return s;
}

/** Gera 3 registros concluídos, o mais recente = lastMaintenance da máquina. */
export function maintenanceHistoryFor(lathe: { id: string; lastMaintenance: string }): MaintenanceRecord[] {
    const seed = seedOf(lathe.id);
    const base = parseDMY(lathe.lastMaintenance);
    return Array.from({ length: 3 }, (_, i) => {
        const d = new Date(base);
        d.setDate(d.getDate() - i * (55 + (seed % 11)));
        return {
            date: toDMY(d),
            type: TYPES[(seed + i) % TYPES.length],
            tech: TECHNICIANS[(seed + i * 2) % TECHNICIANS.length],
            status: 'Concluída' as const,
        };
    });
}
