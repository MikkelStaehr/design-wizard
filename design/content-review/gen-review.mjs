// Renders design/content-review/index.html from laws.json, fonts.json, font-pairs.json.
import { readFileSync, writeFileSync } from "node:fs";
const dir = "C:/dev/waan/design-wizard/design/content-review/";
const laws = JSON.parse(readFileSync(dir + "laws.json", "utf8"));
const fonts = JSON.parse(readFileSync(dir + "fonts.json", "utf8"));
const pairs = JSON.parse(readFileSync(dir + "font-pairs.json", "utf8"));
const F = new Map(fonts.map((f) => [f.id, f]));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fmt = (v, unit) => {
  const n = String(Math.round(v * 100) / 100);
  return unit === "px" ? `${n}px` : unit === "ms" ? `${n} ms` : unit === "ratio" ? `${n}:1` : n;
};
const ruleHtml = (law) =>
  esc(law.rule.template).replace(/\{(\w+)\}/g, (_, k) => {
    const p = law.params.find((x) => x.key === k);
    return `<b>${esc(fmt(p.suggested, p.unit))}</b>`;
  });

const SEED = new Set(["fitts", "hick", "wcag-contrast", "peak-end"]);
const CUT = {
  "goal-gradient": [1, "Narrow: only multi-step flows, and peak-end already covers how flows end."],
  "von-restorff": [2, "Largely covered by wcag-contrast plus the Part A guardrail that colour never carries meaning alone."],
  consistency: [3, "A shared layout component gives this almost for free; it rarely fails in practice."],
};
const CHANGED = {
  hick: "Seed change: range 1 to 3 (was 0 to 5). Zero primary actions is not a useful screen-wide rule.",
  "wcag-contrast": "Seed change: minimum 4.5 (was 3). Body text below 4.5:1 fails WCAG AA.",
};
const MEASURE = {
  "min-target-size": "Tester measures the box of every visible control at each viewport.",
  "max-count": "Tester counts the visible matches on each screen.",
  contrast: "Tester computes each text colour against its effective background.",
  "response-time": "Tester clicks each match and times the first visual change.",
  "focus-visible": "Tester tabs to each match and measures its outline or ring.",
};

