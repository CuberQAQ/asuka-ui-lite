# Asuka UI Lite Template

Starter template for Zepp OS apps using [`@cuberqaq/asuka-ui-lite`](../packages/asuka-ui-lite).

## Usage inside this monorepo

```bash
# from monorepo root
pnpm install
pnpm -r build          # build reactive + ui-lite first

cd template
pnpm run dev           # build JS bundle for simulator
zeus build             # produce .zab for the watch
```

## Use as a starter for your own app

Copy this directory out of the monorepo (`npx degit CuberQAQ/asuka-ui-lite/template` or `cp -r`), then:

1. Edit `package.json`:
   - Change `"@cuberqaq/asuka-ui-lite": "workspace:*"` to `"@cuberqaq/asuka-ui-lite": "^1.0.1"`.
   - Update `name`, `version`, `description`.
2. Edit `app.json`:
   - Set `appId` to your registered Zepp app id.
   - Set `appName`, `vender`, `description`, `icon`.
3. Edit `src/App.tsx` and `app.tsx` — replace the hello world.
4. `pnpm install && pnpm run dev && zeus build`.

## Layout

```
template/
├─ app.json            Zepp app config (appId, permissions, targets)
├─ app.tsx             App entry (BaseApp + render(<AppRoot/>))
├─ vite.config.ts      Build config (externalizes @zos/*, asuka-ui-lite, zml)
├─ tsconfig.json       JSX preserve + jsxImportSource: @cuberqaq/asuka-ui-lite
├─ global.d.ts         __SIMULATOR__, ZML type declarations
├─ assets/             icon.png, images
├─ src/
│   ├─ App.tsx         Root component (hello world)
│   └─ index.page.ts   Zepp page entry (native widget fallback)
└─ app-side/
    └─ index.js        Side-service entry (BaseSideService)
```

## Scripts

| script | description |
|---|---|
| `pnpm run dev` | Vite build in development mode (no minify, `__SIMULATOR__: true`) |
| `pnpm run dev:watch` | Same as `dev` with `--watch` |
| `pnpm run build` | Vite build in production mode (minified, `console`/`debugger` dropped) |
| `pnpm run build:watch` | Same as `build` with `--watch` |

After `dev` or `build`, run `zeus build` to package the `.zab` file.
