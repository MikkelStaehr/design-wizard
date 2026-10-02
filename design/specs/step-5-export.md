# Spec: Step 5, Export (slice 3d)

Owner: design-lead. Builds on step 4's reopen rows (`PreviewStep.tsx:37-58`), step 2's sticky action bar and the step 1 notice pattern. CONTRACTS wins on data; this file wins on look and copy. `{whose}` = "Harbour's" or "your project's". `{slug}` = `slug(profile.name)`. `{t}` = a local time: "14:32" for today, "1 Oct, 14:32" otherwise (en-GB, 24h).

## 1. Question, primary action, stop

**"Can I hand this design system to the team yet, and how do I get it into the repo?"**
- **Ready:** primary **Download all 4 files**. It is black, has the `Enter` kbd inside, and is full width at ≤760px.
- **Blocked:** primary **Go to {first open label}**, for example "Go to Font pair". It opens that decision's stop. A disabled "Download all" would be a dead end; the list below says what unlocks it.
- **One stop, `export`**, after `preview` in STOPS (rail label "Files"). The rail summary for step 5 reads `Ready` or `{n} open`, replacing "Not built yet".
- **Step 4 gets a way forward.** Replace `PreviewStep.tsx:60` ("Export is built next.") with the primary **Continue to export** (Enter). At 390 there is no rail and no J key, so without it touch users cannot reach step 5.

## 2. Visual treatment: the manifest

The files are the tool's output, not variants, so there are no plates or crop marks (the same reasoning as the library panels). Step 5 is a **delivery manifest**, the grading suite's "render queue": hairline rows (`--line`) with no boxes.
- **File names** in Plex Mono 13/500, exact case and never uppercased (`DESIGN.md`, not `design.md`), with `overflow-wrap: anywhere` because slugs reach 48 characters.
- **Meta line** in mono 11/400 tabular `--text-muted`. Byte counts are exact, never rounded.
- **Colour:** black appears only on the primary. Motion: none beyond the 120ms opacity on the meta line's "downloaded" change.

**Row anatomy** (the same at 1280 and 390): grid `minmax(0,1fr) auto`, gap 16px, padding 12px 0, min-height 44px.
- **Left column**, top to bottom: the name, the purpose (Geist 12 muted, ≤60ch), then the meta line.
- **Right column:** a secondary **Download** button (44px, 1px `--ctl`, `--surface`, 2px radius) with a sr-only file name, so it reads "Download DESIGN.md".
- **Under the row**, full width: a native `<details>` whose summary is a 44px row, "Show text" plus an SVG chevron. Its body is a `<pre tabindex="0" aria-label="{name} text">` in mono 11, `--surface`, 1px `--line`, max-height 320px, scrolling. Collapsed by default. **It is kept, because it builds trust:** the user can check `0px` or the `open: design-lead` lines before committing. It costs nothing to build, and its `textContent` is exactly what downloads.

**Page:** main column, max-width 720px. The live preview column stays at ≥1101px (it shows what the files describe). The sticky bar is as in step 2: status on the left, primary on the right, stacked at ≤760px, with `scroll-padding-bottom` equal to the bar height.

## 3. Blocked state (AC8): any decision is `null`

**Top to bottom:**
- Eyebrow `Step 05 · Export`, h1 `Export`.
- **Lead:** "Export writes DESIGN.md, tokens.json and ux-rules.yaml from your decisions. {n} decisions are still open. Nothing is filled in for you, so make each one first."
- **h2** `STILL OPEN · {n}`.
- **The rows:** one 44px row per `openDecisionStops(p)` entry, in wizard order, using the step 4 row pattern.
  - Left: sr-only "Decide ", then the label (`Project name`, …, `Density`).
  - Right: mono muted `Step {1|2|3}` and the chevron SVG.
  - Activating a row opens its stop. `Project name` and `Product type` go to `profile.identity`, which focuses the first empty field (step 1 spec). `Brand colour` and `Palette` both go to `visual.paletteVariant`.
