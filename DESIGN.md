# Design system – Design Wizard

Contract between `design-lead` (owns this file) and `ui` (builds).

- **Part A: Guardrails.** Fixed. They apply to every project.
- **Part B: Direction.** Chosen per project by design-lead in Mode 0. This is where the product gets its own identity.

---

## Product profile
- **Product type:** Desktop wizard for design and UX decisions (Design Wizard v0.1). Confirmed by the user.
- **What it does:** The user makes a project's design and UX decisions in five steps: 1. Project profile; 2. UX principles picker (about 12 curated laws, each with "when it applies", each choice becomes a checkable rule); 3. Visual system (font pairs, spacing scale, radius, brand colour → palette with contrast check, density); 4. Live preview on a generic sample screen; 5. Export: DESIGN.md (Part B), `tokens.json`, `ux-rules.yaml`. An AI dev team builds and tests against the exported files.
- **Core principle:** every choice is shown as **2–3 live variants side by side**, never as one abstract option, and **every decision can be changed later**.
- **Primary users & context:** A solo developer or small-team lead, at a desk, at the start of a project and again whenever a decision changes.
- **Platform:** Desktop first (1280px), full keyboard flow. Must still work at 390px. See Project rules.
- **Locale:** en-GB UI copy; numbers with a decimal point (contrast ratios such as 4.73 : 1).
- **References the user likes:** Linear (calm, dense, keyboard-first, a command bar, visible shortcut hints) and Notion (everything editable in place). Only these two.
- **Pattern packs:** none. `design/patterns/data-dashboard.md` does not apply: this is a decision tool, not a numbers dashboard.

---

# Part A – Guardrails (fixed)

## UX
- One primary purpose and at most one primary action per screen, and that action is visually dominant.
- Mobile first: design at 390px, then let it grow. *(Overridden for this project, see Project rules.)*
- Every data view has a designed loading, empty, error and (if relevant) stale state. Never a blank area.
- Error messages say what happened and what to do. Undo is preferred over confirmation.

## Accessibility
- [ ] WCAG 2.2 AA contrast in every theme: text ≥ 4.5:1; large text, icons and control borders ≥ 3:1.
- [ ] Colour never carries meaning alone.
- [ ] Semantic HTML (`main`, `nav`, headings in order, `button` vs `a`).
- [ ] Everything works by keyboard, with a visible focus state.
- [ ] Icon-only buttons have `aria-label`. Images have `alt`.
- [ ] Text zoom to 200% doesn't break the layout.
- [ ] `prefers-reduced-motion` respected. All motion has a reduced alternative.

## Interaction
- Touch targets ≥ 44×44px. Nothing essential on hover only.
- Feedback < 100ms. Progress shown for anything > 1s. Skeletons for content areas.
- Forms: visible labels, validate on blur, the error goes next to the field, correct `type`/`inputmode`/`autocomplete`, and input is kept on error.

## Technical
- Tokens only: no magic values in components.
- Fonts are self-hosted (e.g. `next/font`), max 2 families.
- UI library: shadcn/ui + Tailwind for Next.js (assumed template default; stack not yet confirmed by tech-lead/architect), **always themed by Part B. Never the default look.**

---

# Part B – Direction (per project)

**Direction: Grading Suite, light by default.** Reference sample: `design/directions/grading-suite-geist.html` (step 3, Brand colour → palette). Font choice record: `design/directions/font-compare.html`. The sample is a frozen record: it also shows diff pins (planned for v0.2) and an "Apply fix" box (cut from v0.1). This file is what counts where the two differ.

## Personality
**Neutral, exact, colour-critical.** It should feel like a colour-grading suite: a quiet grey room where the only hue on screen belongs to the user's project, so every judgement about colour, type and radius is made without the tool influencing it.