// Tiny live do / don't samples, neutral sample UI (Inter, white, near-black).
const icoWarn = `<svg class="s-ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 15 14H1z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 6v4M8 11.6v.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>`;
const DEMO = {
  fitts: [
    `<div class="s-row"><button class="s-btn s-sec" style="height:44px;min-width:44px">Edit</button><button class="s-btn s-sec" style="height:44px;min-width:44px">Move</button></div><p class="s-meta">44px tall</p>`,
    `<div class="s-row"><button class="s-btn s-sec s-tiny" style="height:28px">Edit</button><button class="s-btn s-sec s-tiny" style="height:28px">Move</button></div><p class="s-meta">28px tall</p>`,
  ],
  hick: [
    `<p class="s-h">Confirm booking</p><button class="s-btn s-pri s-full">Confirm</button><button class="s-btn s-link s-full">Back</button>`,
    `<p class="s-h">Confirm booking</p><div class="s-grid2"><button class="s-btn s-pri">Confirm</button><button class="s-btn s-pri">Save</button><button class="s-btn s-pri">Share</button><button class="s-btn s-pri">Print</button></div>`,
  ],
  "wcag-contrast": [
    `<p class="s-p" style="color:#5E5E5E">Free cancellation until 24 hours before.</p><p class="s-meta">#5E5E5E on white, 6.49:1</p>`,
    `<p class="s-p" style="color:#9A9A9A">Free cancellation until 24 hours before.</p><p class="s-meta">#9A9A9A on white, 2.82:1</p>`,
  ],
  "wcag-focus-visible": [
    `<label class="s-lbl">Phone</label><div class="s-in s-focus-do">20 12 34</div><p class="s-meta">Focused: 2px ring</p>`,
    `<label class="s-lbl">Phone</label><div class="s-in s-focus-dont">20 12 34</div><p class="s-meta">Focused: no ring</p>`,
  ],
  "response-limits": [
    `<button class="s-btn s-pri s-full" data-delay="0">Save</button><p class="s-meta" aria-live="polite" data-out>Click to try</p>`,
    `<button class="s-btn s-pri s-full" data-delay="1200">Save</button><p class="s-meta" aria-live="polite" data-out>Click to try</p>`,
  ],
  "recognition-recall": [
    `<p class="s-kick">Step 3 of 3</p><p class="s-h">Confirm</p><p class="s-sum">Tue 14 Oct, 10:30<br>Dr Lind, check-up</p><button class="s-btn s-pri s-full">Confirm</button>`,
    `<p class="s-kick">Step 3 of 3</p><p class="s-h">Confirm</p><p class="s-p">Are your details correct?</p><button class="s-btn s-pri s-full">Confirm</button>`,
  ],
  consistency: [
    `<div class="wf"><i class="wf-nav"></i><i class="wf-l"></i><i class="wf-l s"></i></div><div class="wf"><i class="wf-nav"></i><i class="wf-l"></i><i class="wf-l s"></i></div><p class="s-meta">Nav on top on both screens</p>`,
    `<div class="wf"><i class="wf-nav"></i><i class="wf-l"></i><i class="wf-l s"></i></div><div class="wf"><i class="wf-l"></i><i class="wf-l s"></i><i class="wf-nav"></i></div><p class="s-meta">Nav moves on screen 2</p>`,
  ],
  proximity: [
    `<div class="s-dl" style="--in:2px;--out:14px"><span>Name</span><b>Mia Lind</b><span>Phone</span><b>20 12 34 56</b><span class="g">Clinic</span><b>Harbour</b><span>Time</span><b>10:30</b></div>`,
    `<div class="s-dl" style="--in:8px;--out:8px"><span>Name</span><b>Mia Lind</b><span>Phone</span><b>20 12 34 56</b><span class="g">Clinic</span><b>Harbour</b><span>Time</span><b>10:30</b></div>`,
  ],
  "von-restorff": [
    `<ul class="s-list"><li><span>Inv. 1042</span><span>Paid</span></li><li class="s-flag"><span>Inv. 1043</span><span>${icoWarn}<b>Overdue</b></span></li><li><span>Inv. 1044</span><span>Paid</span></li></ul>`,
    `<ul class="s-list"><li><span>Inv. 1042</span><span>12 Oct</span></li><li><span>Inv. 1043</span><span style="color:#B42318">2 Oct</span></li><li><span>Inv. 1044</span><span>14 Oct</span></li></ul>`,
  ],
  "error-recovery": [
    `<label class="s-lbl">Phone</label><div class="s-in s-err"></div><p class="s-errt">Enter a phone number, for example 20 12 34 56.</p>`,
    `<label class="s-lbl">Phone</label><div class="s-in s-err"></div><p class="s-errt">Invalid input.</p>`,
  ],
  "goal-gradient": [
    `<p class="s-kick">Step 2 of 4</p><div class="s-steps"><i class="on"></i><i class="on"></i><i></i><i></i></div><p class="s-h">Choose a time</p><p class="s-p">10:30 · 11:00 · 13:15</p>`,
    `<p class="s-h">Choose a time</p><p class="s-p">10:30 · 11:00 · 13:15</p>`,
  ],
  "peak-end": [
    `<p class="s-h">You are booked</p><p class="s-p">Tue 14 Oct, 10:30 with Dr Lind.</p><button class="s-btn s-pri s-full">Add to calendar</button>`,
    `<p class="s-h">Success!</p><p class="s-p">&nbsp;</p><button class="s-btn s-sec s-full">OK</button>`,
  ],
};