- **h2** `PROJECT FILE`: the project file row is **live** (section 4). Saving progress is not exporting, and the file keeps every open decision as `null`.
- **h2** `EXPORTS · BLOCKED`: three rows with name and purpose. The meta line reads `blocked until every decision is made`. There is no button and no "Show text" (the exporters assert).
- **Bar:**
  - mono `{n} DECISIONS OPEN` (`1 DECISION OPEN`);
  - the sentence "The three exports unlock when the last decision is made.";
  - the primary **Go to {first open label}**.

Making the last decision and returning shows the ready state without a reload.

## 4. Ready state: every decision is set

- **Lead:** "Every decision is made. Download the files and commit them to {whose} repo. Downloading changes nothing here."
- **Snapshot line** (only while "Stored values differ" shows; 12px muted, under the lead): "These files use the stored values. To export the current algorithm's values, choose Recompute now above." Downloads are not blocked: keeping the stored values is the byte-stable choice.
- **`PROJECT FILE`:** `{slug}.dwproj.json`
  - Purpose: "Every decision. Reopen it here to change one."
  - Under the row, the commit hint (12px, `--text`): "Commit it as `design/{slug}.dwproj.json` in the target repo. The exported DESIGN.md names this path, so anyone can reopen it." The path is in mono 11, built from the same `slug()` as the provenance line.
- **`EXPORTS · 3 FILES`**, in this order:
  - `DESIGN.md`: "Part B for the repo's DESIGN.md: type, colour, shape, space. Merge it in; Part A stays as it is."
  - `tokens.json`: "Design tokens in W3C DTCG format, for code and design tools."
  - `ux-rules.yaml`: "{count line}: what tester and reviewer check." The count line is step 2's `4 rules · 3 must · 1 should`. With zero laws it reads "No rules, as decided: an empty list."
- **Meta line:**
  - `{bytes} bytes`, e.g. `6,412 bytes`. This is the UTF-8 length of the exact text that downloads (owner, section 10), never typed.
  - DESIGN.md adds ` · {m} items open for design-lead`, counted from the text by `openMarkerCount`.
- **Under the manifest** (12px muted): "Same decisions, same bytes: download any file again at any time. Download all hands your browser 4 files at once, so Chrome may ask you once to allow that. Each file's own button never asks. If your browser adds (1) to a name, remove it before committing."

## 5. After a download

- **Each row's meta line** gains ` · downloaded {t}`. This is view state for the session; for the project file it comes from `downloadedAt`.
- **Only the project file calls `markDownloaded()`**, through its own button or through Download all. It is the durable copy; downloading DESIGN.md alone saves nothing you can reopen.
- **Bar status** (`role="status"`), from `fileStatus(state)`:

| Status | Mono line | Sentence |
|---|---|---|
| none | `NO PROJECT FILE YET` | "Your work is only in this browser. Download the project file to keep a copy you can commit and reopen." |
| current | `PROJECT FILE UP TO DATE` | "Matches the project file you downloaded or opened at {t}." |
| behind | `UNSAVED SINCE {t}` | "Changes made after {t} are only in this browser. Download the project file to keep them." |

- **No undo.** A download changes nothing in the wizard, so there is nothing to undo. What replaces it:
  - the visible "downloaded {t}";
  - the guarantee that re-downloading gives byte-identical files;
  - the behind line, which says exactly when the browser's copy moved ahead.
- **Focus** stays on the button that was pressed.
- **Download all** sends the files in manifest order, 150ms apart. That is 600ms in total, so no progress indicator is needed.

## 6. Opening a project file (AC10)

**Where:** a project-level action, so it appears in three places, all using one component, `OpenProjectButton` (a visible `<button>` that calls `.click()` on a hidden `<input type="file" accept=".json,application/json" tabindex="-1">`, which gives one tab stop; reset `value` after each pick so the same file can be picked again):
- **Step 5, below the exports, 32px gap:**
  - h2 `OPEN A PROJECT FILE`;
  - "Reopen a .dwproj.json to change its decisions. It replaces what is here; you can undo that until your next change.";
  - a secondary button **Open project file…**.
- **The rail at ≥761px:** a 44px secondary row **Open project file…**, directly above the shortcut legend.
- **The mobile header at ≤760px:** a 44px button **Open file**, right of `Step n of 5`. Without it, a 390 user with an empty project cannot reach step 5.

