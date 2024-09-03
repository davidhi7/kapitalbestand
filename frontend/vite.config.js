import { URL, fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@backend-types': fileURLToPath(new URL('../backend/src/types', import.meta.url))
        }
    },
    server: {
        host: 'localhost',
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: false,
                secure: false
            }
        }
    }
});
