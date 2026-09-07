import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import robotsTxt from 'astro-robots-txt';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  integrations: [robotsTxt()],
  site: 'https://deyleraf.dev',
  output: 'static',
  // Every page that renders an image is prerendered, so images are
  // optimised with sharp at build time. Cloudflare has no sharp at
  // runtime, and the default setting warns about exactly that.
  adapter: cloudflare({ imageService: 'compile' }),
  vite: {
    plugins: [tailwindcss()],
  },
});
