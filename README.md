# MDExport

**Download:** [latest release](https://github.com/BUTTERCUPXCZ/MDExport/releases/latest) ·
**Website:** source in [`mdexport-landing/`](mdexport-landing/)

MDExport is a local-first Markdown workspace for people who write a lot: handover notes,
specs, docs and long drafts. Your documents stay plain `.md` files in a folder you choose.
There's no account and no cloud; the only thing that goes online is the update check.

Every document moves through three stages:

- **Write**: a focused Markdown editor (CodeMirror) with find and replace.
- **Proof**: the editor beside the rendered page, which scrolls along as you write.
- **Deliver**: the finished page beside an export panel for PDF, Word (.docx) or HTML.

**Stack:** Tauri 2 · Rust (comrak, syntect, Typst, docx-rs) · React 19 · TypeScript ·
Vite · Tailwind CSS v4 · CodeMirror 6 · Zustand · TanStack Router

## Features

- **Library index**: the whole library folder as one tree. A `+` menu and right-click menus
  create, rename and trash documents and folders, named inline like VS Code's explorer.
- **Never lose work**: autosave (can be turned off in Settings), a prompt before closing
  with unsaved changes, and a conflict dialog when a file changed outside the app.
- **Exports that match the preview**: PDF (embedded Typst, fonts bundled), Word and HTML,
  all built from the same Markdown parser as the preview. Unsaved and pasted text is included.
- **Keyboard first**: quick switcher, stage switching, shortcut sheet (see below).
- **Picks up where you left off**: reopens the last document in the last-used stage.
- **Updates itself**: tells you when a new version is out and installs it in one click
  (open documents are saved first). Checks can be turned off in Settings.
- **Dark first**, with a light theme that follows the system. Tuned to stay smooth on
  modest hardware: adaptive preview rendering and a code-split editor.

### Keyboard shortcuts

| Shortcut               | Action                             |
| ---------------------- | ---------------------------------- |
| Ctrl+K / Ctrl+P        | Quick switcher (`>` for commands)  |
| Ctrl+N / Ctrl+O        | New document / Open file           |
| Ctrl+S / Ctrl+Shift+S  | Save / Save as                     |
| F2                     | Rename document                    |
| Ctrl+\\                | Switch between Write and Proof     |
| Ctrl+E                 | Deliver (export PDF, Word or HTML) |
| Ctrl+F / Ctrl+H        | Find / Find and replace            |
| Ctrl+PageUp / PageDown | Previous / next document           |
| Ctrl+,                 | Settings                           |
| Ctrl+/                 | All keyboard shortcuts             |

Ctrl is Cmd on macOS.

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

Release builds sign the in-app updater bundles, so `pnpm tauri build` needs the signing key
(`TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`; generate once with
`pnpm tauri signer generate`, keep it safe). CI reads them from repo secrets; see
`.github/workflows/release.yml`.

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
├── app/                  router, root layout, pages (home, editor, settings)
├── components/           app shell, library index (file tree), shared UI
├── features/             documents, editor, stages (Write/Proof/Deliver), export,
│                         library, session (autosave, close guard, restore), prefs,
│                         quick switcher, shortcuts, notices
├── services/tauri/       typed wrappers around Tauri IPC (the only place invoke() is used)
├── hooks/                app-wide hooks (global shortcuts, timers, focus)
├── types/                TypeScript types mirroring Rust models
└── styles/globals.css    design tokens (dark + light), document page and syntax styles

src-tauri/src/            Rust application core
├── commands/             thin Tauri commands (+ native dialogs)
├── services/             business logic, AccessScope (path authorization), library tree
├── repositories/         file and config persistence
├── markdown/             the single Markdown parser (comrak + syntect)
├── export/               PDF (Typst), DOCX and HTML exporters
└── models/               domain types and AppError
```

## File access and safety

- The frontend has no filesystem or dialog permissions. Open / Save As / folder
  pickers run in Rust.
- Rust accepts a path only if it is a `.md`/`.markdown` file inside the library
  folder or one the user picked in a dialog this session. Paths are canonicalized,
  so `..` and symlinks cannot escape.
- Saves are atomic (temp file + rename) and send the last-seen content hash;
  if the file changed on disk, the save is refused and the user chooses
  overwrite / reload / save a copy.
- Deleting documents or folders moves them to the OS trash. The library folder itself
  can't be deleted from the app.
- The library folder is stored in `<app config dir>/config.json`
  (Linux: `~/.config/dev.mdexport.app/`).
- Updates are checked against `latest.json` on the latest published GitHub release and
  installed only if signed with the project's updater key. No other network requests.

Request flow: `React → services/tauri → Tauri command → service → repository`.

## Architecture rules

- Markdown files on disk are the source of truth.
- Tauri commands stay thin; business logic lives in services.
- No raw `invoke()` in components.
- Minimal Tauri capabilities and a strict CSP; the frontend has no direct filesystem access.
- Every feature ships with its own tests.
