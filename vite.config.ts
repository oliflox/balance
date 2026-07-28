import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// On GitHub Pages the site is served from https://<user>.github.io/<repo>/,
// so the production build needs a matching base path. Change '/balance/' if you
// rename the repository. In dev the base stays '/'.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/balance/' : '/',
  server: { port: 5173 },
}));
