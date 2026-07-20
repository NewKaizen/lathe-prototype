import { defineConfig } from 'vitest/config';

// A árvore de componentes inclui o gêmeo digital 3D (Babylon.js), carregado
// via `@defer` em produção — mas o TestBed ainda precisa resolvê-lo durante
// `compileComponents()`, e o bundle é grande o bastante para estourar o
// hookTimeout padrão (10s) no primeiro build de cada execução.
export default defineConfig({
    test: {
        globals: true,
        hookTimeout: 60_000,
        testTimeout: 60_000,
    },
});
