import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        tailwindcss(),
        react(),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
    server: {
        host: '127.0.0.1',
        // origin le indica al plugin de Laravel qué URL inyectar en los scripts.
        // El certificado cubre menugo.local (no 127.0.0.1), por lo que
        // el navegador debe pedir assets desde menugo.local:5173.
        origin: 'https://menugo.local:5173',
        https: {
            key:  'C:/xampp/apache/conf/ssl.key/menugo.key',
            cert: 'C:/xampp/apache/conf/ssl.crt/menugo.crt',
        },
        cors: true,
        allowedHosts: ['.menugo.local', 'menugo.local'],
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