**Reading:** the status next to the step 5 button reads "Reading {file name}…" until the read completes.

**Invalid file:** `open(text, name)` returns errors. The existing panel at the top of main lists every problem, and its h2 gets `tabindex="-1"` and receives focus.
- The status next to the button: "{file name} could not be opened: {k} problems, listed at the top. Nothing here changed."
- The project, `savedAt` and localStorage stay byte-identical.

**Valid file, undo over confirm.** It opens at once, with no dialog. The shell shows an **opened notice** at the top of main, in every step, in the snapshot-notice panel style (`--surface`, 1px `--ctl`, `role="status"`). Its h2 gets focus. The user stays on the current stop.
- **Title:** "Opened {file name}."
- **If the replaced project had work in no file** (status none or behind, and not the empty project), add: "It replaced {old name | your untitled project}, which had changes in no downloaded file."
- **Buttons** (secondary):
  - **Undo open**;
  - **Download {old slug}.dwproj.json** (only with that warning). It saves the replaced work without undoing.
- **Undo** restores the previous project, `savedAt`, `downloadedAt` and snapshot state byte-for-byte. The notice then reads "Back to {old name}. The opened file was not kept; open it again at any time."
- **Expiry:** Undo lasts until the next decision change, Keep/Recompute or another open. The notice then disappears.

## 7. Keyboard

- **On arrival,** focus goes to the h1.
- **J/K/E:** K → `preview`; J does nothing (last stop); E → `preview` (the nearest decided stop). J/K/E/Enter never act inside a field or on a focused `<summary>`.
- **Tab order:**
  - blocked: h1 → open-decision rows → project file Download → Show text → Open project file… → bar primary;
  - ready: h1 → per file (Download, Show text) in manifest order → `<pre>` when open → Open project file… → bar primary.
- **Enter:** on a focused button or summary, it activates that control. Anywhere else, it is the primary.
- **Legend:** on this stop, `1 2 3 Pick variant` and `Enter Choose variant` are replaced by `Enter  Download all` (ready) or `Enter  Go to open decision` (blocked).

## 8. States

| State | How to see it | Shows |
|---|---|---|
| Blocked, all open | `?fixture=empty&step=export` | 10 rows, `10 DECISIONS OPEN`, **Go to Project name**, `NO PROJECT FILE YET` |
| Ready | `?fixture=harbour&step=export` | 4 rows with byte counts, `harbour.dwproj.json`, `4 rules · 3 must · 1 should` |
| Zero laws | `?fixture=zero-laws&step=export` | the ux-rules purpose "No rules, as decided: an empty list." |
| Stale / behind | new `?fixture=behind` | `UNSAVED SINCE 1 Oct, 14:32` |
| Snapshot differs | `?fixture=snapshot-differs&step=export` | the notice above, plus the snapshot line |
| Invalid open | open `invalid-many.project.json` | the panel with every error, the local status, the store unchanged |
| Loading | before hydration | the shell's "Opening your project…" |
| Export error | `exportAll` throws (defensive) | that row's meta line: "Could not build {file}. Your decisions are unchanged; download the project file and report it." The project file stays live |

## 9. Acceptance criteria (tester)

1. **AC8:** "Export is blocked while any decision is `null`, and every open decision is listed by name. No defaults are filled in."
   - On `empty`, the 10 `DECISIONS` labels show in wizard order.
   - There is no DESIGN.md, tokens.json or ux-rules.yaml download button.
   - The project file downloaded here has every open decision as `null` and `resolved: null`.
   - Each row opens its stop (identity, platform, principles, each `visual.*`).
   - Deciding the last one shows the ready state with no reload.
2. **AC9:** "changing radius from 8 to 0 and exporting again changes only the radius lines. 0 is exported as 0."
   - On harbour, download the 3 exports, set radius to 0 (K/E or a rail row), J back, and download again.
   - The diff touches only the radius lines (`Radius: 0px`, `--radius: 0px`, `radius.base` 0). ux-rules.yaml is byte-equal.