## Signature element(s)
1. **Viewing plates with crop marks.** Every variant sits on a `--plate` (#CCCCCC) surround, 18px padding, 0 radius, with four 12×12px L-shaped crop marks (1px `--muted`) inset 6px from the corners. When a variant is selected the marks become 16×16px, 2px `--accent` (black) brackets. Chrome never draws inside the 18px margin's inner edge.

### Planned v0.2 (not a current signature element, not built in v0.1)

Plate samples already carry `data-v-part` attributes, so pins can be anchored later without changing the samples.

- **Diff pins.** 18px circles, fill #FFFFFF, 1.5px `--accent` ring, letter in Plex Mono 500 10px. They straddle the plate's left edge (`left: -9px`) on the selected variant, vertically anchored to the element that differs (compute from the element's position; never fixed px). Never over specimen content, at any width. A legend (pin + **bold** name + one plain sentence) sits under the plates.

## Type
- **Text (chrome sans): Geist** 400 / 500 / 600. Body 13px/1.5, small 12px/1.5, step and item titles 13px/500, h1 25px/600, line-height 1.2, letter-spacing −0.025em. Primary button 13px/600.
- **Mono: IBM Plex Mono** 400 / 500. Labels 11px/500 uppercase, letter-spacing +0.08em, colour `--muted`. Values, ratios, hex codes, contrast tables 11px/400 with `font-variant-numeric: tabular-nums`. Shortcut keys (`kbd`) 11px/500.
- **Scale:** 11 / 12 / 13 / 25. No other sizes in chrome.
- **Rule:** mono = data, labels and keys; sans = prose and titles. Never swap.
- Self-hosted woff2 (latin subset) via `next/font/local`; licences in `design/directions/fonts/LICENSE.md` travel with the files.

## Colour
Light is the default and the only theme built. Every chrome grey is R=G=B. Ratios are WCAG 2.x.

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--bg` | #E6E6E6 | app background | – |
| `--surface` | #F2F2F2 | inputs, kbd, command button, current sub-decision | – |
| `--plate` | #CCCCCC | viewing plates behind variants and preview | – |
| `--line` | #CCCCCC | decorative hairlines and dividers only (not control borders) | – |
| `--ctl` | #6B6B6B | control borders (inputs, buttons, kbd) | 4.27 on bg, 4.76 on surface |
| `--text` | #141414 | text | 14.76 on bg, 16.46 on surface, 11.47 on plate |
| `--text-muted` | #4F4F4F | secondary text, labels, crop marks | 6.56 on bg, 7.32 on surface, 5.10 on plate |
| `--accent` | #000000 | primary button fill, selection brackets, current-item rule | 16.83 on bg, 13.08 on plate |
| `--on-accent` | #FFFFFF | text and kbd on accent | 21.00 on accent |
| `--focus` | #000000 | 2px solid outline, 2px offset (3px on plates) | 16.83 on bg |
| `--positive` / `--warning` / `--negative` | – | none: chrome status is never a hue (see contrast tags) | – |

- **Accent usage:** black only, for focus, the selected variant's brackets, the primary action and the inverted FAIL tag. The chrome never uses a hue. Hue on screen comes only from the user's project (variants, preview, the brand-colour swatch).
- **Dark theme: later option, not built.** bg #181818, surface #222222, plate #3A3A3A, ctl #8C8C8C, text #EDEDED, muted #A6A6A6, accent and focus #FFFFFF, on-accent #141414. Ratios: text 15.17, muted 7.29, focus 17.76, ctl 5.28 on bg, muted on plate 4.67.

### Contrast check presentation
Each row reads `<pair name>  <ratio, 2 decimals, tabular>  <tag>`, set in Plex Mono 11px. PASS is a 44px-wide tag with `--muted` text and a 1px `--line` inset outline. FAIL is the same tag inverted (`--accent` fill, `--on-accent` text, 500). Never colour alone, never ✓/✕ glyphs. v0.1 offers only palettes where every pair passes, so FAIL should not appear in the palette step; the style exists for any check that fails. There is no fix box and no "Apply fix" in v0.1.

### shadcn/ui mapping (never ship the default theme)
`--background` = `--bg` · `--foreground` = `--text` · `--card` / `--popover` = `--surface` · `--card-foreground` / `--popover-foreground` = `--text` · `--primary` = #000000 · `--primary-foreground` = #FFFFFF · `--secondary` = `--surface` · `--secondary-foreground` = `--text` · `--muted` = `--surface` · `--muted-foreground` = `--text-muted` · `--accent` (hover/highlight bg) = #DADADA with `--accent-foreground` = `--text` (13.18:1; muted on it 5.86:1) · `--destructive` = #000000 (destructive actions are told apart by wording and undo, not colour) · `--border` = `--line` · `--input` = `--ctl` · `--ring` = #000000 · `--radius` = 2px. Remove all component shadows (`shadow-none`); popovers, dialogs and the command palette use a 1px `--ctl` border instead.

## Shape & depth
- Radius: 2px for every chrome control; plates, panels and the rail 0. Variants keep their own radius.
- Borders vs. shadows: 1px hairlines only. No shadows anywhere in the chrome.
- Elevation: one level, and only for overlays (command palette, dialogs): `--surface` + 1px `--ctl` border. The plates are the only "depth", and they are flat grey.

## Space & density
- Spacing scale: 4-pt; 4, 8, 12, 16, 20, 24, 32.
- Density: compact. Every clickable or J/K-reachable row is at least 44px. Read-only rows (contrast rows, shortcut legend) may be shorter.
- Layout at ≥1101px: rail 232px | main (fluid, 24px padding) | preview 340px. The rail is 232px rather than 224px so that the 44px sub-decision rows fit. At 761–1100px: rail 200px + main, with the preview below main. At ≤760px: single column, a top bar (Steps n/5 button, Ctrl K button), variants stacked, rail and shortcut legend hidden, primary button full width.
- Variants: 3 equal columns, 20px gap. Reading width of prose ≤ 60ch.

## Motion
- Character: 120ms opacity cross-fades, ease-out. Nothing slides or bounces; only what the user changed moves.
- Where: preview update on variant change, bracket swap on selection, sub-decision change. Focus is instant.
- Reduced motion: `prefers-reduced-motion: reduce` sets all transitions to none (instant swap).

## Iconography & imagery
- No icon font. Inline SVG only, black, 1.5–2.1px stroke, square caps, sized in `em` to match the adjacent text weight. Arrows (→) are inline SVG with a visually hidden text label ("to").
- No illustration or photography in the chrome.

---

## Project rules
- **Platform override (user decision):** Desktop first: 1280px, full keyboard flow, Linear-like density. Design decisions are desk work. It must still work at 390px, but density is tuned for desktop. This overrides the Part A guardrail "Mobile first: design at 390px". Design and review at 1280px first, then verify 390px. All other guardrails, including 44px touch targets, still apply.
- **Scope:** Channels and bots belong to the later W.A.A.N. control room, not this product. No feeds, channels or bot posts in Design Wizard.
- **Variants are live, never abstract:** every decision is presented as 2–3 variants side by side, each rendered as real sample UI in its own tokens (not a swatch or a font name alone). The live preview reflects the focused variant plus every earlier decision.
- **Chrome never contaminates variants:** the wizard's own fonts, accent and radii never appear inside a variant frame, and a variant's tokens never leak into the chrome. The chosen Direction defines exactly how that boundary is drawn.
- **Every decision is editable later:** earlier steps and sub-decisions stay visible with their current value and can be edited in place (`E`) without losing later decisions.
- **Keyboard flow:** `1`/`2`/`3` pick a variant, `J`/`K` next/previous decision, `E` edit an earlier step, `Enter` choose, `⌘K`/`Ctrl+K` command bar. Shortcut hints are always visible on desktop, never on hover only.
- **Contrast check is a product feature:** each palette variant shows its ratios as numbers with the words PASS/FAIL (not colour alone). Only palettes where every checked pair passes AA are offered. "Apply fix" is cut from v0.1.
- **Variants never inherit chrome tokens.** Variant and preview content is styled only from the user's project tokens, scoped to the variant container; no chrome CSS variable, font or radius may cascade into it.
- **Font limit scope:** "max 2 families" applies to the chrome only (Geist + IBM Plex Mono), not to variant content, which renders whatever font pair the user picks.
- **Glyph rule:** never use characters outside the shipped font subsets. Arrows are inline SVG with a visually hidden text label. Ticks and crosses are words (PASS/FAIL) or CSS shapes. Verify with a font check that every chrome node renders in web fonts only.
- **Platform-aware shortcut labels:** "Ctrl" on Windows and Linux; "⌘" only on macOS, and only if the glyph is covered by the shipped font. Key names are words ("Enter", "Ctrl").
- **Shortcut legend lives in the rail footer** on desktop, always visible, never hover-only.
- **44px rows:** any row that can be clicked or reached with J/K is at least 44px tall.
