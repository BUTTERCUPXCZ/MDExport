# MDExport landing page

The website for [MDExport](https://github.com/BUTTERCUPXCZ/MDExport), a desktop Markdown
workspace for developers.

**Stack:** React 19 · Vite · TypeScript · Tailwind CSS v4 · shadcn/ui · lucide

It wears the app's own "Proof" theme (slate ink neutrals, one glacier accent, Instrument Sans
and JetBrains Mono). The product pictures in `src/mocks/` are HTML/CSS copies of the real
app UI that scale with their container, so they stay sharp at any size.

One React app with two routes (React Router): the landing page (`/`) and the docs (`/docs`).
`vercel.json` serves `index.html` for every route and redirects the old `/docs.html` to `/docs`.

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
It is deployed on Vercel from this repo with **Root Directory** set to `mdexport-landing`
(framework preset Vite, build `pnpm build`, output `dist`).

## Layout

```
src/
├── App.tsx                  router + shared layout: Navbar → route → Footer
├── pages/                   route pages: HomePage, NotFoundPage
├── docs/                    the /docs route: DocsPage, content, prose components
├── components/              page sections + shadcn ui/
├── mocks/                   product pictures (AppWindow, Editor, Page, ExportPanel, LibraryTree)
├── lib/release.ts           latest release, installer matching, OS detection (+ tests)
└── index.css                theme tokens copied from the app
```
