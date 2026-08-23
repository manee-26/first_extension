import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Relative paths — required for Chrome extension file:// loading
  base: './',

  // Everything in public/ (manifest.json, icons/) is copied to dist/ as-is
  publicDir: 'public',

  build: {
    outDir: 'dist',
    emptyOutDir: true,

    // Inline nothing — MV3 CSP blocks inline scripts
    assetsInlineLimit: 0,

    rollupOptions: {
      output: {
        // Stable filenames so manifest doesn't need updating on every build
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})
