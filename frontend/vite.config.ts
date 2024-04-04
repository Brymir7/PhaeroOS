import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';
import mkcert from 'vite-plugin-mkcert'
import { createHtmlPlugin } from 'vite-plugin-html';
// https://vitejs.dev/config/
export default defineConfig({
    optimizeDeps: {
    include: ['@mui/material', '@emotion/react', '@emotion/styled'],
  },
  plugins: [react(), mkcert(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['robots.txt'], // Include additional assets
    manifest: {
      // Manifest properties
      name: 'Phaero',
      short_name: 'Phaero',
      start_url: '.',
      display: 'standalone',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      icons: [
        {
          src: 'frontend/public/phaero_maskable_icon.png', // Adjust paths as necessary
          sizes: '192x192',
          type: 'image/png',
        },
      ],
    },
  }), ],
  server: {
    https: false,
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
  },
});
