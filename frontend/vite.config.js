import { networkInterfaces } from 'node:os';
import { URL, fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

import vue from '@vitejs/plugin-vue';

const interfaces = networkInterfaces();

const ipaddr = interfaces.enp8s0[0].address;

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        host: ipaddr,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: false,
                secure: false
            }
        }
    }
});
