import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'electron-vite';

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    plugins: [tailwindcss()],
  },
});
