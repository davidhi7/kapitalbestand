import { networkInterfaces } from 'node:os';
import { URL, fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

import vue from '@vitejs/plugin-vue';

const interfaces = networkInterfaces();

// TODO fix with better solution
let host = 'localhost';
const networkInterface = interfaces.enp8s0;
if (networkInterface != undefined && networkInterface.length > 0) {
    host = networkInterface.address;
}

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
        host: host,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: false,
                secure: false
            }
        }
    }
});
