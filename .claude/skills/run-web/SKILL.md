---
name: run-web
description: Run the Next.js app in web/ on port 3110 (dev mode) and take exact-width screenshots (390 px, 1280 px, reduced motion, 200 % text). Use for any "run it", "show me", screenshot or visual check of the web app. The only screenshot method in this repo.
---

# run-web

> **Template from PROJECT START** (originally built in Famprove), adapted for Design Wizard: dev mode only
> (the app is a static export, so `next start` cannot serve it) and no date override.

Start the web app on **port 3110** (design-wizard's own agent port; 3000 is the user's and other
projects' agents have their own ports: never touch or stop those), run a
command against it, and always stop it again. Screenshots come from Edge through the DevTools
protocol, in real time and at an exact viewport width.

## Why not a plain headless screenshot
Two Windows traps cost a full debugging session once:
- `--virtual-time-budget` never fires the animation frame React waits for before hydrating, so
  client components stay as skeletons.
- `--window-size=390,…` is clamped to about 516 px on Windows; the page is laid out wider and
  then cropped, which looks like overflow. `shoot.mjs` sets the width by device emulation instead.

## Use
From the repo root (PowerShell or `powershell -NoProfile -File …` from Git Bash). Write screenshots
to the session scratchpad or `%TEMP%`, never into the repo.

```powershell
# One shot (dev mode, no build needed)
.claude/skills/run-web/serve.ps1 -Cmd "node .claude/skills/run-web/shoot.mjs --out $env:TEMP\shell-390.png"

# Several shots against one server; ?fixture= picks a dev state (empty, harbour, stale, invalid-many) once slice 2 wires it up
.claude/skills/run-web/serve.ps1 -Cmd "node .claude/skills/run-web/shoot.mjs --out $env:TEMP\h-1280.png --width 1280 --path '/?fixture=harbour'; node .claude/skills/run-web/shoot.mjs --out $env:TEMP\h-390.png --path '/?fixture=harbour'"
```

`shoot.mjs` options: `--out <png>` (required) · `--path /?fixture=harbour` (default `/`) ·
`--width 390` · `--open` (open every `<details>`) · `--dark` · `--reduce-motion` (emulates
`prefers-reduced-motion: reduce`) · `--zoom200` (root font 200 %) ·
`--base http://localhost:3110`. It prints one JSON line (height, horizontal overflow, console
errors) and exits 1 on overflow, console errors or a page that never got ready (it waits for
`main h1`). Then **Read the PNG**: a screenshot you haven't looked at proves nothing.

The built export (`pnpm build` → `web/out/`) is served by `web/scripts/serve-out.mjs`, which the
e2e tests start themselves (`pnpm e2e`). Next ≥ 16 keeps dev output in `.next/dev`, so a build does
not disturb a dev server on port 3000.

## Rules
- Port 3110 only. The script refuses to start if 3110 is taken and always stops its server.
- The app reads no environment variables; there is no `.env.local` to protect.
- Edge lives at the default Windows path; set `EDGE_PATH` if not.
