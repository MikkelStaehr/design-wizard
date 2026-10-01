# Spec: Step 1, Project profile (slice 3a)

Owner: design-lead. Builds on `components/plate/*` and `steps/visual/*`. Where this and PLAN/CONTRACTS differ, CONTRACTS wins on data and this file wins on look and copy.

## 1. Question and primary action

**"What is this project, and what is it built for?"** Step 1 has three stops (sub-decisions). Each stop has exactly one primary button (black, `Enter` kbd inside, full width at ≤760px):

| Stop (`?step=`) | Rail label | Decisions it sets | Primary button |
|---|---|---|---|
| `profile.identity` | Name & type | `name`, `productType` (+ `notes`, not a decision) | **Continue to platform** |
| `profile.platform` | Platform | `platform` | **Choose {label}** (PlateGrid as built) |
| `profile.library` | Component library | `componentLibrary` | **Choose {label}** |

Rail row "Project profile" shows `{n} of 3 decided` (name, productType, platform; componentLibrary is never open so it is not counted). Sub-rows show values: the name (CSS ellipsis), `Desktop`/`Mobile`/`Both`, `shadcn/ui`/`None`; open rows show `now`/`next`/`open` exactly as step 3. Identity reads `open` until **both** name and type are set.

## 2. Variants: what is live and what would be fake

**Platform: 3 live plates (honest, with a caveat).** Each plate renders the real `SampleCard` (project tokens, preview neutrals for open visual decisions, the product name) at a true logical width, scaled down: **Desktop** = one 1280×800 frame; **Mobile** = one 390×844 frame; **Both** = the two frames side by side, bottom-aligned, 48 logical px apart, at one shared scale. Inside the variant root: a stage with `aspect-ratio: 4/3`, `background: var(--v-bg)`; each frame is `1px solid var(--v-border)`, radius 0, holds the card at its logical width with `transform: scale(s)`, origin top-left, and fits the stage with an 8% inset. `s` comes from one ResizeObserver on the stage. The stage box is fixed, so AC5 holds. Text becomes a silhouette at this scale. That is intended: this decision is about proportion, not type. **The caveat:** platform changes no token. It sets the platform line in DESIGN.md and the width the team designs at first. The lead copy says so (section 5), so the plates never imply a token change. When 3c ships `SampleScreen`, the frames render that instead of `SampleCard`.

**Component library: plates would be fake, so it is shown as 2 code panels.** shadcn and none render **pixel-identical** UI: the choice only renames the CSS variables in DESIGN.md's CSS block (CONTRACTS §4.2 vs §4.2a), and tokens.json is the same either way. A "shadcn-styled vs plain" sample would invent a difference the export never produces. Instead, show 2 options side by side (`grid-cols-2` at ≥761px, stacked below that), each a **chrome panel**: same radiogroup, keys and crop-mark selection brackets as a plate, but `--surface` fill, a 1px `--line` outline, no `data-v-root` and no font loading (it is the tool's output, not a variant, so AC4 does not apply). Each panel holds a 5-row excerpt of the real CSS block, rows aligned by role, in Plex Mono 11/400 tabular, columns `name | 10px swatch + hex`:

| role | shadcn/ui panel | None panel |
|---|---|---|
| bg | `--background` | `--bg` |
| accent | `--primary` | **`--accent`** |
| on-accent | `--primary-foreground` | `--on-accent` |
| surface | **`--accent`** | `--surface` |
| radius | `--radius` | `--radius` |

The two `--accent` rows are set in 500 weight: the naming clash is the real consequence. Take the names from `export/shadcn-map.ts` and `export/css-vars.ts`, never hard-coded. Take the values from `resolved` when it exists. Otherwise the value cell reads `set in step 3` in `--text-muted`, without a swatch. Under both panels: "tokens.json is identical either way."

**Name & type: no variants.** These are free text, so variants don't apply. A single plate, the **name check**, shows `SampleCard` with the **draft** name, updated on every input (< 100 ms; no transition). It does not wait for blur, so the user sees truncation as they type.

## 3. Text fields (stop `profile.identity`)

**Layout.** ≥761px: a grid `minmax(0,400px) 236px`, gap 24px. Left: fields, 20px apart. Right: label `NAME ON THE SAMPLE`, then the name check plate, then its caption. ≤760px: one column in the order fields → name check → status line → primary button. Each field: a label row (label left; counter right, mono 11/400 tabular, muted), 4px, the control, then the hint or error 4px below (12px). Controls: `--surface`, 1px `--ctl`, radius 2px, min-height 44px, 12px horizontal padding, Geist 13px, focus = 2px black outline with 2px offset. The field group always has a 2px transparent left border and 10px padding-left. On error the border turns `--accent` (black), so nothing shifts.

| Field | Label (mono 11/500 uppercase) | Control | Counter | Placeholder | Hint |
|---|---|---|---|---|---|
| name | `PROJECT NAME` | `input type="text" autocomplete="off" autocapitalize="words"` | `0 / 80` | `e.g. Harbour` | – |
| productType | `PRODUCT TYPE` | `input type="text" autocomplete="off"` | `0 / 60` | `e.g. Clinic booking app` | "A few words for DESIGN.md. Nothing else depends on it." |
| notes | `NOTES (OPTIONAL)` | `textarea rows=4`, resize vertical | `0 / 2000` | `Audience, constraints, references: anything the team should know.` | "Goes into DESIGN.md as written. Can stay empty." |

