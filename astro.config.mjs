import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.danvallentyne.com',
  output: 'static',
  build: {
    format: 'preserve',
  },
});
