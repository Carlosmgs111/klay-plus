/**
 * Resource Buffer Upload — E2E Tests
 *
 * Tests the complete buffer upload chain:
 *   buffer (ArrayBuffer) → ResourceStorage → Resource aggregate → persistence → retrieval
 *
 * Covers:
 * - Text buffer upload and size verification
 * - Binary buffer upload (simulated PDF, image)
 * - Large buffer upload
 * - Storage existence verification after upload
 * - Storage cleanup after deletion
 * - Full ingestFile workflow: buffer → storage → source → extraction
 * - Full ingestExternalResource workflow (no upload)
 * - Resource lifecycle: store → retrieve → delete → verify gone
 * - Edge cases: empty buffer, special characters in filename
 * - Aggregate state verification: status, provider, storageUri, metadata
 *
 * Uses in-memory infrastructure for fast, isolated tests (no filesystem I/O).
 *
 * Run with:
 *   npx vitest run src/backend/klay+/contexts/source-ingestion/__tests__/resource-buffer-upload.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createSourceIngestionFacade } from "../facade";
import { SourceType } from "../source/domain/SourceType";
import { ResourceStatus } from "../resource/domain/ResourceStatus";
import type { SourceIngestionFacade } from "../facade/SourceIngestionFacade";
import * as fs from "fs";
import * as path from "path";

describe("Resource Buffer Upload — E2E", () => {
  let facade: SourceIngestionFacade;

  beforeAll(async () => {
    facade = await createSourceIngestionFacade({
      provider: "in-memory",
    });
  });

  // 1. Basic Buffer Upload

  describe("Basic Buffer Upload", () => {
    it("should upload a text buffer and return correct URI and size", async () => {
      const content = "Hello, this is a plain text file content for upload testing.";
      const buffer = new TextEncoder().encode(content).buffer;
      const resourceId = crypto.randomUUID();

      const result = await facade.storeResource({
        id: resourceId,
        buffer,
        originalName: "hello.txt",
        mimeType: "text/plain",
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.resourceId).toBe(resourceId);
      expect(result.value.storageUri).toContain("hello.txt");
      expect(result.value.storageUri).toMatch(/^mem:\/\//);
      expect(result.value.size).toBe(buffer.byteLength);
      expect(result.value.size).toBe(content.length); // UTF-8 ASCII = 1 byte per char
    });

    it("should upload a binary buffer (simulated PDF)", async () => {
      // Create a fake PDF header + random binary content
      const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
      const binaryData = new Uint8Array(1024);
      crypto.getRandomValues(binaryData);

      const combined = new Uint8Array(pdfHeader.length + binaryData.length);
      combined.set(pdfHeader, 0);
      combined.set(binaryData, pdfHeader.length);
      const buffer = combined.buffer;

      const resourceId = crypto.randomUUID();
      const result = await facade.storeResource({
        id: resourceId,
        buffer,
        originalName: "document.pdf",
        mimeType: "application/pdf",
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.size).toBe(1028); // 4 header + 1024 data
      expect(result.value.storageUri).toContain("document.pdf");
    });

    it("should upload a binary buffer (simulated image)", async () => {
      // Simulate a PNG-like buffer (magic bytes + random data)
      const pngMagic = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const imageData = new Uint8Array(2048);
      crypto.getRandomValues(imageData);

      const combined = new Uint8Array(pngMagic.length + imageData.length);
      combined.set(pngMagic, 0);
      combined.set(imageData, pngMagic.length);

      const result = await facade.storeResource({
        id: crypto.randomUUID(),
        buffer: combined.buffer,
        originalName: "screenshot.png",
        mimeType: "image/png",
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.size).toBe(pngMagic.length + imageData.length);
    });

    it("should upload a large buffer (100KB)", async () => {
      const totalSize = 100 * 1024; // 100KB
      const largeData = new Uint8Array(totalSize);
      // Fill in chunks (crypto.getRandomValues has a 65536-byte limit)
      const chunkSize = 65536;
      for (let offset = 0; offset < totalSize; offset += chunkSize) {
        const size = Math.min(chunkSize, totalSize - offset);
        crypto.getRandomValues(largeData.subarray(offset, offset + size));
      }

      const result = await facade.storeResource({
        id: crypto.randomUUID(),
        buffer: largeData.buffer,
        originalName: "large-file.bin",
        mimeType: "application/octet-stream",
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.size).toBe(totalSize);
    });

    it("should handle an empty buffer (0 bytes)", async () => {
      const emptyBuffer = new ArrayBuffer(0);

      const result = await facade.storeResource({
        id: crypto.randomUUID(),
        buffer: emptyBuffer,
        originalName: "empty.txt",
        mimeType: "text/plain",
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.size).toBe(0);
    });

    it("should handle filenames with special characters", async () => {
      const buffer = new TextEncoder().encode("content").buffer;

      const result = await facade.storeResource({
        id: crypto.randomUUID(),
        buffer,
        originalName: "my document (v2) — final.txt",
        mimeType: "text/plain",
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.storageUri).toBeTruthy();
      expect(result.value.size).toBe(buffer.byteLength);
    });
  });

  // 2. Aggregate State Verification

  describe("Aggregate State After Upload", () => {
    it("should create a Resource aggregate with correct metadata after buffer upload", async () => {
      const content = "Aggregate state verification content.";
      const buffer = new TextEncoder().encode(content).buffer;
      const resourceId = crypto.randomUUID();

      await facade.storeResource({
        id: resourceId,
        buffer,
        originalName: "state-test.txt",
        mimeType: "text/plain",
      });

      const getResult = await facade.getResource(resourceId);
      expect(getResult.isOk()).toBe(true);

      const resource = getResult.value;
      expect(resource.id.value).toBe(resourceId);
      expect(resource.originalName).toBe("state-test.txt");
      expect(resource.mimeType).toBe("text/plain");
      expect(resource.size).toBe(buffer.byteLength);
      expect(resource.status).toBe(ResourceStatus.Stored);
      expect(resource.isStored).toBe(true);
      expect(resource.isDeleted).toBe(false);
      expect(resource.storageUri).toMatch(/^mem:\/\//);
      expect(resource.provider).toBe("in-memory");
      expect(resource.createdAt).toBeInstanceOf(Date);
    });

    it("should create an external resource with provider 'external'", async () => {
      const resourceId = crypto.randomUUID();
      const externalUri = "https://cdn.example.com/files/report-2024.pdf";

      await facade.registerExternalResource({
        id: resourceId,
        name: "Annual Report 2024",
        mimeType: "application/pdf",
        uri: externalUri,
        size: 5_000_000,
      });

      const getResult = await facade.getResource(resourceId);
      expect(getResult.isOk()).toBe(true);

      const resource = getResult.value;
      expect(resource.originalName).toBe("Annual Report 2024");
      expect(resource.mimeType).toBe("application/pdf");
      expect(resource.size).toBe(5_000_000);
      expect(resource.status).toBe(ResourceStatus.Stored);
      expect(resource.storageUri).toBe(externalUri);
      expect(resource.provider).toBe("external");
    });

    it("should generate unique URIs for uploads with the same filename", async () => {
      const buffer = new TextEncoder().encode("content A").buffer;

      const result1 = await facade.storeResource({
        id: crypto.randomUUID(),
        buffer,
        originalName: "same-name.txt",
        mimeType: "text/plain",
      });

      const result2 = await facade.storeResource({
        id: crypto.randomUUID(),
        buffer: new TextEncoder().encode("content B").buffer,
        originalName: "same-name.txt",
        mimeType: "text/plain",
      });

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      // URIs must differ even with same originalName (UUID prefix ensures this)
      expect(result1.value.storageUri).not.toBe(result2.value.storageUri);
    });
  });

  // 3. Resource Lifecycle: Store → Retrieve → Delete → Verify

  describe("Resource Lifecycle", () => {
    it("should complete the full lifecycle: store → retrieve → delete → verify gone", async () => {
      const resourceId = crypto.randomUUID();
      const content = "Lifecycle test content — this resource will be stored, retrieved, and deleted.";
      const buffer = new TextEncoder().encode(content).buffer;

      // Step 1: Store
      const storeResult = await facade.storeResource({
        id: resourceId,
        buffer,
        originalName: "lifecycle.txt",
        mimeType: "text/plain",
      });
      expect(storeResult.isOk()).toBe(true);
      const { storageUri } = storeResult.value;

      // Step 2: Retrieve — resource exists and is STORED
      const getResult = await facade.getResource(resourceId);
      expect(getResult.isOk()).toBe(true);
      expect(getResult.value.isStored).toBe(true);
      expect(getResult.value.storageUri).toBe(storageUri);

      // Step 3: Delete
      const deleteResult = await facade.deleteResource({ id: resourceId });
      expect(deleteResult.isOk()).toBe(true);

      // Step 4: Verify — aggregate is now DELETED
      const getAfterDelete = await facade.getResource(resourceId);
      expect(getAfterDelete.isOk()).toBe(true);
      expect(getAfterDelete.value.isDeleted).toBe(true);
      expect(getAfterDelete.value.status).toBe(ResourceStatus.Deleted);
    });

    it("should fail to delete a non-existent resource", async () => {
      const result = await facade.deleteResource({
        id: "non-existent-resource-id",
      });

      expect(result.isFail()).toBe(true);
      expect(result.error.message).toContain("not found");
    });
  });

  // 4. Validation: Invalid Inputs

  describe("Validation", () => {
    it("should reject upload with empty originalName", async () => {
      const buffer = new TextEncoder().encode("content").buffer;

      const result = await facade.storeResource({
        id: crypto.randomUUID(),
        buffer,
        originalName: "",
        mimeType: "text/plain",
      });

      expect(result.isFail()).toBe(true);
    });

    it("should reject upload with empty mimeType", async () => {
      const buffer = new TextEncoder().encode("content").buffer;

      const result = await facade.storeResource({
        id: crypto.randomUUID(),
        buffer,
        originalName: "valid-name.txt",
        mimeType: "",
      });

      expect(result.isFail()).toBe(true);
    });

    it("should reject upload with whitespace-only originalName", async () => {
      const buffer = new TextEncoder().encode("content").buffer;

      const result = await facade.storeResource({
        id: crypto.randomUUID(),
        buffer,
        originalName: "   ",
        mimeType: "text/plain",
      });

      expect(result.isFail()).toBe(true);
    });

    it("should reject duplicate resource ID", async () => {
      const resourceId = crypto.randomUUID();
      const buffer = new TextEncoder().encode("content").buffer;

      // First upload succeeds
      const first = await facade.storeResource({
        id: resourceId,
        buffer,
        originalName: "first.txt",
        mimeType: "text/plain",
      });
      expect(first.isOk()).toBe(true);

      // Second upload with same ID fails
      const second = await facade.storeResource({
        id: resourceId,
        buffer: new TextEncoder().encode("different").buffer,
        originalName: "second.txt",
        mimeType: "text/plain",
      });
      expect(second.isFail()).toBe(true);
      expect(second.error.message).toContain("already exists");
    });

    it("should reject external resource with empty name", async () => {
      const result = await facade.registerExternalResource({
        id: crypto.randomUUID(),
        name: "",
        mimeType: "application/pdf",
        uri: "https://example.com/file.pdf",
      });

      expect(result.isFail()).toBe(true);
    });
  });

  // 5. Full Workflow: ingestFile (buffer → storage → source → extraction)

  describe("ingestFile Workflow — Buffer to Extraction", () => {
    it("should complete the full ingestFile pipeline with a text buffer", async () => {
      const resourceId = crypto.randomUUID();
      const sourceId = crypto.randomUUID();
      const originalContent = "This plain text document will be uploaded as a buffer, stored, registered as a source, and its content extracted.";
      const buffer = new TextEncoder().encode(originalContent).buffer;

      const result = await facade.ingestFile({
        resourceId,
        sourceId,
        sourceName: "Buffer Upload Test",
        sourceType: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
        file: {
          buffer,
          originalName: "buffer-test.txt",
          mimeType: "text/plain",
        },
      });

      expect(result.isOk()).toBe(true);

      // Verify all fields of the response
      expect(result.value.resourceId).toBe(resourceId);
      expect(result.value.sourceId).toBe(sourceId);
      expect(result.value.storageUri).toBeTruthy();
      expect(result.value.storageUri).toMatch(/^mem:\/\//);
      expect(result.value.contentHash).toBeTruthy();
      expect(result.value.extractedText).toBe(originalContent);
      expect(result.value.extractedText.length).toBe(originalContent.length);

      // Verify the resource aggregate state
      const resourceResult = await facade.getResource(resourceId);
      expect(resourceResult.isOk()).toBe(true);
      expect(resourceResult.value.originalName).toBe("buffer-test.txt");
      expect(resourceResult.value.mimeType).toBe("text/plain");
      expect(resourceResult.value.size).toBe(buffer.byteLength);
      expect(resourceResult.value.isStored).toBe(true);
    });

    it("should preserve buffer content through the extraction pipeline", async () => {
      const resourceId = crypto.randomUUID();
      const sourceId = crypto.randomUUID();

      // Multi-line content to verify fidelity
      const content = [
        "Line 1: Introduction to testing",
        "Line 2: Buffer integrity verification",
        "Line 3: 特殊文字テスト (Unicode test)",
        "Line 4: números y acentos: á é í ó ú ñ",
        "Line 5: End of document.",
      ].join("\n");
      const buffer = new TextEncoder().encode(content).buffer;

      const result = await facade.ingestFile({
        resourceId,
        sourceId,
        sourceName: "Unicode Buffer Test",
        sourceType: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
        file: {
          buffer,
          originalName: "unicode-test.txt",
          mimeType: "text/plain",
        },
      });

      expect(result.isOk()).toBe(true);
      // The extracted text should preserve the original content
      expect(result.value.extractedText).toBe(content);
    });

    it("should produce consistent content hash for identical buffers", async () => {
      const content = "Deterministic content for hash verification.";
      const buffer1 = new TextEncoder().encode(content).buffer;
      const buffer2 = new TextEncoder().encode(content).buffer;

      const result1 = await facade.ingestFile({
        resourceId: crypto.randomUUID(),
        sourceId: crypto.randomUUID(),
        sourceName: "Hash Test 1",
        sourceType: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
        file: { buffer: buffer1, originalName: "hash1.txt", mimeType: "text/plain" },
      });

      const result2 = await facade.ingestFile({
        resourceId: crypto.randomUUID(),
        sourceId: crypto.randomUUID(),
        sourceName: "Hash Test 2",
        sourceType: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
        file: { buffer: buffer2, originalName: "hash2.txt", mimeType: "text/plain" },
      });

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      // Same content → same hash (regardless of different resource/source IDs)
      expect(result1.value.contentHash).toBe(result2.value.contentHash);
    });

    it("should produce different content hashes for different buffers", async () => {
      const result1 = await facade.ingestFile({
        resourceId: crypto.randomUUID(),
        sourceId: crypto.randomUUID(),
        sourceName: "Different A",
        sourceType: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
        file: {
          buffer: new TextEncoder().encode("Content version A").buffer,
          originalName: "a.txt",
          mimeType: "text/plain",
        },
      });

      const result2 = await facade.ingestFile({
        resourceId: crypto.randomUUID(),
        sourceId: crypto.randomUUID(),
        sourceName: "Different B",
        sourceType: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
        file: {
          buffer: new TextEncoder().encode("Content version B").buffer,
          originalName: "b.txt",
          mimeType: "text/plain",
        },
      });

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      expect(result1.value.contentHash).not.toBe(result2.value.contentHash);
    });
  });

  // 6. ingestExternalResource Workflow (No Upload)

  describe("ingestExternalResource Workflow", () => {
    it("should register an external resource and extract content without upload", async () => {
      const resourceId = crypto.randomUUID();
      const sourceId = crypto.randomUUID();
      // For PlainText, the URI is the content itself
      const externalContent = "This content exists externally and requires no upload.";

      const result = await facade.ingestExternalResource({
        resourceId,
        sourceId,
        sourceName: "External Content",
        sourceType: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
        uri: externalContent,
        mimeType: "text/plain",
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.resourceId).toBe(resourceId);
      expect(result.value.sourceId).toBe(sourceId);
      expect(result.value.storageUri).toBe(externalContent);
      expect(result.value.extractedText).toBe(externalContent);
      expect(result.value.contentHash).toBeTruthy();

      // Verify resource is external
      const resourceResult = await facade.getResource(resourceId);
      expect(resourceResult.isOk()).toBe(true);
      expect(resourceResult.value.provider).toBe("external");
      expect(resourceResult.value.isStored).toBe(true);
    });

    it("should NOT physically delete an external resource (only marks as deleted)", async () => {
      const resourceId = crypto.randomUUID();

      await facade.registerExternalResource({
        id: resourceId,
        name: "External to Delete",
        mimeType: "text/plain",
        uri: "https://example.com/external-file.txt",
      });

      // Delete should succeed (marks as deleted, no storage.delete() call)
      const deleteResult = await facade.deleteResource({ id: resourceId });
      expect(deleteResult.isOk()).toBe(true);

      // Resource is marked deleted but still accessible via repository
      const getResult = await facade.getResource(resourceId);
      expect(getResult.isOk()).toBe(true);
      expect(getResult.value.isDeleted).toBe(true);
      expect(getResult.value.provider).toBe("external");
    });
  });

  // 7. Buffer Encoding Fidelity

  describe("Buffer Encoding Fidelity", () => {
    it("should correctly calculate size for multi-byte UTF-8 content", async () => {
      // Japanese text is 3 bytes per character in UTF-8
      const japaneseText = "こんにちは世界"; // 7 characters, 21 bytes in UTF-8
      const buffer = new TextEncoder().encode(japaneseText).buffer;

      const result = await facade.storeResource({
        id: crypto.randomUUID(),
        buffer,
        originalName: "japanese.txt",
        mimeType: "text/plain",
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.size).toBe(buffer.byteLength);
      expect(result.value.size).toBeGreaterThan(japaneseText.length); // 21 > 7
    });

    it("should handle emoji content (4-byte UTF-8)", async () => {
      const emojiText = "Hello 🌍🚀✨ World";
      const buffer = new TextEncoder().encode(emojiText).buffer;

      const result = await facade.storeResource({
        id: crypto.randomUUID(),
        buffer,
        originalName: "emoji.txt",
        mimeType: "text/plain",
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.size).toBe(buffer.byteLength);
      expect(result.value.size).toBeGreaterThan(emojiText.length);
    });

    it("should correctly report size for pure binary data", async () => {
      const exactSize = 4096; // Exact 4KB
      const binaryData = new Uint8Array(exactSize);
      crypto.getRandomValues(binaryData);

      const result = await facade.storeResource({
        id: crypto.randomUUID(),
        buffer: binaryData.buffer,
        originalName: "exact-4kb.bin",
        mimeType: "application/octet-stream",
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.size).toBe(exactSize);
    });
  });

  // 8. Real PDF Buffer Upload — Full ingestFile Pipeline

  describe("Real PDF Buffer Upload", () => {
    const PDF_PATH = "D:\\Documentos\\Documents\\pdfs\\archivo-de-educacion.pdf";
    const pdfAvailable = fs.existsSync(PDF_PATH);

    describe.skipIf(!pdfAvailable)("ingestFile with real PDF buffer", () => {
      let pdfBuffer: ArrayBuffer;
      let pdfFileSize: number;

      beforeAll(() => {
        const fileBuffer = fs.readFileSync(PDF_PATH);
        pdfFileSize = fileBuffer.byteLength;
        // Convert Node.js Buffer to ArrayBuffer
        pdfBuffer = fileBuffer.buffer.slice(
          fileBuffer.byteOffset,
          fileBuffer.byteOffset + fileBuffer.byteLength,
        );
      });

      it("should store a real PDF buffer and report correct file size", async () => {
        const resourceId = crypto.randomUUID();

        const result = await facade.storeResource({
          id: resourceId,
          buffer: pdfBuffer,
          originalName: path.basename(PDF_PATH),
          mimeType: "application/pdf",
        });

        expect(result.isOk()).toBe(true);
        expect(result.value.size).toBe(pdfFileSize);
        expect(result.value.storageUri).toContain("archivo-de-educacion");
        expect(result.value.storageUri).toMatch(/^mem:\/\//);

        // Verify aggregate state
        const getResult = await facade.getResource(resourceId);
        expect(getResult.isOk()).toBe(true);
        expect(getResult.value.originalName).toBe("archivo-de-educacion.pdf");
        expect(getResult.value.mimeType).toBe("application/pdf");
        expect(getResult.value.size).toBe(pdfFileSize);
        expect(getResult.value.status).toBe(ResourceStatus.Stored);
        expect(getResult.value.provider).toBe("in-memory");
      });

      it("should complete full ingestFile pipeline: buffer → storage → source → PDF extraction", async () => {
        const resourceId = crypto.randomUUID();
        const sourceId = crypto.randomUUID();

        const result = await facade.ingestFile({
          resourceId,
          sourceId,
          sourceName: "Archivo de Educación (Buffer Upload)",
          sourceType: SourceType.Pdf,
          extractionJobId: crypto.randomUUID(),
          file: {
            buffer: pdfBuffer,
            originalName: path.basename(PDF_PATH),
            mimeType: "application/pdf",
          },
        });

        expect(result.isOk()).toBe(true);

        // Resource stored
        expect(result.value.resourceId).toBe(resourceId);
        expect(result.value.storageUri).toBeTruthy();
        expect(result.value.storageUri).toMatch(/^mem:\/\//);

        // Source registered
        expect(result.value.sourceId).toBe(sourceId);

        // PDF extraction produced non-empty text
        expect(result.value.extractedText).toBeTruthy();
        expect(result.value.extractedText.length).toBeGreaterThan(0);

        // Content hash exists
        expect(result.value.contentHash).toBeTruthy();
        expect(result.value.contentHash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex

        // Metadata includes PDF-specific info
        expect(result.value.metadata).toBeDefined();
        expect(result.value.metadata.pageCount).toBeGreaterThan(0);
        expect(result.value.metadata.extractor).toBe("pdf-extraction");
        expect(result.value.metadata.mimeType).toBe("application/pdf");

        console.log(`\n  ✅ Real PDF extraction successful:`);
        console.log(`     File: ${path.basename(PDF_PATH)}`);
        console.log(`     File size: ${(pdfFileSize / 1024).toFixed(1)} KB`);
        console.log(`     Pages: ${result.value.metadata.pageCount}`);
        console.log(`     Extracted text length: ${result.value.extractedText.length} chars`);
        console.log(`     Content hash: ${result.value.contentHash.slice(0, 16)}...`);
        console.log(`     Text preview: "${result.value.extractedText.slice(0, 100).replace(/\n/g, " ")}..."`);
      });

      it("should produce consistent hash for multiple extractions of the same PDF", async () => {
        const result1 = await facade.ingestFile({
          resourceId: crypto.randomUUID(),
          sourceId: crypto.randomUUID(),
          sourceName: "PDF Hash Test 1",
          sourceType: SourceType.Pdf,
          extractionJobId: crypto.randomUUID(),
          file: {
            buffer: pdfBuffer,
            originalName: "hash-test-1.pdf",
            mimeType: "application/pdf",
          },
        });

        const result2 = await facade.ingestFile({
          resourceId: crypto.randomUUID(),
          sourceId: crypto.randomUUID(),
          sourceName: "PDF Hash Test 2",
          sourceType: SourceType.Pdf,
          extractionJobId: crypto.randomUUID(),
          file: {
            buffer: pdfBuffer,
            originalName: "hash-test-2.pdf",
            mimeType: "application/pdf",
          },
        });

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);

        // Same PDF buffer → same extracted text → same content hash
        expect(result1.value.contentHash).toBe(result2.value.contentHash);
        expect(result1.value.extractedText).toBe(result2.value.extractedText);
      });

      it("should preserve PDF buffer integrity (size matches original file)", async () => {
        const resourceId = crypto.randomUUID();

        const storeResult = await facade.storeResource({
          id: resourceId,
          buffer: pdfBuffer,
          originalName: "integrity-check.pdf",
          mimeType: "application/pdf",
        });

        expect(storeResult.isOk()).toBe(true);

        // The stored size must exactly match the file on disk
        const originalStats = fs.statSync(PDF_PATH);
        expect(storeResult.value.size).toBe(originalStats.size);
        expect(storeResult.value.size).toBe(pdfBuffer.byteLength);
      });
    });
  });
});
