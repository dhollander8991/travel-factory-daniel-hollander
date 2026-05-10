/// <reference types='vitest' />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/requester-portal',
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [vue()],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/primevue') || id.includes('node_modules/@primevue')) {
            return 'primevue';
          }
          if (id.includes('node_modules/vue-i18n') || id.includes('node_modules/@intlify')) {
            return 'i18n';
          }
          if (
            id.includes('node_modules/vue/') ||
            id.includes('node_modules/@vue/') ||
            id.includes('node_modules/vue-router') ||
            id.includes('node_modules/axios')
          ) {
            return 'vendor';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    clearMocks: true,
    include: ['src/**/*.test.ts'],
  },
}));
