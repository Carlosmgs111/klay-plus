// ─── Supported File Types ─────────────────────────────────────────────────────

export const SUPPORTED_EXTENSIONS: Record<string, { type: string; label: string }> = {
  pdf: { type: "PDF", label: "PDF Document" },
  md: { type: "MARKDOWN", label: "Markdown" },
  txt: { type: "PLAIN_TEXT", label: "Plain Text" },
  csv: { type: "CSV", label: "CSV Spreadsheet" },
  json: { type: "JSON", label: "JSON Data" },
};

export const ACCEPT_STRING = Object.keys(SUPPORTED_EXTENSIONS)
  .map((e) => `.${e}`)
  .join(",");

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// ─── Utilities ────────────────────────────────────────────────────────────────

export function getFileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function detectFileType(name: string) {
  return SUPPORTED_EXTENSIONS[getFileExtension(name)] ?? null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateFile(file: File): string | null {
  if (file.size === 0) return "File is empty";
  if (file.size > MAX_FILE_SIZE) return `File exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`;
  if (!detectFileType(file.name)) {
    const ext = getFileExtension(file.name);
    return `Unsupported file type${ext ? `: .${ext}` : ""}. Use PDF, Markdown, TXT, CSV, or JSON.`;
  }
  return null;
}

export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
