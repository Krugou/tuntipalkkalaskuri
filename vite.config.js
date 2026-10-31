import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages serves project sites from /<repo>/, so the workflow sets BASE_PATH.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [svelte(), tailwindcss()],
});
