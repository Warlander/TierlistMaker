import { defineConfig } from 'vite';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };

export default defineConfig({
  base: '/TierlistMaker/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});
