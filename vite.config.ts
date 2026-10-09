import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
    manifest: {
      name: 'Aventura da Cotia', short_name: 'Cotia',
      description: 'Uma corrida pela floresta, feita para pequenos exploradores.',
      lang: 'pt-BR', theme_color: '#163f37', background_color: '#f3f1e7',
      display: 'standalone', orientation: 'portrait', start_url: './',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
  })],
});
