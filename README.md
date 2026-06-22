# Asuka UI Lite

A JSX-based UI framework for [Zepp OS](https://docs.zepp.com/) watches, built on a tiny custom reactive core instead of solid-js. Designed to feel like SolidJS but fit in Zepp OS's constrained runtime.

![monorepo](https://img.shields.io/badge/structure-monorepo-blue)
![packages](https://img.shields.io/badge/packages-2-green)
![license](https://img.shields.io/badge/license-MIT-green)

## Packages

| package | version | description |
|---|---|---|
| [`@cuberqaq/asuka-ui-lite`](./packages/asuka-ui-lite) | [![npm](https://img.shields.io/npm/v/@cuberqaq/asuka-ui-lite.svg)](https://www.npmjs.com/package/@cuberqaq/asuka-ui-lite) | JSX UI framework — components, widgets, render API |
| [`@cuberqaq/zeppos-reactive`](./packages/zeppos-reactive) | [![npm](https://img.shields.io/npm/v/@cuberqaq/zeppos-reactive.svg)](https://www.npmjs.com/package/@cuberqaq/zeppos-reactive) | SolidJS-compatible reactive primitives (`reactive`, `effect`, `computed`, `memo`, `watch`, `mergeProps`) |

Plus [`template/`](./template) — a minimal starter project wiring the two into a Zepp OS app.

## Why?

Zepp OS apps run on resource-constrained watch hardware. The full `solid-js` distribution pulls in more than the platform comfortably handles; `@cuberqaq/zeppos-reactive` is a from-scratch, zero-dependency reactive system (~400 lines) that covers the common SolidJS API surface, and `@cuberqaq/asuka-ui-lite` is the JSX runtime + component framework on top of it.

## Quick start

### Use the template

```bash
# degit the template
npx degit CuberQAQ/asuka-ui-lite/template my-watch-app
cd my-watch-app

# install deps (template uses workspace:* — rewrite to npm versions)
sed -i 's/"workspace:\*"/"^1.0.1"/' package.json   # or edit manually

pnpm install
pnpm run dev      # vite build in dev mode
zeus build        # produce .zab
```

### Add to an existing Zepp app

```bash
pnpm add @cuberqaq/asuka-ui-lite @cuberqaq/zeppos-reactive
```

Wire up JSX in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@cuberqaq/asuka-ui-lite"
  }
}
```

And in `vite.config.ts`:

```ts
import solid from 'vite-plugin-solid';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    solid({
      solid: { moduleName: '@cuberqaq/asuka-ui-lite/jsx-runtime', generate: 'universal' },
    }),
  ],
  esbuild: { jsx: 'automatic', jsxImportSource: '@cuberqaq/asuka-ui-lite' },
  build: {
    rollupOptions: {
      external: [/@zos\/.*/, /@cuberqaq\/asuka-ui-lite(\/*)?/, /@cuberqaq\/zeppos-reactive(\/*)?/, /@zeppos\/zml(\/*)?/],
    },
  },
});
```

## Developing this monorepo

```bash
# install
pnpm install

# build all packages
pnpm build

# watch mode (rebuild on save)
pnpm watch

# type-check without emit
pnpm typecheck

# run template's dev build
cd template && pnpm run dev
```

### Linking to a local Zepp app

After `pnpm build`, link the two packages globally so any Zepp app on your machine picks them up:

```bash
cd packages/asuka-ui-lite && pnpm link --global
cd packages/zeppos-reactive && pnpm link --global
```

Or from the consuming project, point its `pnpm-workspace.yaml` overrides at the local paths.

## Releasing

This repo uses [changesets](https://github.com/changesets/changesets). Workflow:

```bash
pnpm changeset         # describe what changed
git add .changeset && git commit -m "chore: add changeset"
# push, merge PR → changesets/action opens a "Version Packages" PR
# merge that PR → CI publishes to npm
```

Or publish manually:

```bash
pnpm release           # build + changeset publish
```

> Requires `NPM_TOKEN` for CI, or `npm login` for manual publishes.

## Project layout

```
.
├─ packages/
│   ├─ asuka-ui-lite/      JSX runtime + components
│   └─ zeppos-reactive/    Reactive primitives
├─ template/               Starter project
├─ .changeset/             Versioning config
└─ pnpm-workspace.yaml     Workspace definition
```

## License

MIT © CuberQAQ
