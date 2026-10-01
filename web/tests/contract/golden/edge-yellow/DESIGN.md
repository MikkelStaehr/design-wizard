# Design system – Harbour

> Part B exported by Design Wizard from `design/harbour.dwproj.json` (project file schema v1). Reopen that file in Design Wizard to change a decision. Part A comes from the ProjectStart template and is not included. UX rules: `ux-rules.yaml` (4 rules).

## Product profile

- **Product type:** Clinic booking
- **Platform:** desktop
- **Notes:** Booking tool for small physiotherapy clinics. Fictional sample project.

**Primary users & context**
> **open: design-lead** – not decided in Design Wizard.

**Locale**
> **open: design-lead** – not decided in Design Wizard.

**References**
> **open: design-lead** – not decided in Design Wizard.

**Pattern packs**
> **open: design-lead** – not decided in Design Wizard.

# Part B – Direction (per project)

## Personality

> **open: design-lead** – not decided in Design Wizard.

## Signature element(s)

> **open: design-lead** – not decided in Design Wizard.

## Type

- **Display:** Sora 600 / 700
- **Text:** Inter 400 / 500 / 600
- **Scale:** xs 11px (0.6875rem) · sm 12px (0.75rem) · base 13px (0.8125rem) · lg 15px (0.9375rem) · xl 20px (1.25rem) · 2xl 25px (1.5625rem) · 3xl 32px (2rem)
- **Line height:** text 1.5 · display 1.2
- **Loading:** Self-host the vendored Fontsource files (`@fontsource/sora`, `@fontsource/inter`; latin subset; SIL OFL 1.1, keep each family's OFL.txt next to its files) with `next/font/local`, exposing `--font-display-face` and `--font-text-face`. Alternative only where Google Fonts is reachable: `next/font/google`.

**Numerals**
> **open: design-lead** – not decided in Design Wizard.

## Colour

- **Brand colour:** #FFFF00 · **Palette:** deep
- Dark theme: not defined in v0.1.

| Role | Hex |
|---|---|
| `bg` | #1A1A14 |
| `surface` | #26261D |
| `border` | #8C8C70 |
| `text` | #F5F5E6 |
| `text-muted` | #BDBDA6 |
| `accent` | #E6E600 |
| `on-accent` | #1A1A00 |
| `positive` | #86EFAC |
| `warning` | #FCD34D |
| `negative` | #FCA5A5 |
| `focus` | #E6E600 |

**Contrast (WCAG 2.x, AA)**

| Pair | Ratio | Minimum | Result |
|---|---|---|---|
| text / bg | 15.88 : 1 | ≥ 4.5 | PASS |
| text / surface | 13.85 : 1 | ≥ 4.5 | PASS |
| text-muted / bg | 9.14 : 1 | ≥ 4.5 | PASS |
| text-muted / surface | 7.98 : 1 | ≥ 4.5 | PASS |
| on-accent / accent | 13.16 : 1 | ≥ 4.5 | PASS |
| accent / bg | 13.05 : 1 | ≥ 4.5 | PASS |
| positive / bg | 12.44 : 1 | ≥ 4.5 | PASS |
| warning / bg | 12.11 : 1 | ≥ 4.5 | PASS |
| negative / bg | 9.20 : 1 | ≥ 4.5 | PASS |
| border / bg | 5.07 : 1 | ≥ 3 | PASS |
| border / surface | 4.42 : 1 | ≥ 3 | PASS |
| focus / bg | 13.05 : 1 | ≥ 3 | PASS |

**shadcn/ui variables**

| shadcn variable | Part B role | Note |
|---|---|---|
| `--background` | `bg` | |
| `--foreground` | `text` | |
| `--card`, `--popover` | `bg` | As in shadcn's defaults, cards sit on the page colour |
| `--card-foreground`, `--popover-foreground` | `text` | |
| `--primary` | `accent` | |
| `--primary-foreground` | `on-accent` | |
| `--secondary`, `--muted` | `surface` | |
| `--secondary-foreground` | `text` | |
| `--muted-foreground` | `text-muted` | |
| `--accent` | `surface` | shadcn's hover/highlight background, not the brand accent |
| `--accent-foreground` | `text` | |
| `--destructive` | `negative` | shadcn v4's destructive button hard-codes white text: open: design-lead |
| `--border`, `--input` | `border` | |
| `--ring` | `focus` | |
| `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring` | `bg`, `text`, `accent`, `on-accent`, `surface`, `text`, `border`, `focus` | |
| `--chart-1` … `--chart-5` | – | open: design-lead (no data-visualisation palette in v0.1) |
| `--positive`, `--warning` | `positive`, `warning` | Not in shadcn; added |
| `--radius` | `radius.base` | |

```css
:root {
  --background: #1A1A14; /* color.bg */
  --foreground: #F5F5E6; /* color.text */
  --card: #1A1A14; /* color.bg */
  --popover: #1A1A14; /* color.bg */
  --card-foreground: #F5F5E6; /* color.text */
  --popover-foreground: #F5F5E6; /* color.text */
  --primary: #E6E600; /* color.accent */
  --primary-foreground: #1A1A00; /* color.on-accent */
  --secondary: #26261D; /* color.surface */
  --muted: #26261D; /* color.surface */
  --secondary-foreground: #F5F5E6; /* color.text */
  --muted-foreground: #BDBDA6; /* color.text-muted */
  --accent: #26261D; /* color.surface */
  --accent-foreground: #F5F5E6; /* color.text */
  --destructive: #FCA5A5; /* color.negative */
  --border: #8C8C70; /* color.border */
  --input: #8C8C70; /* color.border */
  --ring: #E6E600; /* color.focus */
  --sidebar: #1A1A14; /* color.bg */
  --sidebar-foreground: #F5F5E6; /* color.text */
  --sidebar-primary: #E6E600; /* color.accent */
  --sidebar-primary-foreground: #1A1A00; /* color.on-accent */
  --sidebar-accent: #26261D; /* color.surface */
  --sidebar-accent-foreground: #F5F5E6; /* color.text */
  --sidebar-border: #8C8C70; /* color.border */
  --sidebar-ring: #E6E600; /* color.focus */
  --positive: #86EFAC; /* color.positive */
  --warning: #FCD34D; /* color.warning */
  --radius: 8px; /* radius.base */
}
@theme inline {
  --color-positive: var(--positive);
  --color-warning: var(--warning);
  --font-display: var(--font-display-face), sans-serif; /* font.display: Sora */
  --font-sans: var(--font-text-face), sans-serif; /* font.text: Inter */
  --text-xs: 0.6875rem; /* font-size.xs */
  --text-sm: 0.75rem; /* font-size.sm */
  --text-base: 0.8125rem; /* font-size.base */
  --text-lg: 0.9375rem; /* font-size.lg */
  --text-xl: 1.25rem; /* font-size.xl */
  --text-2xl: 1.5625rem; /* font-size.2xl */
  --text-3xl: 2rem; /* font-size.3xl */
  --leading-text: 1.5; /* line-height.text */
  --leading-display: 1.2; /* line-height.display */
  --spacing: 4px; /* space.1; Tailwind multiplies, so p-4 = space.4 */
}
```

**Accent usage**
> **open: design-lead** – not decided in Design Wizard.

## Shape & depth

- **Radius:** 8px

**Borders vs. shadows**
> **open: design-lead** – not decided in Design Wizard.

**Elevation levels**
> **open: design-lead** – not decided in Design Wizard.

## Space & density

- **Spacing base:** 4px
- **Scale:** 1 = 4px · 2 = 8px · 3 = 12px · 4 = 16px · 6 = 24px · 8 = 32px · 12 = 48px · 16 = 64px
- **Density:** compact

**Max content width**
> **open: design-lead** – not decided in Design Wizard.

## Motion

> **open: design-lead** – not decided in Design Wizard.

## Iconography & imagery

> **open: design-lead** – not decided in Design Wizard.

## Project rules

> **open: design-lead** – not decided in Design Wizard.
