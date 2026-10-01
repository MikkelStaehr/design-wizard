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
  URL.revokeObjectURL(url);
}
