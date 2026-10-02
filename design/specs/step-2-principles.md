# Spec: Step 2, UX principles (slice 3b)

Owner: design-lead. Builds on `components/plate/*`, the step 1 patterns (`design/specs/step-1-profile.md`) and the approved cards in `design/content-review/`. CONTRACTS wins on data; this file wins on look and copy.

## 1. Question, primary action, stops

**"Which UX laws should {whose} team build and be tested against?"** `{whose}` = "Harbour's" or "your project's".
**Primary action: Continue with {n} rules** (black, `Enter` kbd inside, full width at ≤760px) → the next stop in order, `visual.fontPair`.

**Step 2 stays one stop, `principles`.** The decision is one array, so per-law or per-group stops would all flip to "decided" at the first tick, and the rail would claim the user decided stops they never saw. Nine 44px rail rows would also bury steps 3–5. **`domain/decisions.ts` changes:** none for stops. Optional: rename the stop label `"UX principles"` → `"Laws"`, so the rail sub-row doesn't repeat its step title. `DECISIONS` keeps `"UX principles"` (AC8 lists it by that name).

## 2. Variants: laws are not variants

Laws are independent, additive yes/no choices. They are not alternatives to each other, so 2–3 plates of laws would be fake. **Presets (minimal / recommended / strict) are rejected:**
- A plate would hold a list of rules, not sample UI (Project rules: "not a swatch or a name alone").
- "Strict" would invent parameter values nobody approved.
- Harbour's 4 laws match no preset, so the page would mostly read "Custom".

**The honest side-by-side is each law's DO / DON'T pair**, as approved in the content review. These are two live, non-interactive mini plates per card, showing the pass and the fail of the rule.
- **Tokens:** the plates always render in fixed neutral tokens (`PREVIEW_NEUTRALS`, font pair `inter-solo`, white bg), never the project's. Their meta lines state measured values ("#9A9A9A on white, 2.82:1", "28px tall"), which must stay true for every project.
- **Demo-only values** (the failing grey, the 28px button, the missing ring): set them as `--v-demo-*` inline on the sample root from one constant in `components/samples/law-demos.tsx`, so sample CSS still reads only `--v-*` (AC4).
- **No focus stops:** each specimen has `inert` and `aria-hidden="true"`. The figcaption plus the meta line are the text alternative.
- **Response-limits is static:** DO shows "Saving…" with the meta line "Visible after 80 ms". DON'T shows an unchanged button with "Nothing visible for 1200 ms".
- **Fixed box:** the sample is exactly 164px tall (`height`, not `min-height`), so AC5 holds.

## 3. Layout

**Lead** (≤60ch): "Pick the laws {whose} team will build and test against. Each becomes one rule in ux-rules.yaml; you can change them later."
- The eyebrow is `Step 02 · UX principles` and the h1 is `UX principles`, as in the placeholder.

**Two sections, in content order** (the catalogue is already ordered this way). Grouping is by proximity: 32px between sections, 12px between cards.
- `h2` (13/500) **Measured by tester**, mono `5 LAWS`, then 12px muted: "Tester measures each at 390 and 1280."
- `h2` **Answered by reviewer**, mono `4 LAWS`, then: "Reviewer answers each question yes or no on the running app."

**Card** (`<li>`, `--surface`, 1px `--line`, radius 0, padding 16px):
- **Selected:** `box-shadow: inset 3px 0 0 var(--accent)`, the current-item rule. It causes no shift.
- **Container query on the list:**
  - At `@container ≥ 640px` (main at 1280 = 660px), the card is `grid-template-columns: minmax(0,1fr) 312px`, gap 20px. Text sits on the left; on the right is the DO/DON'T pair, 2 × 150px, gap 12px.
  - Below 640px (≤1279 with the preview column, and 390), it is one column: text, then the pair 2-up, 12px above it.
- **Header row** (a `<label>`, min-height 44px, the whole row toggles):
  - a native checkbox drawn as an 18px box, 1px `--ctl`, radius 2px;
  - when checked: `--accent` fill and a CSS-border check in `--on-accent` (no ✓ glyph);
  - the law name (13/600);
  - on the right, the severity tag `MUST` (strong) or `SHOULD`, in the content-review tag style.
  - Focus: a 2px `--focus` outline on the header row via `:has(:focus-visible)`.
- **Body**, top to bottom:
  - the summary (13, `--text`, linked by `aria-describedby`);
  - `WHEN IT APPLIES` and its sentence;
  - **[selected, with params: the param row]**;
  - the rule label: `RULE IF ADDED` while unselected, `RULE, AS EXPORTED` when selected. Next to it, the rule id in mono 11 muted (`fitts.target-size`). Then the sentence (13, param values at 600);
  - `CHECK`, which is either:
    - mono `min-target-size · 390, 1280`, or
    - for manual laws, "Reviewer answers yes or no:" plus the question in `--text`.
  - Only the param row appears on select, so selecting changes only the height of that card.

