"use client";
import { useEffect, useRef } from "react";
import { SampleCard } from "./SampleCard";
import styles from "./samples.module.css";

// The platform variants (design/specs/step-1-profile.md §2): the real SampleCard at a true logical width,
// scaled to fit a fixed 4:3 stage with an 8% inset. Reads only --v-* custom properties. The stage box never
// depends on fonts (AC5). Geometry lives in samples.module.css; only the scale is set here, from one ResizeObserver.
const SIZE = { desktop: { w: 1280, h: 800 }, mobile: { w: 390, h: 844 }, both: { w: 1280 + 48 + 390, h: 844 } } as const;
const INSET = 0.08;

type Kind = keyof typeof SIZE;

export function PlatformStage({ kind, productName }: { kind: Kind; productName: string | null }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const { w, h } = SIZE[kind];
    const fit = () => {
      const s = Math.min((stage.clientWidth * (1 - 2 * INSET)) / w, (stage.clientHeight * (1 - 2 * INSET)) / h);
      canvas.style.transform = `translate(-50%, -50%) scale(${s})`;
      // Keep each frame's outline at 1 screen px whatever the scale.
      for (const f of canvas.children) (f as HTMLElement).style.borderWidth = `${1 / s}px`;
    };
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [kind]);

  const frames = kind === "both" ? (["desktop", "mobile"] as const) : ([kind] as const);
  return (
    <div ref={stageRef} className={styles.stage} data-v-part="platform-stage">
      <div ref={canvasRef} className={`${styles.canvas} ${styles[`canvas-${kind}`]}`}>
        {frames.map((f) => (
          <div key={f} className={`${styles.frame} ${styles[`frame-${f}`]}`}>
            <SampleCard productName={productName} />
          </div>
        ))}
      </div>
    </div>
  );
}
