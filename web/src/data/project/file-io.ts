// Browser file I/O: open reads a File the user picked; download hands the user a file to save.

export function readFileText(file: File): Promise<string> {
  return file.text();
}

export function downloadText(name: string, text: string, type = "application/json"): void {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Several downloads, 150 ms apart, so the browser shows one multiple-downloads prompt at most. */
export async function downloadMany(files: { name: string; text: string; type?: string }[], gapMs = 150): Promise<void> {
  for (const [i, f] of files.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, gapMs));
    downloadText(f.name, f.text, f.type);
  }
}
