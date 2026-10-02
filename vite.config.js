import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({ build: { rollupOptions: { input: { main: resolve('index.html'), mouth: resolve('mouth.html'), actions: resolve('actions.html'), nativeMouthTest: resolve('native-mouth-test.html') } } } });
