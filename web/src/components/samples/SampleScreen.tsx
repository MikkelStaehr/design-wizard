import styles from "./screen.module.css";

const ROWS = [
  { time: "09:00", who: "Ida Holm", what: "Physio · 45 min", status: "chip" },
  { time: "10:00", who: "Jonas Berg", what: "Follow-up · 30 min", status: "chip" },
  { time: "11:15", who: "Open slot", what: "Any therapist", status: "link" },
] as const;

const FIGURES = [
  { value: "6", label: "booked" },
  { value: "2", label: "open slots" },
  { value: "45", label: "min avg." },
] as const;

// The generic "Today" screen for the live preview, rendered only in the user's project tokens (--v-*).
// Only the product name comes from the profile; everything else is fixed sample copy (PLAN decision 4).
// Every element carries data-v-part. It sits inside a labelled plate, so it holds no real controls.
export function SampleScreen({ productName }: { productName: string | null }) {
  const name = productName && productName.trim() !== "" ? productName : "Harbour";
  return (
    <div className={styles.screen} data-v-part="screen" aria-hidden="true">
      <div className={styles.bar} data-v-part="header">
        <span className={styles.logo} data-v-part="product-name">
          {name}
        </span>
        <span className={styles.nav} data-v-part="nav">
          Today · Patients · Settings
        </span>
      </div>
      <div className={styles.head} data-v-part="page-head">
        <p className={styles.title} data-v-part="title">
          Today
        </p>
        <p className={styles.meta} data-v-part="meta">
          Tuesday 14 October · Nørrebro clinic
        </p>
      </div>
      <div className={styles.figures} data-v-part="figures">
        {FIGURES.map((f) => (
          <div key={f.label} data-v-part="figure">
            <b className={styles.figure} data-v-part="figure-value">
              {f.value}
            </b>
            <span className={styles.meta} data-v-part="figure-label">
              {f.label}
            </span>
          </div>
        ))}
      </div>
      {ROWS.map((r) => (
        <div key={r.time} className={styles.row} data-v-part="row">
          <span className={styles.time} data-v-part="row-time">
            {r.time}
          </span>
          <span className={styles.who} data-v-part="row-text">
            <span data-v-part="row-title">{r.who}</span>
            <span className={styles.meta} data-v-part="row-meta">
              {r.what}
            </span>
          </span>
          {r.status === "chip" ? (
            <span className={styles.chip} data-v-part="chip">
              Confirmed
            </span>
          ) : (
            <span className={styles.link} data-v-part="link">
              Fill
            </span>
          )}
        </div>
      ))}
      <div className={styles.foot} data-v-part="footer">
        <span className={styles.meta} data-v-part="sync">
          Synced 2 min ago
        </span>
        <span className={styles.button} data-v-part="button">
          New booking
        </span>
      </div>
    </div>
  );
}
