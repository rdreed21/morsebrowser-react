import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { wordfilesDevPlugin } from './vite-wordfiles-plugin';
import { presetsDevPlugin } from './vite-presets-plugin';

export default defineConfig({
  plugins: [react(), wordfilesDevPlugin(), presetsDevPlugin()],
  resolve: {
    alias: {
      '@morsebrowser/core':  path.resolve(__dirname,'../../packages/core/src/index.ts'),
      '@morsebrowser/types': path.resolve(__dirname,'../../packages/types/src/index.ts'),
    },
  },
  server: {
    port: 5173,
  },
  test: { environment:'jsdom', setupFiles:['./src/test-setup.ts'], globals:true },
});
