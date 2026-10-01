// Renders "→" as an inline SVG with a visually hidden "to" (glyph rule: → is outside the font subsets).
export function ArrowText({ text }: { text: string }) {
  const parts = text.split("→");
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && (
            <>
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                focusable="false"
                className="mx-[0.12em] inline-block h-[0.82em] w-[0.82em] align-[-0.04em]"
              >
                <path
                  d="M2.5 10h14M11 4.5 16.5 10 11 15.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </svg>
              <span className="sr-only">to</span>
            </>
          )}
          {part.trim() === "" ? "" : i > 0 ? ` ${part.trim()}` : `${part.trim()} `}
        </span>
      ))}
    </>
  );
}
