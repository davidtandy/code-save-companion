# Plan: Port `genaucheatsheet` into this Lovable project

You picked option 2 (replace this project with the uploaded one). The uploaded zip is a Vite + React + React Router app. This Lovable project runs on **TanStack Start** (file-based routing under `src/routes/`, no `main.tsx`/`App.tsx` entry). I'll port the source into the existing TanStack Start shell rather than try to swap the framework — that keeps the preview, SSR, and build pipeline working.

## What gets copied from the zip

From `genaucheatsheet-main 2/`:

- `src/components/**` → `src/components/**` (Poster, IntroStage, quizzes, RotateOverlay, NavLink, CursorDemo, WelcomeModal, poster/*, etc.)
  - Skip: `*.backup.tsx`, `.DS_Store`
- `src/index.css` → merged into `src/styles.css` (keep TanStack base + Tailwind v4 setup; append the cheatsheet's custom CSS/variables; drop legacy Tailwind v3 `@tailwind` directives if present)
- `src/App.css` → `src/app.css` (imported from the new home route if needed)
- `public/favicon.ico`, `public/robots.txt`, `public/placeholder.svg` → `public/` (overwrite)
- `index.html` `<head>` content (title, meta, fonts) → merged into `src/routes/__root.tsx` `head()`
- `tailwind.config.ts` colors/extensions → translated into Tailwind v4 `@theme` tokens in `src/styles.css` (Tailwind v4 has no config file)

## What I won't copy

- `package.json`, `bun.lockb`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `postcss.config.js`, `tailwind.config.ts`, `eslint.config.js`, `components.json` — current TanStack Start versions stay
- `src/main.tsx`, `src/App.tsx` — replaced by TanStack route files
- `src/components/ui/**` — already present in this project (shadcn). I'll only copy ones missing here: `toast.tsx`, `toaster.tsx`, `use-toast.ts` (the uploaded app uses them)
- `.claude/`, `.lovable/`, `.vscode/`, `.DS_Store`, `docs/`, `demo.*`, `svg-check.mjs`, `vitest.config.ts`, `src/test/` (test setup not wired into TanStack template)
- `.git` (none present, but excluded as a safety rule)

## Routing changes

The uploaded `App.tsx` uses React Router with what appears to be a single main page (`IntroStage` → `Poster`). I'll:

- Replace `src/routes/index.tsx` placeholder with the cheatsheet's main page component (rendering `IntroStage`/`Poster` flow as in the original `App.tsx`)
- Keep `src/routes/__root.tsx` as the shell, add the favicon/title/meta from the original `index.html`
- Not introduce extra routes — original app appears single-page

If `App.tsx` actually has multiple React Router routes, I'll create matching files under `src/routes/` (e.g. `/about`).

## Dependencies to install

I'll diff the uploaded `package.json` against the current one and `bun add` anything missing (likely: `framer-motion`, `lucide-react` versions, `react-router-dom` is NOT needed — replaced by TanStack — any audio/quiz libs the app uses, etc.). I'll list them before installing.

## CSS / Tailwind

- Current project uses Tailwind v4 via `@import "tailwindcss"` in `src/styles.css`.
- Uploaded project uses Tailwind v3 with `tailwind.config.ts`. I'll port custom colors/animations/fonts into Tailwind v4 `@theme {}` blocks and copy custom CSS layers verbatim.
- All custom CSS variables, font-face declarations, and keyframes from the original `src/index.css` and `src/App.css` will be preserved.

## Expected result

- Visiting `/` shows the German grammar cheatsheet exactly as in the source repo (Intro → Poster, with quizzes, mobile carousel, rotate overlay, etc.)
- Build/dev server runs under TanStack Start with no broken imports
- Favicon and page title match the original

## Risks / things to confirm afterwards

- React Router → TanStack Router substitution inside any deep component (e.g. `NavLink`, navigation hooks) needs find-and-replace. I'll grep for `react-router-dom` usages and rewrite to `@tanstack/react-router` equivalents.
- SSR may choke on browser-only code (window, document at module scope). If so, I'll dynamically import the offending modules or mark the route component as client-only.
- Tailwind v3 → v4 token translation may need a follow-up pass if some classes don't resolve.

---

**Reply "go" (or with adjustments) and I'll execute.** No files will be modified until you approve.