const lawCard = (law) => {
  const c = law.rule.check;
  const cut = CUT[law.id];
  const params = law.params
    .map((p) => `<span class="mono">${esc(p.key)} ${esc(fmt(p.suggested, p.unit))}</span> <span class="mono mut rng">range ${esc(fmt(p.min, p.unit))} to ${esc(fmt(p.max, p.unit))}</span>`)
    .join("");
  const measure = c.kind === "manual" ? `Reviewer answers yes or no: <span class="q">${esc(c.question)}</span>` : esc(MEASURE[c.kind]);
  const [doH, dontH] = DEMO[law.id];
  return `<article class="card law${cut ? " is-cut" : ""}" id="law-${law.id}">
  <div class="card-hd"><code class="id">${esc(law.id)}</code><span class="tags"><span class="tag${law.rule.severity === "must" ? " strong" : ""}">${law.rule.severity.toUpperCase()}</span>${SEED.has(law.id) ? `<span class="tag">SEED</span>` : ""}${cut ? `<span class="tag inv">CUT FIRST ${cut[0]}</span>` : ""}</span></div>
  <h3>${esc(law.name)}</h3>
  <p class="sum">${esc(law.summary)}</p>
  <dl class="kv">
    <dt>When it applies</dt><dd>${esc(law.when)}</dd>
    <dt>Rule, as exported</dt><dd class="rule">${ruleHtml(law)}</dd>
    <dt>Check</dt><dd><span class="mono">${esc(c.kind)}</span>${params ? `<br>${params}` : ""}<br><span class="measure">${measure}</span></dd>
  </dl>
  ${CHANGED[law.id] ? `<p class="note">${esc(CHANGED[law.id])}</p>` : ""}
  ${cut ? `<p class="note"><b>Why cut first:</b> ${esc(cut[1])}</p>` : ""}
  <div class="dd">
    <figure><figcaption>DO</figcaption><div class="plate mini"><span class="cm"></span><div class="smp">${doH}</div></div></figure>
    <figure><figcaption>DON’T</figcaption><div class="plate mini"><span class="cm"></span><div class="smp">${dontH}</div></div></figure>
  </div>
</article>`;
};

const weights = (f) => f.files.map((x) => x.weight);
const nearest = (ws, w) => ws.reduce((a, b) => (Math.abs(b - w) < Math.abs(a - w) ? b : a));
const fam = (f) => `"${f.family}",${f.generic}`;
const PERSONA = {
  inter: "Neutral grotesk. The safe default for dense UI.",
  sora: "Wide geometric. Confident headings.",
  "open-sans": "Humanist. Friendly, familiar, very readable.",
  fraunces: "Soft serif with character. Warm headings.",
  "space-grotesk": "Grotesk with quirky details. Technical headings.",
  manrope: "Modern grotesk with open shapes. Works alone.",
  "atkinson-hyperlegible-next": "Legibility first. Letters that are hard to confuse.",
  barlow: "Road-sign grotesk. Sturdy, practical headings.",
};
const fontCard = (f) => {
  const ws = weights(f);
  const h = Math.max(...ws), body = nearest(ws, 400), lbl = nearest(ws, 500), btn = nearest(ws, 600);
  const only = !f.roles.includes("text") ? `<p class="note">Display only: body lines fall back to ${Math.min(...ws)}, the lightest weight shipped.</p>` : "";
  return `<article class="fcell" id="font-${f.id}">
  <div class="plate"><span class="cm"></span>
    <div class="bk" style="font-family:${esc(fam(f))}">
      <p class="bk-h" style="font-weight:${h}">Book a check-up</p>
      <p class="bk-p" style="font-weight:${body}">Harbour Clinic, Dr Lind. 30 minutes, Tue 14 Oct at 10:30.</p>
      <p class="bk-l" style="font-weight:${lbl}">Phone number</p>
      <div class="bk-in" style="font-weight:${body}">20 12 34 56</div>
      <div class="bk-b" style="font-weight:${btn}">Confirm booking</div>
      <p class="bk-m" style="font-weight:${body}">Free cancellation until 24 hours before.</p>
    </div>
  </div>
  <div class="cap"><code class="id">${esc(f.id)}</code><h3>${esc(f.family)}</h3>
    <p class="mono">${ws.join(" ")} · ${f.roles.join(" / ")} · ${f.generic}</p>
    <p class="sm">${esc(PERSONA[f.id])}</p>${only}</div>
</article>`;
};

