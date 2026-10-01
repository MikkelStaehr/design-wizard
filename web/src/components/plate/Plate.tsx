"use client";
import { useEffect, type CSSProperties, type KeyboardEvent, type ReactNode, type Ref } from "react";
import type { FontLoadState } from "@/fonts/loader";
import { useFontPair } from "@/fonts/use-font-pair";
import { plateVars } from "@/domain/tokens/plate-vars";
import type { PlateTokens } from "@/domain/tokens/resolve";

export interface PlateProps {
  tokens: PlateTokens;
  /** Catalogue pair the plate renders in; it shows a loading state until those faces are loaded. */
  fontPairId: string;
  /** Family names for the failed message, e.g. "Sora + Inter". */
  fontLabel: string;
  selected: boolean;
  tabbable: boolean;
  ariaLabel: string;
  onSelect: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  onFontState?: (state: FontLoadState) => void;
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
}

/** Fixed height for the loading and failed placeholder only; a loaded variant takes its natural height (PlateGrid evens the row). */
const PLACEHOLDER_HEIGHT = "h-[360px]";

/**
 * A viewing plate: chrome surround with crop marks (brackets when selected) around one variant.
 * The variant root sets every --v-* inline and takes font, colour, background and line-height
 * from them explicitly, so nothing from the chrome cascades into the sample.
 */
export function Plate({ tokens, fontPairId, fontLabel, selected, tabbable, ariaLabel, onSelect, onKeyDown, onFontState, ref, children }: PlateProps) {
  const fontState = useFontPair(fontPairId);
  useEffect(() => onFontState?.(fontState), [fontState, onFontState]);
  const failed = fontState === "failed";
  const rootStyle = {
    ...plateVars(tokens),
    fontFamily: "var(--v-font-text)",
    color: "var(--v-text)",
    background: "var(--v-bg)",
    lineHeight: "var(--v-lh-text)",
    fontSize: "var(--v-fs-sm)",
    borderRadius: "var(--v-radius)",
  } as CSSProperties;

  return (
    <div
      ref={ref}
      role="radio"
      aria-checked={selected}
      aria-disabled={failed || undefined}
      aria-label={failed ? `${ariaLabel.replace(/\.$/, "")}. Font failed: ${fontLabel}` : ariaLabel}
      tabIndex={tabbable ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className="dw-plate"
    >
      <span className="dw-cm" aria-hidden="true" />
      {fontState === "loaded" ? (
        <div data-v-root="" style={rootStyle} className="h-auto overflow-hidden">
          {children}
        </div>
      ) : (
        <div className={`${PLACEHOLDER_HEIGHT} flex items-center justify-center px-3 text-center`}>
          <p className="font-mono text-label text-dw-text-muted">{failed ? `Font failed: ${fontLabel}` : "Loading fonts…"}</p>
        </div>
      )}
    </div>
  );
}
