import { defineConfig } from 'vite';

// Relative assets work at both username.github.io/ and /repository/.
export default defineConfig({
  base: './',
  build: {rollupOptions:{input:{store:'index.html',tryon:'tryon.html'}}}
});