const pairCell = (p) => {
  const d = F.get(p.display.font), t = F.get(p.text.font);
  const dw = p.display.weights, tw = p.text.weights;
  const H = Math.max(...dw), body = Math.min(...tw), lbl = nearest(tw, 500), btn = Math.max(...tw);
  const D = `font-family:${esc(fam(d))}`, T = `font-family:${esc(fam(t))}`;
  return `<article class="fcell" id="pair-${p.id}">
  <div class="plate"><span class="cm"></span>
    <div class="scr">
      <div class="scr-bar"><span style="${D};font-weight:${H}">Harbour</span><span style="${T};font-weight:${lbl}">Today · Bookings</span></div>
      <div class="scr-body">
        <p class="scr-h" style="${D};font-weight:${H}">Your next visit</p>
        <p class="scr-p" style="${T};font-weight:${body}">Dental check-up with Dr Lind at Harbour Clinic. Bring your health card.</p>
        <p class="scr-sh" style="${D};font-weight:${Math.min(...dw)}">Details</p>
        <div class="scr-row"><span style="${T};font-weight:${lbl}">When</span><span style="${T};font-weight:${body}">Tue 14 Oct, 10:30</span></div>
        <div class="scr-row"><span style="${T};font-weight:${lbl}">Where</span><span style="${T};font-weight:${body}">Pier 4, 2nd floor</span></div>
        <div class="bk-b" style="${T};font-weight:${btn}">Reschedule</div>
        <p class="bk-m" style="${T};font-weight:${body}">Free cancellation until 24 hours before.</p>
      </div>
    </div>
  </div>
  <div class="cap"><code class="id">${esc(p.id)}</code>
    <p class="mono">Display ${esc(d.family)} ${dw.join(" ")}</p>
    <p class="mono">Text ${esc(t.family)} ${tw.join(" ")}</p>
    <p class="sm">${esc(p.note)}</p></div>
</article>`;
};

const faces = [
  ["Geist", "../../web/public/fonts/geist/geist-latin-", [400, 500, 600]],
  ["IBM Plex Mono", "../../web/public/fonts/ibm-plex-mono/ibm-plex-mono-latin-", [400, 500]],
  ...fonts.map((f) => [f.family, `../../web/public/fonts/${f.id}/${f.id}-latin-`, weights(f)]),
]
  .flatMap(([n, pre, ws]) => ws.map((w) => `@font-face{font-family:"${n}";src:url("${pre}${w}-normal.woff2") format("woff2");font-weight:${w};font-style:normal;font-display:block}`))
  .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Design Wizard · Content review: laws, fonts and pairs (draft)</title>
