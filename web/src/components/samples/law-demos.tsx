import type { ReactNode } from "react";
import s from "./law-demos.module.css";

// DO / DON'T specimens per law (design/content-review), static and inert: no focus stops.
// They render in fixed neutral tokens; the meta line states the measured value, so it stays true for every project.
// Demo-only values arrive as --v-demo-* (passed in by the step; this folder holds no colour literals).
export interface LawDemo {
  /** The measured fact under the specimen, also used in the plate's label. Null when the specimen speaks for itself. */
  meta: string | null;
  node: ReactNode;
}

function Box({ children, meta }: { children: ReactNode; meta: string | null }) {
  return (
    <div className={s.demo} aria-hidden="true" inert data-v-part="law-demo">
      {children}
      {meta !== null && <p className={`${s.p} ${s.meta}`}>{meta}</p>}
    </div>
  );
}

function demo(meta: string | null, children: ReactNode): LawDemo {
  return { meta, node: <Box meta={meta}>{children}</Box> };
}

/** Demo values come in from the step, so the meta lines state the same values the specimens draw. */
export interface DemoValues {
  passGrey: string;
  failGrey: string;
  targetPx: number;
  tinyPx: number;
}

export function lawDemos(D: DemoValues): Record<string, { do: LawDemo; dont: LawDemo }> {
  return {
  fitts: {
    do: demo(
      `${D.targetPx}px tall`,
      <span className={s.row}>
        <span className={`${s.btn} ${s.target}`}>Edit</span>
        <span className={`${s.btn} ${s.target}`}>Move</span>
      </span>,
    ),
    dont: demo(
      `${D.tinyPx}px tall`,
      <span className={s.row}>
        <span className={`${s.btn} ${s.tiny}`}>Edit</span>
        <span className={`${s.btn} ${s.tiny}`}>Move</span>
      </span>,
    ),
  },
  hick: {
    do: demo(
      null,
      <>
        <p className={`${s.p} ${s.h}`}>Confirm booking</p>
        <span className={`${s.btn} ${s.pri} ${s.full}`}>Confirm</span>
        <span className={`${s.btn} ${s.link} ${s.full}`}>Back</span>
      </>,
    ),
    dont: demo(
      null,
      <>
        <p className={`${s.p} ${s.h}`}>Confirm booking</p>
        <span className={s.grid2}>
          <span className={`${s.btn} ${s.pri}`}>Confirm</span>
          <span className={`${s.btn} ${s.pri}`}>Save</span>
          <span className={`${s.btn} ${s.pri}`}>Share</span>
          <span className={`${s.btn} ${s.pri}`}>Print</span>
        </span>
      </>,
    ),
  },
  "wcag-contrast": {
    do: demo(`${D.passGrey} on white, 6.49:1`, <p className={`${s.p} ${s.pass}`}>Free cancellation until 24 hours before.</p>),
    dont: demo(`${D.failGrey} on white, 2.82:1`, <p className={`${s.p} ${s.fail}`}>Free cancellation until 24 hours before.</p>),
  },
  "wcag-focus-visible": {
    do: demo(
      "Focused: 2px ring",
      <>
        <span className={s.lbl}>Phone</span>
        <span className={`${s.input} ${s.ring}`}>20 12 34</span>
      </>,
    ),
    dont: demo(
      "Focused: no ring",
      <>
        <span className={s.lbl}>Phone</span>
        <span className={s.input}>20 12 34</span>
      </>,
    ),
  },
  "response-limits": {
    do: demo("Visible after 80 ms", <span className={`${s.btn} ${s.pri} ${s.full}`}>Saving…</span>),
    dont: demo("Nothing visible for 1200 ms", <span className={`${s.btn} ${s.pri} ${s.full}`}>Save</span>),
  },
  "recognition-recall": {
    do: demo(
      null,
      <>
        <p className={`${s.p} ${s.kick}`}>Step 2 of 4</p>
        <span className={s.steps}>
          <i className={s.on} />
          <i className={s.on} />
          <i />
          <i />
        </span>
        <p className={`${s.p} ${s.h}`}>Choose a time</p>
        <p className={s.p}>10:30 · 11:00 · 13:15</p>
      </>,
    ),
    dont: demo(
      null,
      <>
        <p className={`${s.p} ${s.h}`}>Choose a time</p>
        <p className={s.p}>10:30 · 11:00 · 13:15</p>
      </>,
    ),
  },
  proximity: {
    do: demo(null, <Pairs className={s.tight} />),
    dont: demo(null, <Pairs className={s.even} />),
  },
  "error-recovery": {
    do: demo(
      null,
      <>
        <span className={s.lbl}>Phone</span>
        <span className={`${s.input} ${s.err}`} />
        <p className={`${s.p} ${s.errText}`}>Enter a phone number, for example 20 12 34 56.</p>
      </>,
    ),
    dont: demo(
      null,
      <>
        <span className={s.lbl}>Phone</span>
        <span className={`${s.input} ${s.err}`} />
        <p className={`${s.p} ${s.errText}`}>Invalid input.</p>
      </>,
    ),
  },
  "peak-end": {
    do: demo(
      null,
      <>
        <p className={`${s.p} ${s.h}`}>You are booked</p>
        <p className={s.p}>Tue 14 Oct, 10:30 with Dr Lind.</p>
        <span className={`${s.btn} ${s.pri} ${s.full}`}>Add to calendar</span>
      </>,
    ),
    dont: demo(
      null,
      <>
        <p className={`${s.p} ${s.h}`}>Success!</p>
        <span className={`${s.btn} ${s.full}`}>OK</span>
      </>,
    ),
  },
  };
}

function Pairs({ className }: { className: string }) {
  return (
    <span className={`${s.dl} ${className}`}>
      <span>Name</span>
      <b>Mia Lind</b>
      <span>Phone</span>
      <b>20 12 34 56</b>
      <span className={s.g}>Clinic</span>
      <b>Harbour</b>
      <span>Time</span>
      <b>10:30</b>
    </span>
  );
}
