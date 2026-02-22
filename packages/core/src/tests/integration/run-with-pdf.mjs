#!/usr/bin/env node

/**
 * Runner script for the integration test with a real PDF file.
 *
 * Usage:
 *   npm run test:integration:pdf -- /path/to/document.pdf
 *   node src/backend/klay+/tests/integration/run-with-pdf.mjs /path/to/document.pdf
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve } from "path";

const pdfArg = process.argv[2];

if (!pdfArg) {
  console.error("Usage: npm run test:integration:pdf -- /path/to/document.pdf");
  process.exit(1);
}

const pdfPath = resolve(pdfArg);

if (!existsSync(pdfPath)) {
  console.error(`File not found: ${pdfPath}`);
  process.exit(1);
}

console.log(`\nRunning integration tests with PDF: ${pdfPath}\n`);

try {
  execSync(
    "npx vitest run src/backend/klay+/tests/integration/full-pipeline.e2e.test.ts",
    {
      stdio: "inherit",
      env: { ...process.env, PDF_PATH: pdfPath },
    },
  );
} catch {
  process.exit(1);
}