<style>
/* Generated from laws.json, fonts.json, font-pairs.json. Chrome: Grading Suite light (DESIGN.md Part B). All fonts self-hosted, OFL. */
${faces}
:root{--bg:#E6E6E6;--surface:#F2F2F2;--plate:#CCCCCC;--line:#CCCCCC;--ctl:#6B6B6B;--text:#141414;--muted:#4F4F4F;--accent:#000;--on-accent:#fff;--focus:#000;--r:2px;
--sans:"Geist",sans-serif;--mono:"IBM Plex Mono",monospace}
*{box-sizing:border-box;margin:0;padding:0}
html{background:var(--bg);color:var(--text);font:400 13px/1.5 var(--sans)}
body{padding:0 24px 64px}
a{color:var(--text)}
a:focus-visible,button:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.top{display:flex;justify-content:space-between;align-items:center;min-height:44px;border-bottom:1px solid var(--line);margin:0 -24px;padding:0 24px}
.brand{font:500 11px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;display:flex;gap:8px;align-items:center}
.brand i{width:10px;height:10px;background:var(--accent);display:inline-block}
.lab{font:500 11px/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.intro{max-width:1232px;margin:32px auto 0}
h1{font:600 25px/1.2 var(--sans);letter-spacing:-.025em;margin-top:6px}
.lead{max-width:60ch;margin-top:12px}
.lead+.lead{margin-top:8px}
.jump{display:flex;gap:8px;margin-top:20px;flex-wrap:wrap}
.jump a{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border:1px solid var(--ctl);border-radius:var(--r);background:var(--surface);text-decoration:none;font-weight:500}
.jump a .mono{color:var(--muted)}
.jump svg{width:1em;height:1em}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
section{max-width:1232px;margin:48px auto 0}
.sec-hd{display:flex;align-items:baseline;justify-content:space-between;gap:16px;border-top:1px solid var(--ctl);padding-top:12px;margin-bottom:20px}
h2{font:600 25px/1.2 var(--sans);letter-spacing:-.025em}
.sec-hd p{max-width:60ch;color:var(--muted)}
.mono{font:400 11px/1.6 var(--mono);font-variant-numeric:tabular-nums}
.mut{color:var(--muted)}
code.id{font:500 11px/1.4 var(--mono);color:var(--text);background:var(--surface);border:1px solid var(--ctl);border-radius:var(--r);padding:2px 6px;user-select:all}
.tag{display:inline-flex;align-items:center;justify-content:center;min-width:44px;height:20px;padding:0 6px;font:400 11px/1 var(--mono);color:var(--muted);box-shadow:inset 0 0 0 1px var(--line);letter-spacing:.04em}
.tag.strong{color:var(--text);box-shadow:inset 0 0 0 1px var(--ctl);font-weight:500}
.tag.inv{background:var(--accent);color:var(--on-accent);box-shadow:none;font-weight:500}
.tags{display:flex;gap:6px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.card{background:var(--surface);border:1px solid var(--line);padding:16px;display:flex;flex-direction:column}
.card.is-cut{border-color:var(--ctl);border-style:dashed}
.card-hd{display:flex;justify-content:space-between;align-items:center;gap:8px}
.card h3{font:600 13px/1.4 var(--sans);margin-top:12px}
.rng{margin-left:6px}
.measure .q{color:var(--text)}
.sum{margin-top:2px}
.kv{margin-top:12px;display:grid;gap:2px}
.kv dt{font:500 11px/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-top:8px}
.kv dt:first-child{margin-top:0}
.rule b{font-weight:600}
.measure{color:var(--muted);font-size:12px}
.note{font-size:12px;color:var(--muted);margin-top:8px}
.note b{color:var(--text);font-weight:500}
.dd{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:auto;padding-top:16px}
figcaption{font:500 11px/1 var(--mono);letter-spacing:.08em;margin-bottom:6px}
/* Viewing plates with crop marks */
.plate{position:relative;background:var(--plate);padding:18px}
.plate::before,.plate::after,.plate .cm::before,.plate .cm::after{content:"";position:absolute;width:12px;height:12px;border:1px solid var(--muted)}
.plate::before{top:6px;left:6px;border-right:0;border-bottom:0}
.plate::after{bottom:6px;right:6px;border-left:0;border-top:0}
.plate .cm::before{top:6px;right:6px;border-left:0;border-bottom:0}
.plate .cm::after{bottom:6px;left:6px;border-right:0;border-top:0}
.plate.mini{padding:14px}
.plate.mini::before,.plate.mini::after,.plate.mini .cm::before,.plate.mini .cm::after{width:8px;height:8px}
.plate.mini::before{top:4px;left:4px}.plate.mini::after{bottom:4px;right:4px}.plate.mini .cm::before{top:4px;right:4px}.plate.mini .cm::after{bottom:4px;left:4px}
/* Neutral sample UI (not chrome): Inter, white, 6px radius */
.smp{background:#fff;color:#1C1C1C;font:400 12px/1.4 "Inter",sans-serif;padding:10px;border-radius:6px;min-height:164px;display:flex;flex-direction:column;gap:6px}
.smp *{font-family:inherit}
.s-h{font-weight:600;font-size:13px}
.s-p{font-size:12px}
.s-meta{font-size:11px;color:#5E5E5E;margin-top:auto}
.s-kick{font-size:11px;color:#5E5E5E;font-weight:500}
.s-row{display:flex;gap:6px}
.s-btn{font:600 12px/1 "Inter",sans-serif;border-radius:6px;min-height:36px;padding:0 10px;border:1px solid transparent;cursor:pointer;background:none;color:#1C1C1C}
.s-pri{background:#1C1C1C;color:#fff}
.s-sec{border-color:#8C8C8C;background:#fff}
.s-tiny{min-height:0;padding:0 6px;font-size:11px}
.s-link{text-decoration:underline;min-height:28px}
.s-full{width:100%}
.s-grid2{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.s-grid2 .s-btn{padding:0 4px;min-height:32px;font-size:11px}
.s-lbl{font-size:11px;font-weight:500}
.s-in{border:1px solid #8C8C8C;border-radius:6px;height:32px;padding:0 8px;display:flex;align-items:center;font-size:12px}
.s-focus-do{outline:2px solid #1C1C1C;outline-offset:2px}
.s-focus-dont{border-color:#7A7A7A}
.s-err{border:2px solid #B42318}
.s-errt{font-size:11px;color:#B42318;font-weight:500}
.s-sum{font-size:12px;background:#F0F0F0;border-radius:6px;padding:6px 8px;font-weight:500}
.s-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:3px}
.s-steps i{height:4px;background:#D4D4D4;border-radius:2px}
.s-steps i.on{background:#1C1C1C}
.s-dl{display:grid;grid-template-columns:auto 1fr;column-gap:8px;font-size:11px;align-content:start}
.s-dl span{color:#5E5E5E;margin-top:var(--in)}
.s-dl b{font-weight:500;margin-top:var(--in)}
.s-dl span:first-child,.s-dl span:first-child+b{margin-top:0}
.s-dl .g,.s-dl .g+b{margin-top:var(--out)}
.s-list{list-style:none;font-size:11px}
.s-list li{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #E0E0E0}
.s-list .s-flag{color:#B42318}
.s-list .s-flag span:last-child{display:inline-flex;gap:4px;align-items:center}
.s-ico{width:12px;height:12px}
.wf{border:1px solid #BDBDBD;border-radius:4px;padding:5px;display:flex;flex-direction:column;gap:4px}
.wf i{display:block;height:6px;background:#D4D4D4;border-radius:2px}
.wf .wf-nav{background:#1C1C1C;height:8px}
.wf .s{width:60%}
/* Font and pair cells */
.fcell .cap{padding-top:10px;display:grid;gap:2px;justify-items:start}
.fcell h3{font:500 13px/1.4 var(--sans);margin-top:6px}
.fcell .mono{color:var(--text)}
.sm{font-size:12px;color:var(--muted)}
.bk,.scr{background:#fff;color:#1C1C1C;border-radius:6px;font-synthesis:none}
.bk{padding:16px;display:flex;flex-direction:column;min-height:290px}
.bk-h{font-size:20px;line-height:1.2;letter-spacing:-.01em}
.bk-p{font-size:14px;line-height:1.45;margin-top:6px}
.bk-l{font-size:13px;margin-top:14px}
.bk-in{font-size:14px;border:1px solid #8C8C8C;border-radius:6px;height:44px;display:flex;align-items:center;padding:0 12px;margin-top:6px}
.bk-b{font-size:14px;background:#1C1C1C;color:#fff;border-radius:6px;height:44px;display:flex;align-items:center;justify-content:center;margin-top:12px}
.bk-m{font-size:12px;color:#5E5E5E;margin-top:8px}
.scr{overflow:hidden}
.scr-bar{display:flex;justify-content:space-between;align-items:center;padding:0 14px;height:40px;border-bottom:1px solid #E0E0E0;font-size:13px}
.scr-bar span:last-child{color:#5E5E5E;font-size:12px}
.scr-body{padding:14px;display:flex;flex-direction:column}
.scr-h{font-size:26px;line-height:1.15;letter-spacing:-.01em}
.scr-p{font-size:14px;line-height:1.45;margin-top:6px}
.scr-row{display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:1px solid #E0E0E0}
.scr-sh{font-size:15px;margin-top:14px}
.scr-sh+.scr-row{margin-top:6px;border-top:1px solid #E0E0E0}
.scr-row span:first-child{color:#5E5E5E}
.excl{background:var(--surface);border:1px dashed var(--ctl);padding:16px;display:flex;flex-direction:column;gap:8px;align-self:start}
.excl h3{font:500 13px/1.4 var(--sans)}
.foot{max-width:1232px;margin:48px auto 0;border-top:1px solid var(--line);padding-top:12px;color:var(--muted);font-size:12px}
@media (max-width:1100px){.grid3{grid-template-columns:repeat(2,1fr)}.grid4{grid-template-columns:repeat(2,1fr)}}
@media (max-width:760px){body{padding:0 16px 48px}.top{margin:0 -16px;padding:0 16px}.grid3,.grid4{grid-template-columns:1fr}.sec-hd{flex-direction:column}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
</head>
<body>
<header class="top"><div class="brand"><i aria-hidden="true"></i>Design Wizard · Content review</div><span class="lab">Slice 2, step 4 · draft</span></header>
<main>
<div class="intro">
  <p class="lab">For approval</p>
  <h1>Curated laws, fonts and pairs</h1>
  <p class="lead">Nothing is built on these lists until you approve them. Answer with ids, for example: drop <code class="id">goal-gradient</code>, keep <code class="id">fraunces</code>.</p>
  <p class="lead">Every sample below renders live in its own font. The wizard’s own chrome fonts, Geist and IBM Plex Mono, are not offered as project fonts.</p>
  <nav class="jump" aria-label="Sections">
    ${[["laws", "Laws", laws.length], ["fonts", "Font families", fonts.length], ["pairs", "Font pairs", pairs.length]]
      .map(([id, n, c]) => `<a href="#${id}">${n} <span class="mono">${c}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"/></svg><span class="vh">jump to section</span></a>`)
      .join("")}
  </nav>
</div>

<section id="laws" aria-labelledby="h-laws">
  <div class="sec-hd"><h2 id="h-laws">UX laws <span class="mono mut">${laws.length}</span></h2><p>Order follows the moments of building a UI. Dashed cards are the ones I would cut first. SEED marks the four ids the fixtures use.</p></div>
  <div class="grid3">
${laws.map(lawCard).join("\n")}
  </div>
</section>

<section id="fonts" aria-labelledby="h-fonts">
  <div class="sec-hd"><h2 id="h-fonts">Font families <span class="mono mut">${fonts.length}</span></h2><p>The same booking card, set entirely in each family with only the weights the pairs ship. All are OFL-1.1, from Fontsource, latin subset.</p></div>
  <div class="grid4">
${fonts.map(fontCard).join("\n")}
  </div>
</section>

<section id="pairs" aria-labelledby="h-pairs">
  <div class="sec-hd"><h2 id="h-pairs">Font pairs <span class="mono mut">${pairs.length}</span></h2><p>Display face on the app name and heading, text face on everything else.</p></div>
  <div class="grid4">
${pairs.map(pairCell).join("\n")}
    <aside class="excl" aria-labelledby="h-excl"><p class="lab">Not offered</p><h3 id="h-excl">Geist, IBM Plex Mono</h3><p class="sm">These are the wizard’s chrome fonts. Keeping them out of the catalogue means a variant can never look like the tool around it.</p></aside>
  </div>
</section>

</main>
<p class="foot">Draft data: laws.json, fonts.json, font-pairs.json in this folder. Font files and OFL.txt per family under web/public/fonts/&lt;id&gt;/ (one copy, used by the app).</p>
<script>
for (const b of document.querySelectorAll("button[data-delay]")) {
  const out = b.parentElement.querySelector("[data-out]");
  b.addEventListener("click", () => {
    out.textContent = "";
    setTimeout(() => { out.textContent = "Saved at " + new Date().toLocaleTimeString("en-GB"); }, Number(b.dataset.delay));
  });
}
</script>
</body>
</html>
`;
writeFileSync(dir + "index.html", html);
console.log("ok", laws.length, fonts.length, pairs.length);
