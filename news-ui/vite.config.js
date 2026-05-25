import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND = 'http://127.0.0.1:8000';

const proxyPaths = [
  '/crawl', '/latest-briefing', '/briefing', '/train',
  '/not-interested', '/workflow', '/sites', '/history/',
  '/track', '/status', '/analytics', '/profile', '/region', '/voc', '/insight',
  '/export-ppt', '/export-excel', '/export-word', '/assets',
];

const proxy = Object.fromEntries(
  proxyPaths.map((p) => [
    p,
    {
      target: BACKEND,
      changeOrigin: true,
      ws: false,
      configure: (proxy) => {
        proxy.on('proxyRes', (proxyRes) => {
          proxyRes.headers['cache-control'] = 'no-cache';
          proxyRes.headers['x-accel-buffering'] = 'no';
        });
      },
    },
  ])
);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy,
  },
});
