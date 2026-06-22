import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import fs from 'fs';
import solid from 'vite-plugin-solid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Auto-scan src/*.page.ts as Zepp OS page entries.
 * Output: { 'page/xxx.page': '/abs/path/to/src/xxx.page.ts' }
 */
function getPageEntries() {
  const dir = resolve('src');
  const files = fs.readdirSync(dir);
  const entries: Record<string, string> = {};
  for (const file of files) {
    if (
      file.endsWith('.page.ts') ||
      file.endsWith('.page.tsx') ||
      file.endsWith('.page.js') ||
      file.endsWith('.page.jsx')
    ) {
      const name = 'page/' + file.replace(/\.[tj]sx?$/, '');
      entries[name] = resolve(dir, file);
    }
  }
  return entries;
}

export default defineConfig(({ mode }) => {
  const isSimulator = mode === 'development';

  return {
    define: {
      __SIMULATOR__: isSimulator,
    },
    plugins: [
      solid({
        solid: {
          moduleName: '@cuberqaq/asuka-ui-lite/jsx-runtime',
          generate: 'universal',
        },
        babel: {},
      }),
    ],
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: '@cuberqaq/asuka-ui-lite',
      treeShaking: true,
    },
    build: {
      outDir: '.',
      rollupOptions: {
        input: {
          app: resolve(__dirname, 'app.tsx'),
          ...getPageEntries(),
        },
        output: {
          entryFileNames: '[name].js',
          format: 'es',
          inlineDynamicImports: false,
          chunkFileNames: 'shared/[name].chunk.js',
        },
        external: [
          /@zos\/.*/,
          /@cuberqaq\/asuka-ui-lite(\/*)?/,
          /@cuberqaq\/zeppos-reactive(\/*)?/,
          /@zeppos\/zml(\/*)?/,
        ],
        treeshake: {
          moduleSideEffects: false,
        },
      },
      minify: !isSimulator,
      emptyOutDir: false,
      target: 'es2019',
    },
  };
});
