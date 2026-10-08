import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // Reach older iPhones/Safari too
    target: ['es2019', 'safari13'],
    rollupOptions: {
      // Home page is the about-me site; the store lives at /shop/
      input: {
        main: 'index.html',
        shop: 'shop/index.html',
      },
    },
  },
});
