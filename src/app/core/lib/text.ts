/** Normaliza texto para comparação de busca: minúsculas e sem acentuação. */
export function normalizeSearch(value: string): string {
    return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
