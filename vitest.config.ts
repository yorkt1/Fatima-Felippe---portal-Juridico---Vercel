import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Config separada da vite.config.ts de produção, pra não misturar opções
// de teste com o que vai pro build do site.
export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        css: false,
    },
});
