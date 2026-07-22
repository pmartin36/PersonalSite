# PersonalSite

Monorepo for Paul Martin's personal web properties. Firebase Hosting, domains at
Squarespace (same setup as the CodeScenes site).

## Projects

| Path | Domain | Stack | Description |
|------|--------|-------|-------------|
| [`paulmartin.dev/`](./paulmartin.dev) | paulmartin.dev | Vite + React | Main personal site. Hosts the Made By Moonlight game studio site at `/madebymoonlight/*`. |
| [`ulmartin.me/`](./ulmartin.me) | ulmartin.me | Static HTML | Transition page: plays an animation, then forwards to paulmartin.dev (history-replacing, so Back skips past it). |

## Develop

```sh
cd paulmartin.dev
npm install
npm run dev            # http://localhost:5173
```

`ulmartin.me` is a single static file — open `ulmartin.me/index.html` directly.

## Deploy (Firebase Hosting)

One Firebase project (`paulmartin`) hosts two sites via targets, configured at
the repo root (`firebase.json` + `.firebaserc`).

| Target | Site ID | Serves |
|--------|---------|--------|
| `paulmartin` | `paulmartin-dev` | `paulmartin.dev/dist` (built Vite app) |
| `ulmartin` | `ulmartin-me` | `ulmartin.me/` (static) |

`firebase-tools` is installed once at the repo root.

### First-time setup

```sh
npm install                                        # firebase-tools at the root
npx firebase login                                 # (already done on this machine)
npx firebase projects:create paulmartin
npx firebase hosting:sites:create paulmartin-dev --project paulmartin
npx firebase hosting:sites:create ulmartin-me --project paulmartin
```

Target→site mappings live in `.firebaserc` (already wired). Re-apply if needed:

```sh
npx firebase target:apply hosting paulmartin paulmartin-dev
npx firebase target:apply hosting ulmartin ulmartin-me
```

### Deploy

```sh
npm run deploy               # deploy both (builds paulmartin.dev first)
npm run deploy:paulmartin    # build + deploy paulmartin.dev only
npm run deploy:ulmartin      # deploy ulmartin.me only (no build)
```

### Custom domains

Connect each domain in the Firebase console (Hosting → Add custom domain),
then add the records Firebase gives you at the Squarespace registrar.

### Custom domains

Connect each domain in the Firebase console (Hosting → site → Add custom domain),
then add the records Firebase gives you at the Squarespace registrar.