**Param row** (one per param), with the step 1 field pattern:
- A 2px transparent left border, 10px padding-left; it turns `--accent` on error.
- **Label:** `param.label` as a mono uppercase label (`MINIMUM TARGET SIZE`).
- **Control:** `input type="text" inputmode="decimal"`, 96px wide, 44px tall, in the step 1 style.
- **Next to the control:** the unit suffix (`px`, `ms`, `:1`, none for count) in mono 11 muted, then the range in mono muted (`24–64px`, built with `formatParam`).
- The error goes 4px below, in 12px.

**Sticky action bar** at the bottom of `main`, at all widths:
- `--bg`, 1px `--line` top, 12px padding.
- **Left:** the mono count line (11/500, `--text`, tabular), with the status sentence (12px muted) under it.
- **Right:** the secondary button (only when shown), then the primary.
- At ≤760px the bar stacks, with the primary full width.
- The scroll container gets `scroll-padding-bottom` equal to the bar height, so focus is never hidden under the bar (WCAG 2.4.11).

## 4. Choosing, params, the rule sentence

- **Every change commits immediately** (Notion-style in-place editing), and the autosave is the status.
- **Ticking a law** stores it with its params. The value is the suggested one, or the value last used for that law in this session (a session memory in view state).
- **Unticking a law** removes it. The status reads "Removed {name}. Tick it again to restore {value}." The session memory makes re-ticking a lossless undo.
- **Unticking the last law sets `principles` back to `null` (open), never `[]`.** `[]` only ever comes from **Decide on no rules** (section 5).
- **Params:**
  - **While typing:** on every input, parse the draft. If it is valid, commit it at once. If it is invalid, leave the store unchanged and show nothing until blur.
  - **On blur:** validate and show any error next to the field. The field keeps the typed text and the store keeps the last valid value.
  - **After an error shows,** re-validate on each input, so the error clears as soon as the value is valid.
  - **Enter in a field** validates. If the value is valid, focus returns to that law's checkbox; if not, it stays in the field. **Esc** does the same.
- **The rule sentence is always rendered from the stored params,** never from the draft. Build it from `law.rule.template` with `formatParam` and bold each value.
  - Its `textContent` must equal `renderRule(law, params).rule`, so on screen it reads exactly what the export writes.
  - Unselected cards render the same way with the suggested or remembered value.
- **Parsing (domain change needed):** add `parseParamInput(raw, param)` next to `parseNumberInput`.
  - It accepts an optional suffix per unit: `px`, `ms`, `:1`, none for count. It also accepts comma decimals.
  - Its messages format the range with `formatParam`: "Enter a whole number from 24px to 64px."
  - Today `parseNumberInput` would print "4.5–7 :1".
  - The rule "0 is valid only where min ≤ 0" falls out of the range check. No current law has min ≤ 0, so 0 is always an error here.

## 5. Zero laws vs open

| State | Checkboxes | Count line | Status sentence | Buttons |
|---|---|---|---|---|
| **Open** (`null`) | none ticked | `NO RULES YET` | "Nothing chosen yet. Tick the laws to check against, or decide on none." | secondary **Decide on no rules** + primary **Choose at least one law**, `aria-disabled`. Activating the primary moves focus to the first checkbox and repeats the status sentence |
| **Laws chosen** | n ticked | `4 RULES · 3 MUST · 1 SHOULD` (`1 RULE`; `4 RULES · ALL MUST`) | "Each change saves as you make it. You can change them later." | primary **Continue with 4 rules** (`1 rule`) |
| **Zero laws** (`[]`) | none ticked | `NO RULES · DECIDED` | "Decided: no UX rules. ux-rules.yaml exports an empty rules list." Right after the press it adds **Undo**, which goes back to `null` and stays until the next change | primary **Continue with no rules** |

Ticking any law from the zero-laws state replaces `[]` with that law. The rail sub-row value is `open` / `now` / `next` (as in step 1), `4 rules`, or `No rules`. The step header reads `{0|1} of 1 decided`.

## 6. Keyboard

