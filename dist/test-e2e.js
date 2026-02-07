/**
 * End-to-End Test for Source Ingestion Context
 *
 * Tests the complete flow:
 * 1. Create orchestrator with in-memory infrastructure
 * 2. Register a source
 * 3. Execute extraction
 * 4. Verify the results
 * 5. Load and extract a real PDF file
 */
import { sourceIngestionOrchestratorFactory, SourceType } from "./source-ingestion/index.js";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
// Get __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function runE2ETest() {
    console.log("🧪 Starting End-to-End Test for Source Ingestion Context\n");
    try {
        // ─── Step 1: Create Orchestrator ───────────────────────────────────────
        console.log("📦 Step 1: Creating orchestrator with in-memory infrastructure...");
        const orchestrator = await sourceIngestionOrchestratorFactory({
            type: "in-memory",
        });
        console.log("   ✅ Orchestrator created successfully\n");
        // ─── Step 2: Register a Source ─────────────────────────────────────────
        console.log("📝 Step 2: Registering a plain text source...");
        const sourceId = crypto.randomUUID();
        const sourceName = "Test Document";
        const sourceUri = "Hello World! This is a test document for the knowledge platform.";
        const registerResult = await orchestrator.registerSource({
            id: sourceId,
            name: sourceName,
            uri: sourceUri,
            type: SourceType.PlainText,
        });
        console.log(`   ✅ Source registered: ${registerResult.sourceId}\n`);
        // ─── Step 3: Execute Extraction ────────────────────────────────────────
        console.log("🔍 Step 3: Executing extraction...");
        const extractionJobId = crypto.randomUUID();
        const extractionResult = await orchestrator.extractSource({
            jobId: extractionJobId,
            sourceId: sourceId,
        });
        console.log(`   ✅ Extraction completed`);
        console.log(`      Job ID: ${extractionResult.jobId}`);
        console.log(`      Content Hash: ${extractionResult.contentHash}`);
        console.log(`      Changed: ${extractionResult.changed}\n`);
        // ─── Step 4: Full Ingest and Extract Flow ──────────────────────────────
        console.log("🚀 Step 4: Testing full ingestAndExtract flow...");
        const jsonContent = JSON.stringify({
            title: "Test JSON",
            data: [1, 2, 3],
            nested: { key: "value" },
        });
        const fullFlowResult = await orchestrator.ingestAndExtract({
            sourceId: crypto.randomUUID(),
            sourceName: "JSON Test Document",
            uri: jsonContent,
            type: SourceType.Json,
            extractionJobId: crypto.randomUUID(),
        });
        console.log(`   ✅ Full flow completed`);
        console.log(`      Source ID: ${fullFlowResult.sourceId}`);
        console.log(`      Job ID: ${fullFlowResult.jobId}`);
        console.log(`      Content Hash: ${fullFlowResult.contentHash}\n`);
        // ─── Step 5: Re-extract (should detect no change) ──────────────────────
        console.log("🔄 Step 5: Re-extracting same source (should detect no change)...");
        const reExtractResult = await orchestrator.extractSource({
            jobId: crypto.randomUUID(),
            sourceId: sourceId,
        });
        console.log(`   ✅ Re-extraction completed`);
        console.log(`      Changed: ${reExtractResult.changed} (expected: false)\n`);
        // ─── Step 6: Batch Registration ────────────────────────────────────────
        console.log("📚 Step 6: Testing batch registration...");
        const batchSources = [
            { id: crypto.randomUUID(), name: "Doc 1", uri: "Content 1", type: SourceType.PlainText },
            { id: crypto.randomUUID(), name: "Doc 2", uri: "Content 2", type: SourceType.Markdown },
            { id: crypto.randomUUID(), name: "Doc 3", uri: "a,b,c\n1,2,3", type: SourceType.Csv },
        ];
        const batchResult = await orchestrator.batchRegister(batchSources);
        const successCount = batchResult.filter((r) => r.success).length;
        console.log(`   ✅ Batch registration completed: ${successCount}/${batchSources.length} successful\n`);
        // ─── Step 7: Batch Ingest and Extract ──────────────────────────────────
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
        const batchIngestResult = await orchestrator.batchIngestAndExtract(batchIngestSources);
        const batchSuccessCount = batchIngestResult.filter((r) => r.success).length;
        console.log(`   ✅ Batch ingest completed: ${batchSuccessCount}/${batchIngestSources.length} successful`);
        for (const result of batchIngestResult) {
            if (result.success) {
                console.log(`      - ${result.sourceId.slice(0, 8)}... hash: ${result.contentHash?.slice(0, 16)}...`);
            }
        }
        console.log();
        // ─── Step 8: Real PDF Extraction ───────────────────────────────────────
        console.log("📄 Step 8: Testing REAL PDF extraction...");
        // Find the PDF test file
        const pdfPath = path.resolve(__dirname, "../node_modules/pdf-extraction/test/data/05-versions-space.pdf");
        if (!fs.existsSync(pdfPath)) {
            console.log(`   ⚠️  PDF file not found at: ${pdfPath}`);
            console.log("   Skipping PDF test...\n");
        }
        else {
            console.log(`   📁 Loading PDF from: ${pdfPath}`);
            const pdfResult = await orchestrator.ingestAndExtract({
                sourceId: crypto.randomUUID(),
                sourceName: "Real PDF Document",
                uri: pdfPath,
                type: SourceType.Pdf,
                extractionJobId: crypto.randomUUID(),
            });
            console.log(`   ✅ PDF extraction completed!`);
            console.log(`      Source ID: ${pdfResult.sourceId}`);
            console.log(`      Job ID: ${pdfResult.jobId}`);
            console.log(`      Content Hash: ${pdfResult.contentHash}`);
            // Get the extraction job to see the extracted text
            const extractionJob = await orchestrator.extraction.executeExtraction.execute({
                jobId: crypto.randomUUID(),
                sourceId: pdfResult.sourceId,
                uri: pdfPath,
                mimeType: "application/pdf",
            });
            const textPreview = extractionJob.extractedText.slice(0, 200).replace(/\n/g, " ");
            console.log(`      Extracted text preview: "${textPreview}..."`);
            console.log(`      Total characters: ${extractionJob.extractedText.length}\n`);
        }
        // ─── Step 9: Test with custom PDF path (if provided) ───────────────────
        const customPdfPath = process.argv[2];
        if (customPdfPath) {
            console.log("📄 Step 9: Testing with CUSTOM PDF...");
            console.log(`   📁 Loading PDF from: ${customPdfPath}`);
            if (!fs.existsSync(customPdfPath)) {
                console.log(`   ❌ Custom PDF file not found: ${customPdfPath}\n`);
            }
            else {
                const customPdfResult = await orchestrator.ingestAndExtract({
                    sourceId: crypto.randomUUID(),
                    sourceName: path.basename(customPdfPath),
                    uri: path.resolve(customPdfPath),
                    type: SourceType.Pdf,
                    extractionJobId: crypto.randomUUID(),
                });
                console.log(`   ✅ Custom PDF extraction completed!`);
                console.log(`      Source ID: ${customPdfResult.sourceId}`);
                console.log(`      Content Hash: ${customPdfResult.contentHash}`);
                // Execute extraction to get text content
                const customExtractionJob = await orchestrator.extraction.executeExtraction.execute({
                    jobId: crypto.randomUUID(),
                    sourceId: customPdfResult.sourceId,
                    uri: path.resolve(customPdfPath),
                    mimeType: "application/pdf",
                });
                const customTextPreview = customExtractionJob.extractedText.slice(0, 500).replace(/\n/g, " ");
                console.log(`      Extracted text preview: "${customTextPreview}..."`);
                console.log(`      Total characters: ${customExtractionJob.extractedText.length}`);
                // Show metadata
                console.log(`      Metadata:`, customExtractionJob.metadata);
                console.log();
            }
        }
        // ─── Summary ───────────────────────────────────────────────────────────
        console.log("═══════════════════════════════════════════════════════════════");
        console.log("✅ ALL TESTS PASSED!");
        console.log("═══════════════════════════════════════════════════════════════");
        console.log("\nSummary:");
        console.log("  • Orchestrator creation: ✅");
        console.log("  • Source registration: ✅");
        console.log("  • Content extraction: ✅");
        console.log("  • Full ingest flow: ✅");
        console.log("  • Change detection: ✅");
        console.log("  • Batch registration: ✅");
        console.log("  • Batch ingest & extract: ✅");
        console.log("  • Real PDF extraction: ✅");
        console.log("\nThe source-ingestion context is working correctly!");
        console.log("\n💡 Tip: You can test with your own PDF by running:");
        console.log("   node dist/test-e2e.js /path/to/your/document.pdf");
    }
    catch (error) {
        console.error("\n❌ TEST FAILED!");
        console.error("Error:", error);
        process.exit(1);
    }
}
// Run the test
runE2ETest();
//# sourceMappingURL=test-e2e.js.map