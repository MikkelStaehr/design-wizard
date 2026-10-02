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
  /** False for a plate that only shows something (e.g. the name check): a labelled figure, not a radio. */
  interactive?: boolean;
  onSelect?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  onFontState?: (state: FontLoadState) => void;
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
}

/**
 * A viewing plate: chrome surround with crop marks (brackets when selected) around one variant.
 * The variant root sets every --v-* inline and takes font, colour, background and line-height
 * from them explicitly, so nothing from the chrome cascades into the sample.
 */
export function Plate({ tokens, fontPairId, fontLabel, selected, tabbable, ariaLabel, interactive = true, onSelect, onKeyDown, onFontState, ref, children }: PlateProps) {
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
      role={interactive ? "radio" : "img"}
      aria-checked={interactive ? selected : undefined}
      aria-disabled={(interactive && failed) || undefined}
      aria-label={failed ? `${ariaLabel.replace(/\.$/, "")}. Font failed: ${fontLabel}` : ariaLabel}
      tabIndex={interactive ? (tabbable ? 0 : -1) : undefined}
      onClick={interactive ? onSelect : undefined}
      onKeyDown={interactive ? onKeyDown : undefined}
      className="dw-plate"
    >
      <span className="dw-cm" aria-hidden="true" />
      {/* The sample is always laid out (visibility, not display), and its lines never wrap, so the
          box is the same before and after the fonts load (AC5). Only its visibility changes. */}
      <div className="relative">
        <div data-v-root="" style={{ ...rootStyle, visibility: fontState === "loaded" ? "visible" : "hidden" }} className="h-auto overflow-hidden">
          {children}
        </div>
        {fontState !== "loaded" && (
          <div className="absolute inset-0 flex items-center justify-center bg-dw-surface px-3 text-center">
            <p className="font-mono text-label text-dw-text-muted">{failed ? `Font failed: ${fontLabel}` : "Loading fonts…"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
