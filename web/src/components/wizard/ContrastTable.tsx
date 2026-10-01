import { formatRatio } from "@/domain/color/contrast";
import type { PairResult } from "@/domain/color/pairs";

// DESIGN.md "Contrast check presentation": pair, ratio (2 decimals, tabular), and a PASS/FAIL word.
// Never colour alone and never a tick glyph. FAIL is the same 44px tag, inverted.
export function ContrastTable({ caption, results }: { caption: string; results: PairResult[] }) {
  return (
    <table className="w-full border-collapse font-mono text-label tabular-nums">
      <caption className="sr-only">{caption}</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">Pair</th>
          <th scope="col">Ratio</th>
          <th scope="col">Result (minimum)</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r) => (
          <tr key={`${r.fg}/${r.bg}`} className="border-t border-dw-line">
            <th scope="row" className="py-[5px] pr-2 text-left font-normal">
              {r.fg} / {r.bg}
            </th>
            <td className="py-[5px] text-right">{formatRatio(r.ratio)}</td>
            <td className="w-[52px] py-[5px] pl-2">
              <span
                className={`block w-11 rounded-sm py-0.5 text-center font-medium tracking-[0.04em] ${
                  r.pass ? "border border-dw-line text-dw-text-muted" : "bg-dw-accent text-dw-on-accent"
                }`}
              >
                {r.pass ? "PASS" : "FAIL"}
                <span className="sr-only"> (min {r.min})</span>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
