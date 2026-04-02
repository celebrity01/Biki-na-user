import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        date: resolve(__dirname, 'date-selection.html'),
        event: resolve(__dirname, 'event-list.html'),
        ceremony: resolve(__dirname, 'ceremony-detail.html'),
        guest: resolve(__dirname, 'guest-list.html'),
        vendor: resolve(__dirname, 'vendor-marketplace.html'),
        guide: resolve(__dirname, 'cultural-guide.html'),
      },
    },
  },
});