**No `maxLength`.** A paste is never cut silently. Over the limit, the counter reads `93 / 80 · 13 over` in `--text` 500. **Validation:** trim, then check. Validate on blur, but only once the field has been edited, so tabbing through an empty field shows nothing. On every submit, validate all three fields. Once a field shows an error, re-validate it on each input so the error clears as soon as the value is valid. **Commit:** on blur or submit, a valid value that differs from the store is written trimmed via `setProfile`. An invalid value is **kept in the field** and the store is left untouched. Field state: `aria-invalid`, plus `aria-describedby` pointing at the error. Drafts start from the store and re-sync when the stored value changes while the field is not focused (hydration, opening a file).

**Name pickup:** the name check reads the draft. The rail header (`Design Wizard · {name}`), the step 3 leads ("Harbour's screens") and all plates read the **stored** name, so they change on commit.

## 4. Flow and keyboard

- **J/K** walk one flat sequence across steps: `profile.identity → profile.platform → profile.library → principles` (the step 2 placeholder in 3a; the laws in 3b) `→ visual.fontPair … visual.density`. J at the end and K at the start do nothing. Never inside a text field (`ownsKey`).
- **E** opens the nearest *decided* stop before the current one in that sequence, across steps. From step 2 or any step 3 stop it always has a target, because the library is always decided.
- **1/2/3** pick platform plates; **1/2** pick library panels. **Arrows/Space** behave as in PlateGrid.
- **Enter:** in name or type it submits the form; in notes it adds a newline, and **Ctrl+Enter** submits. On a plate or panel stop it chooses. On a focused button it activates that button.
- **Esc** in a text field blurs it (which validates) and moves focus to the stop's `h1` (`tabindex=-1`), so J/K and the number keys work straight away.
- **Choose moves to the next stop in order**, not the next open one (unlike step 3), so the pre-selected library is always seen once. Identity → Platform → Library → step 2.
- **On arriving at a stop**, focus moves to its `h1`. Exception: a new project's identity stop focuses the first empty field.
- **Submit with errors:** don't move. Show every error and focus the first invalid field.
- **After the last stop (step 2 is not built yet):** the shell switches to step 2. Eyebrow `STEP 02 · UX PRINCIPLES`, h1 `UX principles`, then a dashed status box: "Step 2 isn't built yet. Your profile is saved; UX principles stay open until this step arrives." Then the primary button **Continue to visual system** (Enter) → step 3 at its first open decision, and a muted line under it: "Press E to reopen the profile." The rail marks step 2 current with "Not built yet".
- **Start step on load:** the first step with an open decision. If every decision is set, open step 3, the last built step.

## 5. Copy

- **Eyebrow** (mono label): `Step 01 · Project profile · Decision {i} of 3`.
- **Headings and leads** (≤60ch, `{whose}` = "Harbour's" or "your project's"):
  - **Name and product type:** "Name the project and say what kind of product it is. Both go into DESIGN.md; you can change them later."
  - **Platform:** "Which screens do {whose} designs target first? This sets the platform line in DESIGN.md and the width the team designs at. It changes no tokens; you can change it later."
  - **Component library:** "How should DESIGN.md name {whose} CSS variables? The colours and tokens.json stay the same; you can change this later."
- **Platform options.**
  - `Desktop`: "Designed at 1280 × 800; must still work at 390."
  - `Mobile`: "Designed at 390 × 844; grows to fit wider screens."
  - `Both`: "Designed and reviewed at 390 and 1280 equally."
- **Library options.**
  - `shadcn/ui`: "Maps your colours to shadcn's variables. Its --accent is the hover colour, not your brand."
  - `None`: "Declares your own role names, for Tailwind or plain CSS without shadcn."
- **Status line above the primary button.**
  - Identity: "Each field saves when you leave it. You can change them later."
  - Platform: "Choosing records the platform and moves to component library."
  - Library: "Choosing records the component library and moves to step 2."
  - With nothing selected: the existing "Pick a {decision} variant with a number key or a click."
- **Name check caption.** Draft empty: "Shows Harbour, the sample's stand-in, until you enter a name." Otherwise: "Updates as you type. A name too long for the header is cut with an ellipsis."
- **Errors.** `{saved}` is the stored value. An "until you do" clause says what happens to the store meanwhile.

| Case | Message |
|---|---|
| name empty, never set | "Enter a project name, 1 to 80 characters. Until you do, the name stays open." |
| name empty, previously set | "Enter a project name, 1 to 80 characters. Until you do, {saved} stays saved." |
| name over the limit | "This name is {n} characters; the limit is 80. Shorten it by {over}. The saved name hasn't changed." |
| productType empty | "Enter a product type, 1 to 60 characters, e.g. Clinic booking app." |
| productType over the limit | "This is {n} characters; the limit is 60. Shorten it by {over}. The saved type hasn't changed." |
| notes over the limit | "Notes are {n} characters; the limit is 2000. Shorten them by {over}. The saved notes haven't changed." |

