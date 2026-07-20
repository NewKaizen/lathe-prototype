/** Build an SVG path string from a series, scaled into a 100×30 viewBox. */
export function svgPath(values: number[], min: number, max: number, width = 100, height = 30): string {
    if (values.length < 2) return '';
    const step = width / (values.length - 1);
    return values
        .map((val, i) => {
            const normalized = Math.max(0, Math.min(1, (val - min) / (max - min)));
            const x = i * step;
            const y = height - normalized * height;
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ');
}

/** Deterministic pseudo-series around a base value, seeded by a string id. */
export function seededSeries(seedStr: string, base: number, amplitude: number, count = 15): number[] {
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) % 100000;
    const out: number[] = [];
    for (let i = 0; i < count; i++) {
        const wave = Math.sin((i / count) * Math.PI * 2 + seed) * amplitude;
        const jitter = (((seed + i * 977) % 200) / 100 - 1) * amplitude * 0.4;
        out.push(base + wave + jitter);
    }
    return out;
}
