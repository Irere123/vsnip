import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/webview',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        webview: resolve(__dirname, 'webview/index.tsx'),
      },
      output: {
        entryFileNames: 'webview.js',
        assetFileNames: 'webview.css',
        // Prevent creating additional chunk files
        manualChunks: () => 'webview',
      },
    },
    // Ensure only one JS file is produced
    minify: true,
    sourcemap: false,
    // Don't auto-inject CSS - we'll handle that in our extension code
    cssCodeSplit: false,
  },
});
