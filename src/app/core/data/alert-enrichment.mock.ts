import { LatheData } from '../models/fleet.model';

/** MOCK: enriquece o alerta com timestamp de detecção e ação sugerida — dados que não existem
 *  em `LatheData` (contrato provisório do backend). Substituir quando o backend expuser um
 *  modelo de Alerta real com esses campos. */
export interface MockAlertDetails {
    detectedAt: Date;
    suggestedAction: string;
}

/** Minutos atrás determinísticos por máquina, pra não recalcular a cada render. */
function seedMinutesAgo(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return 2 + (hash % 118);
}

/** Congela o instante de detecção na primeira leitura de cada máquina. Sem isso, como o tick da
 *  simulação recalcula o alerta a cada poucos segundos, `Date.now()` avançaria junto e o card
 *  pareceria "detectado agora mesmo" pra sempre, em vez de envelhecer normalmente ("há X min"
 *  crescendo com o tempo real). */
const detectionCache = new Map<string, Date>();

function detectedAtFor(lathe: LatheData): Date {
    let detectedAt = detectionCache.get(lathe.id);
    if (!detectedAt) {
        detectedAt = new Date(Date.now() - seedMinutesAgo(lathe.id) * 60_000);
        detectionCache.set(lathe.id, detectedAt);
    }
    return detectedAt;
}

export function mockAlertDetails(lathe: LatheData): MockAlertDetails {
    const actions: string[] = [];
    if (lathe.vibration > 4) actions.push('Verificar rolamentos e alinhamento do eixo');
    if (lathe.temperature > 70) actions.push('Checar temperatura do mancal e sistema de refrigeração');
    if (lathe.efficiency < 55) actions.push('Investigar causa da queda de eficiência');
    if (actions.length === 0) {
        actions.push(
            lathe.status === 'critical' ? 'Inspeção imediata recomendada' : 'Monitorar parâmetros de operação',
        );
    }

    // Mostra até 2 ações quando a máquina cruza mais de um limiar ao mesmo tempo — uma única
    // ação escondia problemas simultâneos (ex.: vibração alta E temperatura alta na mesma máquina).
    return { detectedAt: detectedAtFor(lathe), suggestedAction: actions.slice(0, 2).join(' · ') };
}

/** Formata o timestamp de detecção: relativo se recente (<60min), absoluto caso contrário. */
export function formatDetectedAt(date: Date): string {
    const diffMin = Math.round((Date.now() - date.getTime()) / 60_000);
    if (diffMin < 60) return `há ${diffMin} min`;
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const mo = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${hh}:${mm} · ${dd}/${mo}`;
}
