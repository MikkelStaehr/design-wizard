import styles from "./samples.module.css";

// A booking card rendered only in the user's project tokens (--v-*), never in chrome tokens.
// Every element carries data-v-part so diff pins (v0.2) can anchor to it without changing this file.
// The card is decorative inside a plate (the plate's radio label describes it), so it holds no real controls.
export function SampleCard({ productName }: { productName: string | null }) {
  const name = productName && productName.trim() !== "" ? productName : "Harbour";
  return (
    <div className={styles.card} data-v-part="card" aria-hidden="true">
      <div className={styles.bar} data-v-part="header">
        <span className={styles.logo} data-v-part="product-name">
          {name}
        </span>
        <span className={styles.nav} data-v-part="nav">
          Today
        </span>
      </div>
      <div className={styles.body} data-v-part="body">
        <p className={styles.title} data-v-part="title">
          Tuesday 14 Oct
        </p>
        <p className={styles.meta} data-v-part="meta">
          6 booked · 2 open slots
        </p>
        <span className={styles.field} data-v-part="field">
          <span className={styles.label} data-v-part="label">
            Patient name
          </span>
          <span className={styles.input} data-v-part="input">
            Ida Holm
          </span>
        </span>
        <span className={styles.row} data-v-part="actions">
          <span className={styles.button} data-v-part="button">
            Book slot
          </span>
          <span className={styles.link} data-v-part="link">
            Reschedule
          </span>
        </span>
        <span className={styles.chip} data-v-part="chip">
          Confirmed
        </span>
      </div>
    </div>
  );
}
