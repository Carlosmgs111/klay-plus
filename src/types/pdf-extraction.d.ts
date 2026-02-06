declare module "pdf-extraction" {
  interface PdfData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    text: string;
    version: string;
  }

  function pdfExtraction(dataBuffer: Buffer): Promise<PdfData>;
  export default pdfExtraction;
}