## 6. States

- **Empty** (`?fixture=empty`): opens on identity with the name field focused. All three fields are empty with their placeholders, and the counters read `0 / 80`, `0 / 60`, `0 / 2000`. The rail shows `0 of 3 decided`, Name & type `now`, Platform `next`, Component library `shadcn/ui`. On the platform stop, no plate is selected and "Choose a variant" is disabled. On the library stop, the shadcn panel shows brackets and `Chosen`.
- **Harbour** (`?fixture=harbour&step=profile.identity`): the fields are filled with no autofocus. Counters read `7 / 80` and `14 / 60`, and the rail shows `3 of 3 decided`. Desktop and shadcn each show `Chosen` with brackets.
- **Loading:** plates use the existing `Loading fonts…` and `Font failed: {fonts}` overlays, and Choose is disabled while fonts have failed. Library panels have no loading state. Fields follow the store's drafts rule (section 3), so restored values never overwrite typing.
- **Error:** field errors as in section 5. The invalid-file panel and the save-failed notice stay as built.
- **Snapshot differs** (`?fixture=snapshot-differs`: ui adds Harbour with one stored `resolved.color.light` hex and one `fontSize` value off from a fresh computation):
  - **Where:** a project-level notice at the top of `main`, above the eyebrow, **in every step**, in the same panel style as the invalid-file panel (`--surface`, 1px `--ctl`), with `role="status"`.
  - **Content:** title (13/500) "Stored values differ from the current algorithm: keep or recompute". Body (12px muted): "This file was saved by an earlier version. Keeping the stored values keeps exports byte-identical; recomputing updates them to the current algorithm." Then a mono line: `Differs: color.light 1 value · fontSize 1 value`.
  - **Buttons:** two secondary buttons (44px, 1px `--ctl`, `--surface`; never black, because the stop keeps the one primary): **Keep stored values** and **Recompute now**.
  - **After Keep:** the notice becomes "Kept the stored values. This notice returns when the file is opened again."
  - **After Recompute:** "Recomputed 2 values. [Undo]". Undo restores the previous `resolved` byte-for-byte and brings the notice back. It stays available until the next change.
  - **What never dismisses the notice:** a profile edit (name, type, notes, platform, library) never dismisses it and never touches `resolved`.
  - **A visual decision change** recomputes anyway, so it replaces the notice with "Changing {decision} recomputed every stored value."

## 7. Acceptance criteria (tester)

1. **Null until set:** on `?fixture=empty`, the saved file has `profile.name`, `productType` and `platform` = `null` until each is committed, and `componentLibrary` = `"shadcn"`, shown `Chosen` (PLAN 3a).
2. **AC10:** set Harbour / Clinic booking / Mobile / None, then reload. All four are restored in the fields, the selection and the rail. The same holds after download → open.
3. **`resolved` untouched:** on harbour, editing notes, name, type, platform and library leaves `resolved` in localStorage byte-identical.
4. **Snapshot notice:** `?fixture=snapshot-differs` shows the exact title and both buttons. Editing notes keeps it. Keep leaves `resolved` unchanged. Recompute makes `resolved` equal a fresh `resolve()`, and Undo restores the original bytes and the notice.
5. **Validation:** paste 81 characters into name, then Tab. The error text sits next to the field (`aria-describedby`), the field still holds all 81, and the store is unchanged. Whitespace only gives the empty error. Tabbing through an untouched empty field gives no error. Fixing the value clears the error on input.
6. **AC6 (keyboard only, at 1280 and 390):** type a name, Tab, type a type, Enter → Platform; `2` then Enter → Library; `2` then Enter → step 2 placeholder; `E` → Library; `K` `K` → Identity; `J` from Library → step 2. J/K/1/2/3 typed in a field only insert text.
7. **AC6 (targets):** every input, button, rail row, plate and panel is ≥ 44px tall at 1280 and 390, and every focus state is visible.
8. **AC3 / AC4:** at 390, platform plates and library panels stack and `shoot.mjs` exits 0. Platform plate CSS reads only `--v-*`. Library panels contain no `data-v-root` and no project font.
9. **AC8 (unit level in 3a):** while open, `openDecisions()` lists "Project name", "Product type" and "Platform". `?step=profile.identity` focuses the first open field. This is the way back that 3d links to.
10. **Live name:** the name check updates within 100 ms of a keystroke. The rail header changes only on commit.
11. **Glyph check:** every chrome node in step 1, including `·`, `×` and `…`, renders in Geist or Plex Mono, with no system fallback.

**Shared changes ui needs** (kept small):
- `PlateGrid`: generic id; a per-option `sample` node in place of the hard-coded `SampleCard`; `frame: "plate" | "panel"`; an overridable status line. Chosen-but-unselected handling stays as built.
- `SubDecisionList` and `WizardShell`: generic over stops, plus the flat J/K/E sequence.
- The `snapshot-differs` dev fixture.
