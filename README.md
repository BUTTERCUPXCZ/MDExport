# MDForge

Local-first Markdown workspace for developers. Create, edit, organize, version, and
export Markdown documents to PDF and DOCX — no account, cloud, or internet required.
Documents stay as plain `.md` files.

**Stack:** Tauri 2 · Rust · React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui

## Prerequisites (Ubuntu / Debian)

```bash
sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --component rustfmt,clippy
```

Also needed: Node.js 20+ and pnpm 10+. Other platforms: see
[Tauri prerequisites](https://tauri.app/start/prerequisites/).

## Development

```bash
pnpm install
pnpm tauri dev      # run the desktop app with hot reload
pnpm check          # format, lint, typecheck, frontend tests, Rust fmt/clippy/tests
pnpm tauri build    # build a release bundle
```

| Script            | Purpose                                                 |
| ----------------- | ------------------------------------------------------- |
| `pnpm lint`       | ESLint                                                  |
| `pnpm format`     | Prettier (write)                                        |
| `pnpm typecheck`  | TypeScript                                              |
| `pnpm test`       | Vitest (`pnpm test:watch` for watch mode)               |
| `pnpm check:rust` | `cargo fmt --check`, `clippy -D warnings`, `cargo test` |

## Project layout

```
src/                      React frontend
├── app/                  router, root layout, route pages
├── components/           layout (shell, modal, header), sidebar, shadcn/ui
├── features/             documents (store, dialogs), editor, library, notices
├── services/tauri/       typed wrappers around Tauri IPC (only place invoke() is used)
├── types/                TypeScript types mirroring Rust models
├── lib/                  small utilities (theme, cn)
└── styles/globals.css    design tokens (dark + light), preview + syntax styles

src-tauri/src/            Rust application core
├── commands/             thin Tauri commands (+ native dialogs)
├── services/             business logic, AccessScope (path authorization)
├── repositories/         persistence (files, config; SQLite from Phase 6)
├── markdown/             the single Markdown parser (comrak + syntect)
└── models/               domain types and AppError
```

## File access

- The frontend has no filesystem or dialog permissions. Open / Save As / folder
  pickers run in Rust.
- Rust accepts a path only if it is a `.md`/`.markdown` file inside the library
  folder or one the user picked in a dialog this session. Paths are canonicalized,
  so `..` and symlinks cannot escape.
- Saves are atomic (temp file + rename) and send the last-seen content hash;
  if the file changed on disk, the save is refused and the user chooses
  overwrite / reload / save a copy.
- Delete moves files to the OS trash.
- The library folder is stored in `<app config dir>/config.json`
  (Linux: `~/.config/dev.mdforge.app/`).

Request flow: `React → services/tauri → Tauri command → service → repository`.

## Architecture rules

- Markdown files on disk are the source of truth; SQLite only stores metadata.
- Tauri commands stay thin; business logic lives in services.
- No raw `invoke()` in components.
- Minimal Tauri capabilities and a strict CSP; the frontend has no direct filesystem access.
- Every phase ships with its own tests.