3. **AC10:** "Reopening a saved project file restores every decision and produces byte-identical exports. An invalid file lists every problem and leaves the current state unchanged."
   - Download all, change density, then open the downloaded project file with the keyboard (Tab to **Open project file…**, Enter).
   - Every decision and the rail are restored, and the 3 exports are byte-equal to the first download.
   - **Undo open** brings back the changed density exactly.
   - `invalid-many` lists exactly its `.errors.json` count, focus is on the panel, and the project and localStorage are byte-identical.
4. **Names and sizes:** the 4 downloads are named `harbour.dwproj.json`, `DESIGN.md`, `tokens.json` and `ux-rules.yaml` (the `edge-name` fixture gives `norrebro-idas-1.dwproj.json`). Each displayed byte count equals the downloaded file's size. Each `<pre>` `textContent` equals its file.
5. **markDownloaded (3d):** downloading only DESIGN.md leaves `downloadedAt` null. Downloading the project file sets it, and the bar reads `PROJECT FILE UP TO DATE`. Any decision change after that reads `UNSAVED SINCE {t}`.
6. **Hint (3d):** the ready state shows `design/{slug}.dwproj.json`, which equals the path in the exported DESIGN.md's provenance line.
7. **Keyboard only, at 1280 and 390 (3d, AC6):**
   - From step 4, **Continue to export** (Enter) brings you here, with the h1 focused. Tab reaches every Download.
   - Enter on the page downloads all 4 files.
   - K → step 4. E → step 4. In blocked state, Enter → the first open stop.
   - The file picker opens from the keyboard in step 5, the rail and the mobile header.
8. **44px (AC6):** every row, Download button, summary, Open button and bar button is at least 44px tall at both widths. Every focus state is visible and never under the bar.
9. **No overflow and glyphs:** at 390 with `edge-name`, `shoot.mjs` exits 0. Every chrome node, including `·` and `…`, renders in Geist or Plex Mono, and the chevrons are SVG.

## 10. Owner changes (main session, before `ui`)

- **(a) `domain/decisions.ts`:**
  - Add a `stop: StopId` to each `DECISIONS` entry, plus `openDecisionStops(p): { label, stop }[]` in wizard order.
  - Append `{ id: "export", step: "export", label: "Files" }` to STOPS.
  - `isStopDecided("export")` returns true.
- **(b) Store, open and undo:**
  - Change the signature to `open(text, fileName?)`.
  - On success, keep `replaced = { project, savedAt, downloadedAt, snapshotDiffers, parked, openedName }` and add `undoOpen()`. Undo re-persists the old envelope with its original `savedAt` and `downloadedAt` (so `storage.save` takes a `savedAt`) and bumps `fileVersion`.
  - Clear `replaced` on any transition, keep/recompute, open, and `openDevFixture`.
- **(c) Store, file status:**
  - `savedAt` advances only when the canonical text changes.
  - `markDownloaded()` sets `downloadedAt` and leaves `savedAt` alone.
  - A successful open sets `downloadedAt` to the open time, because the file on disk matches. **This widens the meaning of CONTRACTS §1's `downloadedAt` to "last time a file on disk matched"; architect should note it.**
  - Add a selector `fileStatus(state)` that returns `none`, `current(at)` or `behind(since = downloadedAt)`.
- **(d) `lib/`:** `byteLength(text)` (UTF-8 via TextEncoder), `formatBytes(n)` → `6,412 bytes`, and `clockTime(iso, now)`.
- **(e) `export/design-md.ts`:** export `OPEN_MARKER` and `openMarkerCount(text)`.
- **(f) `data/project/file-io.ts`:**
  - Revoke the object URL after a delay (an immediate revoke cancels the download in Firefox and Safari).
  - Add `downloadMany(files)`, which sends them 150ms apart, in order.
- **(g) Move step 2's `countLine`** (`PrinciplesStep.tsx:46`) into `domain/rules.ts` so step 5 reuses it. Add `isEmptyProject(p)` in `data/project/empty.ts`.
- **(h) Dev fixtures** (none of these exist yet; today there are `empty`, `harbour`, `stale`, `invalid-many` and `zero-laws`):
  - `behind`: harbour with `downloadedAt` 1 Oct 14:32 and `savedAt` 2 Oct 09:10;
  - `edge-name`: from the C2 fixture;
  - `snapshot-differs`: specced in step 1 but never added.