- **On arrival,** focus goes to the h1 (`tabindex=-1`).
- **Tab order:** h1 → law 1 checkbox → its param field(s), if ticked → law 2 checkbox → … → bar buttons.
- **↓ / ↑ on a checkbox** move to the next or previous law's checkbox, skipping params. They do not wrap.
- **Space** toggles the focused law. When a law with params is ticked, focus stays on the checkbox; Tab reaches the field.
- **Enter** is not a toggle. Outside a field, it is the primary action, exactly as the kbd in the button promises, so one key never means two things on one screen. In a field, see section 4.
- **Primary with a param error showing:** the step doesn't move, and focus goes to the first invalid field (as in step 1).
- **J/K** walk the flat stop sequence: K → `profile.library`, J → `visual.fontPair`. They never act inside a field (`ownsKey`). Leaving drops invalid drafts; the store already holds valid values.
- **E** goes to the nearest decided stop before this one (always `profile.library`).
- **1/2/3** do nothing here. The rail shortcut legend shows `Space  Add or remove law` in place of `1 2 3  Pick variant` while on this stop.

## 7. States

- **Open** (`?fixture=empty&step=principles`): the open row of section 5. The rail shows `now`. All 18 demo plates render.
- **Harbour** (`?fixture=harbour&step=principles`): fitts 44, hick 1, wcag-contrast 4.5 and peak-end are ticked, with fields reading `44`, `1`, `4.5`. The count is `4 RULES · 3 MUST · 1 SHOULD`.
- **Zero laws** (new dev fixture `?fixture=zero-laws`: Harbour with `principles: []`): the zero-laws row of section 5.
- **Param error:** for example, type `12` in fitts, then Tab. The message reads "Enter a whole number from 24px to 64px. You entered 12. The rule still says 44px." The field keeps `12` and the left border is black. The sentence and the store stay at 44px. The bar status adds: "1 field has an error; its rule keeps the saved value." `hick` = `0` gives "…from 1 to 3. You entered 0. The rule still says 1."
- **Manual law** (e.g. `recognition-recall` ticked): there is no param row. The rule label reads `RULE, AS EXPORTED`. CHECK shows "Reviewer answers yes or no:" plus the full question.
- **Loading:** demo plates use the existing `Loading fonts…` overlay inside the fixed box. **Font failed:** `Font failed: Inter`; the law checkbox stays enabled, because the decision is about the law, not the font.
- **Invalid file / unknown law id:** the parser's invalid-file panel, as built. **Snapshot differs:** the notice as built in step 1.

## 8. Acceptance criteria (tester)

1. **Null until decided (3b):** on `empty`, `principles` is `null` in the saved file until a law is ticked or **Decide on no rules** is pressed. Ticking one law then unticking it returns `null`, never `[]`.
2. **Sentence = export (3b):** for each ticked law on harbour, and after changing fitts to `48px`, `hick` to `2` and contrast to `5,5` (comma decimal → `5.5:1`), the card's rule `textContent` equals that rule's `rule:` line in the downloaded `ux-rules.yaml`.
3. **Bad input (3b):** typing `12`, `abc`, an empty value or `0` (hick), then Tab, shows the error under that field, linked by `aria-describedby` with `aria-invalid`. The field keeps the text, and the store and sentence keep the last valid value. Valid input clears the error on input.
4. **Zero laws (C2, AC8):** **Decide on no rules** writes `principles: []`. Export is then not blocked by step 2, and `ux-rules.yaml` has `rules: []`. With `null`, export lists "UX principles" as open. Undo returns to `null`.
5. **AC10:** set harbour's laws with fitts at 48, then reload and download → open. The ticks, field values, sentences, count and rail are restored, and the exports are byte-identical. The `zero-laws` fixture reloads as `[]`, not `null`.
6. **AC6, keyboard only, at 1280 and 390:** from `profile.library`, J → step 2 (h1 focused); Tab, Space ticks fitts; Tab, type `48`, Enter → back on the checkbox; ↓ ↓ Space ticks wcag-contrast; Enter → `visual.fontPair`; K → back to step 2; E → `profile.library`. J/K/Space typed in a field only insert text.
7. **AC6, targets:** every header row, checkbox row, field and button is ≥ 44px tall at both widths. Every focus state is visible and never hidden under the sticky bar.
8. **AC4 / AC5:** demo plates contain no chrome variables (the leak test covers them). Each demo plate's bounding box is identical before and after Inter loads. Inter returning 404 shows `Font failed: Inter`, and the checkbox still toggles.
9. **No overflow:** at 390, cards are one column with the pair 2-up, and `shoot.mjs` exits 0. Note: AC3's "3 plates side by side" does not apply to step 2 (section 2).
10. **Glyph check:** every chrome node, including `·`, `–` and `…`, renders in Geist or Plex Mono, and the check mark is a CSS shape.

**Changes outside ui's components** (the main session owns these):
- (a) `parseParamInput` in `domain/parse-input.ts` (section 4).
- (b) Optional: the STOPS label → `"Laws"`.
- (c) Store: a `principles` change should update only `resolved.rules`, not recompute palette or scales. Otherwise a param tweak wipes a kept snapshot (step 1, "Snapshot differs").
- (d) The `zero-laws` dev fixture.
