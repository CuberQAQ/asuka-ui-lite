# Changesets

This monorepo uses [changesets](https://github.com/changesets/changesets) to manage versions and releases.

## Workflow

### 1. Make your change

Edit code in `packages/*` (or `template/`).

### 2. Add a changeset

```bash
pnpm changeset
```

Pick the packages affected (with the bump type — patch / minor / major) and write a summary. This creates a file under `.changeset/`.

### 3. Commit the changeset with your code

```bash
git add .
git commit -m "feat(asuka-ui-lite): add X"
```

### 4. Merge to main

When PR merges, the [changesets/action](https://github.com/changesets/action) CI opens a "Version Packages" PR that bumps versions and updates the CHANGELOG. Merge that PR to release.

### 5. Publish (manual or CI)

Manual:

```bash
pnpm -r build
pnpm publish -r --access public
```

Or set up `NPM_TOKEN` in GitHub secrets and let the CI publish on merge of the Version Packages PR.

## Notes

- `template/` is marked `ignore` in `.changeset/config.json` — it never gets published.
- Internal deps use `workspace:*` in `package.json`; changesets rewrites them to `^x.y.z` at publish time.
