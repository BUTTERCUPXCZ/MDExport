# MDForge landing page

The website for [MDForge](https://github.com/BUTTERCUPXCZ/MDforge), a desktop Markdown
workspace for developers.

**Stack:** React 19 · Vite · TypeScript · Tailwind CSS v4 · shadcn/ui · lucide

It wears the app's own "Proof" theme (slate ink neutrals, one glacier accent, Instrument Sans
and JetBrains Mono). The product pictures in `src/mocks/` are HTML/CSS copies of the real
app UI that scale with their container, so they stay sharp at any size.

Download buttons read the latest published release from the GitHub API and fall back to the
Releases page if it can't be reached.

## Develop

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # release/OS helpers
pnpm build      # static site in dist/
pnpm preview    # serve dist/
```

## Deploy

`dist/` is a static site with relative paths, so it works on any static host.
`.github/workflows/pages.yml` publishes it with GitHub Pages on every push to `main`
(enable once: Settings → Pages → Source: "GitHub Actions").

## Layout

```
src/
├── App.tsx                  page: Navbar → Hero → FeatureBento → DownloadSection → Footer
├── components/              page sections + shadcn ui/
├── mocks/                   product pictures (AppWindow, Editor, Page, ExportPanel, LibraryTree)
├── lib/release.ts           latest release, installer matching, OS detection (+ tests)
└── index.css                theme tokens copied from the app
```
