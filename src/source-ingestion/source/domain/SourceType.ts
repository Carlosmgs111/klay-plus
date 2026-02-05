export const SourceType = {
  Pdf: "PDF",
  Web: "WEB",
  Api: "API",
  PlainText: "PLAIN_TEXT",
  Markdown: "MARKDOWN",
  Csv: "CSV",
  Json: "JSON",
} as const;

export type SourceType = (typeof SourceType)[keyof typeof SourceType];
