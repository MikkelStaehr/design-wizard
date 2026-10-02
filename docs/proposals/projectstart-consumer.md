# Proposal: ProjectStart consumes Design Wizard's exports

Status: **proposed** (task 3e, 2026-10-02). Text only. The user applies it in the teams repo in a separate session; this repo never edits it.

## Why

Design Wizard v0.1 exports four files per project. Today ProjectStart's agents don't know they exist: design-lead writes Part B by hand, ui types values from DESIGN.md, and tester and reviewer check UX rules from memory. The files are contracts (this repo's `docs/CONTRACTS.md` §2–§4, schema v1), so the agents can read them instead.

| File | Where it goes in the target repo | Contract |
|---|---|---|
| `<slug>.dwproj.json` | `design/<slug>.dwproj.json` | the source; reopen it in Design Wizard to change a decision |
| `DESIGN.md` | merged into the repo's DESIGN.md: its title and `## Product profile` replace the template's, its `# Part B` replaces Part B; Part A stays the template's | CONTRACTS §4 |
| `tokens.json` | `design/tokens.json` | W3C DTCG 2025.10, CONTRACTS §2 |
| `ux-rules.yaml` | `design/ux-rules.yaml` | `schemaVersion: 1`, CONTRACTS §3 |

## The rule, per agent

**design-lead (Mode 0).** When `design/tokens.json` exists, the decided values in DESIGN.md (fonts, type scale, colours and contrast, radius, spacing, density, the CSS block) come from the export and are not rewritten by hand. design-lead fills every item marked `open: design-lead`; search for that text to find them all. Most are whole lines (`> **open: design-lead** – not decided in Design Wizard.`), also inside the decided sections (for example Numerals, Accent usage, Borders vs. shadows, Max content width); some are cells in the shadcn variable table. To change a decided value, reopen `design/<slug>.dwproj.json` in Design Wizard and export again; never edit the exported values in place.

**ui.** Colours, radius, spacing, type scale and line heights come from `design/tokens.json` (or the CSS block in DESIGN.md Part B, which is generated from the same tokens), never typed by hand. With `componentLibrary: "shadcn"` the Part B table maps each role to its shadcn variable. A value that is missing from the tokens is a question for design-lead, not a guess.

**tester.** Every rule in `design/ux-rules.yaml` with an automated `check.kind` becomes a test at each width in `check.viewports`:

| `kind` | Test |
|---|---|
| `min-target-size` | every visible match of `selector` is at least `minPx` × `minPx` |
| `max-count` | visible matches per screen ≤ `max` (0 = none allowed) |
| `contrast` | each match's text against its effective background ≥ `minRatio` (WCAG 2.x) |
| `response-time` | activating a match (click or Enter) changes the screen within `maxMs` |
| `focus-visible` | each match shows an outline or ring ≥ `minOutlinePx` under keyboard focus |

A `must` rule that fails is a FAIL; a `should` rule that fails is reported but doesn't block. tester quotes the rule's `id` in the verdict.

**reviewer.** Answers every `manual` rule's `question` with yes or no and the evidence (file:line or screen). A `no` on a `must` rule is a Must.

**Fallback.** No `design/ux-rules.yaml` or `design/tokens.json` in the repo: the agents work as today. An unknown `schemaVersion` is a stop-and-ask, never a best guess.

## Files to change in the teams repo

- `agents/design-lead.md`, `agents/ui.md`, `agents/tester.md` and `agents/reviewer.md`: the paragraph for that agent above. (Paths as of 2026-10-02; adjust to the repo's layout.)
- The DESIGN.md template: one line under Part B's heading, "If `design/tokens.json` exists, this part is exported by Design Wizard; fill only the `open: design-lead` lines."

## LESSONS.md row

| Date | Lesson | Rule | Where |
|---|---|---|---|
| 2026-10-02 | Design decisions made in Design Wizard were re-typed by hand into DESIGN.md, code and tests, so they could drift from the decision. | Exported design files are contracts: design-lead fills only `open: design-lead` lines, ui reads values from `design/tokens.json`, tester turns every automated rule in `design/ux-rules.yaml` into a test, reviewer answers every `manual` rule. | design-lead, ui, tester, reviewer; DESIGN.md template |
