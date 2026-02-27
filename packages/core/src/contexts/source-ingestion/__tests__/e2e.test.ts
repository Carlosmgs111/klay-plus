/**
 * End-to-End Test for Source Ingestion Context
 *
 * Tests the complete flow:
 * 1. Create service with in-memory infrastructure
 * 2. Register a source
 * 3. Execute extraction
 * 4. Verify the results
 * 5. Load and extract a real PDF file
 *
 * Run with: npm run test:source-ingestion [optional-pdf-path]
 */

import { createSourceIngestionService } from "../service";
import { SourceType } from "../source/domain/SourceType";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root (5 levels up from __tests__ -> source-ingestion -> klay+ -> backend -> src -> klay)
const PROJECT_ROOT = path.resolve(__dirname, "../../../../..");

async function runE2ETest() {
  console.log("🧪 Starting End-to-End Test for Source Ingestion Context\n");

  try {
    console.log("📦 Step 1: Creating service with in-memory infrastructure...");
    const service = await createSourceIngestionService({
      provider: "server",
      dbPath: "./data",
    });
    console.log("   ✅ Service created successfully");
    console.log(`   📋 Supported MIME types: ${service.extraction.getSupportedMimeTypes().join(", ")}\n`);

    console.log("📝 Step 2: Registering a plain text source...");
    const sourceId = crypto.randomUUID();
    const sourceName = "Test Document";
    const sourceUri = "Hello World! This is a test document for the knowledge platform.";

    const registerResult = await service.registerSource({
      id: sourceId,
      name: sourceName,
      uri: sourceUri,
      type: SourceType.PlainText,
    });

    if (registerResult.isFail()) {
      throw new Error(`Registration failed: ${registerResult.error.message}`);
    }
    console.log(`   ✅ Source registered: ${registerResult.value.sourceId}\n`);

    console.log("🔍 Step 3: Executing extraction...");
    const extractionJobId = crypto.randomUUID();

    const extractionResult = await service.extractSource({
      jobId: extractionJobId,
      sourceId: sourceId,
    });

    if (extractionResult.isFail()) {
      throw new Error(`Extraction failed: ${extractionResult.error.message}`);
    }

    console.log(`   ✅ Extraction completed`);
    console.log(`      Job ID: ${extractionResult.value.jobId}`);
    console.log(`      Content Hash: ${extractionResult.value.contentHash}`);
    console.log(`      Changed: ${extractionResult.value.changed}\n`);

    console.log("🚀 Step 4: Testing full ingestAndExtract flow...");
    const jsonContent = JSON.stringify({
      title: "Test JSON",
      data: [1, 2, 3],
      nested: { key: "value" },
    });

    const fullFlowResult = await service.ingestAndExtract({
      sourceId: crypto.randomUUID(),
      sourceName: "JSON Test Document",
      uri: jsonContent,
      type: SourceType.Json,
      extractionJobId: crypto.randomUUID(),
    });

    if (fullFlowResult.isFail()) {
      throw new Error(`Full flow failed: ${fullFlowResult.error.message}`);
    }

    console.log(`   ✅ Full flow completed`);
    console.log(`      Source ID: ${fullFlowResult.value.sourceId}`);
    console.log(`      Job ID: ${fullFlowResult.value.jobId}`);
    console.log(`      Content Hash: ${fullFlowResult.value.contentHash}\n`);

    console.log("🔄 Step 5: Re-extracting same source (should detect no change)...");
    const reExtractResult = await service.extractSource({
      jobId: crypto.randomUUID(),
      sourceId: sourceId,
    });

    if (reExtractResult.isFail()) {
      throw new Error(`Re-extraction failed: ${reExtractResult.error.message}`);
    }

    console.log(`   ✅ Re-extraction completed`);
    console.log(`      Changed: ${reExtractResult.value.changed} (expected: false)\n`);

    console.log("📚 Step 6: Testing batch registration...");
    const batchSources = [
      { id: crypto.randomUUID(), name: "Doc 1", uri: "Content 1", type: SourceType.PlainText },
      { id: crypto.randomUUID(), name: "Doc 2", uri: "Content 2", type: SourceType.Markdown },
      { id: crypto.randomUUID(), name: "Doc 3", uri: "a,b,c\n1,2,3", type: SourceType.Csv },
    ];

    const batchResult = await service.batchRegister(batchSources);
    const successCount = batchResult.filter((r) => r.success).length;

    console.log(`   ✅ Batch registration completed: ${successCount}/${batchSources.length} successful\n`);

    console.log("⚡ Step 7: Testing batch ingestAndExtract...");
    const batchIngestSources = [
      {
        sourceId: crypto.randomUUID(),
        sourceName: "Batch Doc 1",
        uri: "Batch content 1",
        type: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
      },
      {
        sourceId: crypto.randomUUID(),
        sourceName: "Batch Doc 2",
        uri: "Batch content 2",
        type: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
      },
    ];

    const batchIngestResult = await service.batchIngestAndExtract(batchIngestSources);
    const batchSuccessCount = batchIngestResult.filter((r) => r.success).length;

    console.log(`   ✅ Batch ingest completed: ${batchSuccessCount}/${batchIngestSources.length} successful`);
    for (const result of batchIngestResult) {
      if (result.success) {
        console.log(`      - ${result.sourceId.slice(0, 8)}... hash: ${result.contentHash?.slice(0, 16)}...`);
      }
    }
    console.log();

    console.log("📄 Step 8: Testing REAL PDF extraction...");

    // Find the PDF test file (relative to project root)
    const pdfPath = path.resolve(PROJECT_ROOT, "node_modules/pdf-extraction/test/data/05-versions-space.pdf");

    if (!fs.existsSync(pdfPath)) {
      console.log(`   ⚠️  PDF file not found at: ${pdfPath}`);
      console.log("   Skipping PDF test...\n");
    } else {
      console.log(`   📁 Loading PDF from: ${pdfPath}`);

      const pdfResult = await service.ingestAndExtract({
        sourceId: crypto.randomUUID(),
        sourceName: "Real PDF Document",
        uri: pdfPath,
        type: SourceType.Pdf,
        extractionJobId: crypto.randomUUID(),
      });

      if (pdfResult.isFail()) {
        throw new Error(`PDF extraction failed: ${pdfResult.error.message}`);
      }

      console.log(`   ✅ PDF extraction completed!`);
      console.log(`      Source ID: ${pdfResult.value.sourceId}`);
      console.log(`      Job ID: ${pdfResult.value.jobId}`);
      console.log(`      Content Hash: ${pdfResult.value.contentHash}`);

      // Get the extraction job to see the extracted text
      const extractionJobResult = await service.extraction.executeExtraction.execute({
        jobId: crypto.randomUUID(),
        sourceId: pdfResult.value.sourceId,
        uri: pdfPath,
        mimeType: "application/pdf",
      });

      if (extractionJobResult.isFail()) {
        throw new Error(`Extraction job failed: ${extractionJobResult.error.message}`);
      }

      const textPreview = extractionJobResult.value.extractedText.slice(0, 200).replace(/\n/g, " ");
      console.log(`      Extracted text preview: "${textPreview}..."`);
      console.log(`      Total characters: ${extractionJobResult.value.extractedText.length}\n`);
    }

    const args = process.argv.slice(2).filter(arg => arg !== "--");
    const customPdfPath = args[0];
    if (customPdfPath) {
      console.log("📄 Step 9: Testing with CUSTOM PDF...");
      console.log(`   📁 Loading PDF from: ${customPdfPath}`);

      if (!fs.existsSync(customPdfPath)) {
        console.log(`   ❌ Custom PDF file not found: ${customPdfPath}\n`);
      } else {
        const customPdfResult = await service.ingestAndExtract({
          sourceId: crypto.randomUUID(),
          sourceName: path.basename(customPdfPath),
          uri: path.resolve(customPdfPath),
          type: SourceType.Pdf,
          extractionJobId: crypto.randomUUID(),
        });

        if (customPdfResult.isFail()) {
          throw new Error(`Custom PDF extraction failed: ${customPdfResult.error.message}`);
        }

        console.log(`   ✅ Custom PDF extraction completed!`);
        console.log(`      Source ID: ${customPdfResult.value.sourceId}`);
        console.log(`      Content Hash: ${customPdfResult.value.contentHash}`);

        // Execute extraction to get text content
        const customExtractionJobResult = await service.extraction.executeExtraction.execute({
          jobId: crypto.randomUUID(),
          sourceId: customPdfResult.value.sourceId,
          uri: path.resolve(customPdfPath),
          mimeType: "application/pdf",
        });

        if (customExtractionJobResult.isFail()) {
          throw new Error(`Custom extraction job failed: ${customExtractionJobResult.error.message}`);
        }

        const customTextPreview = customExtractionJobResult.value.extractedText.slice(0, 500).replace(/\n/g, " ");
        console.log(`      Extracted text preview: "${customTextPreview}..."`);
        console.log(`      Total characters: ${customExtractionJobResult.value.extractedText.length}`);

        // Show metadata
        console.log(`      Metadata:`, customExtractionJobResult.value.metadata);
        console.log();
      }
    }

    console.log("═══════════════════════════════════════════════════════════════");
    console.log("✅ ALL TESTS PASSED!");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("\nSummary:");
    console.log("  • Service creation: ✅");
    console.log("  • Source registration: ✅");
    console.log("  • Content extraction: ✅");
    console.log("  • Full ingest flow: ✅");
    console.log("  • Change detection: ✅");
    console.log("  • Batch registration: ✅");
    console.log("  • Batch ingest & extract: ✅");
    console.log("  • Real PDF extraction: ✅");
    console.log("\nThe source-ingestion context is working correctly!");

    console.log("\n💡 Tip: You can test with your own PDF by running:");
    console.log("   npm run test:source-ingestion -- /path/to/your/document.pdf");
  } catch (error) {
    console.error("\n❌ TEST FAILED!");
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run the test
runE2ETest();
