import { defineConfig } from '@farmfe/core';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  vitePlugins: [svelte()],
  compilation: {
    output: {
      path: '../assets/',
      publicPath: 'http://localhost:5131/mods/mimultiplayer/assets',
    }
  }
});
