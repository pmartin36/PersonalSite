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

Each site is its **own Firebase project**, self-contained in its folder
(`firebase.json` + `.firebaserc`) — same pattern as the CodeScenes repo.

| Folder | Firebase project | Serves |
|--------|------------------|--------|
| `paulmartin.dev/` | `paulmartin-dev` | `dist/` (built Vite app) |
| `ulmartin.me/` | `ulmartin-me` | the folder itself (static) |

`firebase-tools` is installed once at the repo root and resolved by `firebase`
inside each folder.

### First-time setup (interactive — run these yourself)

```sh
npm install                                   # installs firebase-tools at the root
npx firebase login
npx firebase projects:create paulmartin-dev   # or reuse existing ids
npx firebase projects:create ulmartin-me
```

If you pick different project ids, update `default` in the matching
`<folder>/.firebaserc`.

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
