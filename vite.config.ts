import { defineConfig } from 'vite';

// Relative assets work at both username.github.io/ and /repository/.
export default defineConfig({ base: './' });
