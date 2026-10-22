import { defineConfig } from 'vite';

// Relative assets work at both username.github.io/ and /repository/.
export default defineConfig({
  base: './',
  build: {target:'es2022',rollupOptions:{input:{panel:'index.html',tryon:'tryon.html',admin:'admin.html'}}}
});
