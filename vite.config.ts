import {defineConfig} from 'vite';
import {hydrogen} from '@shopify/hydrogen/vite';
import {oxygen} from '@shopify/mini-oxygen/vite';
import {reactRouter} from '@react-router/dev/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  server: {
    allowedHosts: ['localhost', 'walks-graham-terminal-trek.tryhydrogen.dev'],
  },
  plugins: [hydrogen(), oxygen(), reactRouter(), tsconfigPaths()],
  build: {
    // Allow a strict Content-Security-Policy
    // withtout inlining assets as base64:
    assetsInlineLimit: 0,
  },
  ssr: {
    optimizeDeps: {
      include: [
        'zod',
        'prop-types',
        'react-fast-compare',
        'deepmerge',
        '@supabase/supabase-js',
      ],
    },
  },
});
