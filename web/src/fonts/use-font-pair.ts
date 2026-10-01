"use client";
import { useEffect, useState } from "react";
import { FONT_PAIR_BY_ID } from "@/content/font-pairs";
import { loadPair, type FontLoadState } from "./loader";

/** Load state of a font pair's faces; the plate shows a loading or failed state until "loaded". */
export function useFontPair(pairId: string): FontLoadState {
  const [state, setState] = useState<{ id: string; value: FontLoadState }>({ id: pairId, value: "loading" });
  useEffect(() => {
    const pair = FONT_PAIR_BY_ID.get(pairId);
    let live = true;
    const done = (value: Exclude<FontLoadState, "loading">) => live && setState({ id: pairId, value });
    if (!pair) done("failed");
    else void loadPair(pair).then(done);
    return () => {
      live = false;
    };
  }, [pairId]);
  return state.id === pairId ? state.value : "loading";
}
