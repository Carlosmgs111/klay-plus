/**
 * Resource Buffer Upload — E2E Tests
 *
 * Tests the complete buffer upload chain:
 *   buffer (ArrayBuffer) → ResourceStorage → Resource aggregate → persistence → retrieval
 *
 * Covers:
 * - Text and binary buffer upload and size verification
 * - Aggregate state verification
 * - Resource lifecycle: store → retrieve → delete → verify gone
 * - Validation of invalid inputs
 * - Full ingestFile workflow: buffer → storage → source → extraction
 * - Full ingestExternalResource workflow (no upload)
 * - Buffer encoding fidelity (UTF-8, emoji, binary)
 * - Real PDF buffer upload (conditional)
 *
 * Uses in-memory infrastructure for fast, isolated tests (no filesystem I/O).
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createSourceIngestionService } from "../service";
import { SourceType } from "../source/domain/SourceType";
import { ResourceStatus } from "../resource/domain/ResourceStatus";
import type { SourceIngestionService } from "../service/SourceIngestionService";
import * as fs from "fs";
import * as path from "path";

describe("Resource Buffer Upload — E2E", () => {
  let service: SourceIngestionService;

  beforeAll(async () => {
    service = await createSourceIngestionService({
      provider: "in-memory",
    });
  });

  // 1. Basic Buffer Upload

  describe("Basic Buffer Upload", () => {
    it("should upload text buffers with correct URI, size, and handle special characters", async () => {
      const content = "Hello, this is a plain text file content for upload testing.";
      const buffer = new TextEncoder().encode(content).buffer;
      const resourceId = crypto.randomUUID();

      const result = await service.storeResource({
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
      expect(result.value.size).toBe(content.length);

      // Special characters in filename
      const specialResult = await service.storeResource({
        id: crypto.randomUUID(),
        buffer: new TextEncoder().encode("content").buffer,
        originalName: "my document (v2) — final.txt",
        mimeType: "text/plain",
      });

      expect(specialResult.isOk()).toBe(true);
      expect(specialResult.value.storageUri).toBeTruthy();
      expect(specialResult.value.size).toBe(7);
    });

    it("should upload binary buffers (simulated PDF and image)", async () => {
      // Simulated PDF
      const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
      const binaryData = new Uint8Array(1024);
      crypto.getRandomValues(binaryData);

      const pdfCombined = new Uint8Array(pdfHeader.length + binaryData.length);
      pdfCombined.set(pdfHeader, 0);
      pdfCombined.set(binaryData, pdfHeader.length);

      const pdfResult = await service.storeResource({
        id: crypto.randomUUID(),
        buffer: pdfCombined.buffer,
        originalName: "document.pdf",
        mimeType: "application/pdf",
      });

      expect(pdfResult.isOk()).toBe(true);
      expect(pdfResult.value.size).toBe(1028);
      expect(pdfResult.value.storageUri).toContain("document.pdf");

      // Simulated PNG
      const pngMagic = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const imageData = new Uint8Array(2048);
      crypto.getRandomValues(imageData);

      const pngCombined = new Uint8Array(pngMagic.length + imageData.length);
      pngCombined.set(pngMagic, 0);
      pngCombined.set(imageData, pngMagic.length);

      const pngResult = await service.storeResource({
        id: crypto.randomUUID(),
        buffer: pngCombined.buffer,
        originalName: "screenshot.png",
        mimeType: "image/png",
      });

      expect(pngResult.isOk()).toBe(true);
      expect(pngResult.value.size).toBe(pngMagic.length + imageData.length);
    });

    it("should upload a large buffer (100KB)", async () => {
      const totalSize = 100 * 1024;
      const largeData = new Uint8Array(totalSize);
      const chunkSize = 65536;
      for (let offset = 0; offset < totalSize; offset += chunkSize) {
        const size = Math.min(chunkSize, totalSize - offset);
        crypto.getRandomValues(largeData.subarray(offset, offset + size));
      }

      const result = await service.storeResource({
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

      const result = await service.storeResource({
        id: crypto.randomUUID(),
        buffer: emptyBuffer,
        originalName: "empty.txt",
        mimeType: "text/plain",
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.size).toBe(0);
    });
  });

  // 2. Aggregate State Verification

  describe("Aggregate State After Upload", () => {
    it("should create a Resource aggregate with correct metadata after buffer upload", async () => {
      const content = "Aggregate state verification content.";
      const buffer = new TextEncoder().encode(content).buffer;
      const resourceId = crypto.randomUUID();

      await service.storeResource({
        id: resourceId,
        buffer,
        originalName: "state-test.txt",
        mimeType: "text/plain",
      });

      const getResult = await service.getResource(resourceId);
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

      await service.registerExternalResource({
        id: resourceId,
        name: "Annual Report 2024",
        mimeType: "application/pdf",
        uri: externalUri,
        size: 5_000_000,
      });

      const getResult = await service.getResource(resourceId);
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

      const result1 = await service.storeResource({
        id: crypto.randomUUID(),
        buffer,
        originalName: "same-name.txt",
        mimeType: "text/plain",
      });

      const result2 = await service.storeResource({
        id: crypto.randomUUID(),
        buffer: new TextEncoder().encode("content B").buffer,
        originalName: "same-name.txt",
        mimeType: "text/plain",
      });

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      expect(result1.value.storageUri).not.toBe(result2.value.storageUri);
    });
  });

  // 3. Resource Lifecycle

  describe("Resource Lifecycle", () => {
    it("should complete the full lifecycle: store → retrieve → delete → verify gone", async () => {
      const resourceId = crypto.randomUUID();
      const content = "Lifecycle test content — this resource will be stored, retrieved, and deleted.";
      const buffer = new TextEncoder().encode(content).buffer;

      // Store
      const storeResult = await service.storeResource({
        id: resourceId,
        buffer,
        originalName: "lifecycle.txt",
        mimeType: "text/plain",
      });
      expect(storeResult.isOk()).toBe(true);
      const { storageUri } = storeResult.value;

      // Retrieve
      const getResult = await service.getResource(resourceId);
      expect(getResult.isOk()).toBe(true);
      expect(getResult.value.isStored).toBe(true);
      expect(getResult.value.storageUri).toBe(storageUri);

      // Delete
      const deleteResult = await service.deleteResource({ id: resourceId });
      expect(deleteResult.isOk()).toBe(true);

      // Verify deleted
      const getAfterDelete = await service.getResource(resourceId);
      expect(getAfterDelete.isOk()).toBe(true);
      expect(getAfterDelete.value.isDeleted).toBe(true);
      expect(getAfterDelete.value.status).toBe(ResourceStatus.Deleted);
    });

    it("should fail to delete a non-existent resource", async () => {
      const result = await service.deleteResource({
        id: "non-existent-resource-id",
      });

      expect(result.isFail()).toBe(true);
      expect(result.error.message).toContain("not found");
    });
  });

  // 4. Validation

  describe("Validation", () => {
    it("should reject uploads with invalid inputs (empty name, empty mime, whitespace, empty external name)", async () => {
      const buffer = new TextEncoder().encode("content").buffer;

      // Empty originalName
      const emptyName = await service.storeResource({
        id: crypto.randomUUID(),
        buffer,
        originalName: "",
        mimeType: "text/plain",
      });
      expect(emptyName.isFail()).toBe(true);

      // Empty mimeType
      const emptyMime = await service.storeResource({
        id: crypto.randomUUID(),
        buffer,
        originalName: "valid-name.txt",
        mimeType: "",
      });
      expect(emptyMime.isFail()).toBe(true);

      // Whitespace-only originalName
      const whitespaceName = await service.storeResource({
        id: crypto.randomUUID(),
        buffer,
        originalName: "   ",
        mimeType: "text/plain",
      });
      expect(whitespaceName.isFail()).toBe(true);

      // External resource with empty name
      const emptyExtName = await service.registerExternalResource({
        id: crypto.randomUUID(),
        name: "",
        mimeType: "application/pdf",
        uri: "https://example.com/file.pdf",
      });
      expect(emptyExtName.isFail()).toBe(true);
    });

    it("should reject duplicate resource ID", async () => {
      const resourceId = crypto.randomUUID();
      const buffer = new TextEncoder().encode("content").buffer;

      const first = await service.storeResource({
        id: resourceId,
        buffer,
        originalName: "first.txt",
        mimeType: "text/plain",
      });
      expect(first.isOk()).toBe(true);

      const second = await service.storeResource({
        id: resourceId,
        buffer: new TextEncoder().encode("different").buffer,
        originalName: "second.txt",
        mimeType: "text/plain",
      });
      expect(second.isFail()).toBe(true);
      expect(second.error.message).toContain("already exists");
    });
  });

  // 5. ingestFile Workflow

  describe("ingestFile Workflow — Buffer to Extraction", () => {
    it("should complete ingestFile pipeline and preserve Unicode content", async () => {
      // Basic text
      const resourceId = crypto.randomUUID();
      const sourceId = crypto.randomUUID();
      const originalContent = "This plain text document will be uploaded as a buffer, stored, registered as a source, and its content extracted.";
      const buffer = new TextEncoder().encode(originalContent).buffer;

      const result = await service.ingestFile({
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
      expect(result.value.resourceId).toBe(resourceId);
      expect(result.value.sourceId).toBe(sourceId);
      expect(result.value.storageUri).toMatch(/^mem:\/\//);
      expect(result.value.contentHash).toBeTruthy();
      expect(result.value.extractedText).toBe(originalContent);

      // Verify resource aggregate
      const resourceResult = await service.getResource(resourceId);
      expect(resourceResult.isOk()).toBe(true);
      expect(resourceResult.value.originalName).toBe("buffer-test.txt");
      expect(resourceResult.value.size).toBe(buffer.byteLength);
      expect(resourceResult.value.isStored).toBe(true);

      // Unicode content fidelity
      const unicodeContent = [
        "Line 1: Introduction to testing",
        "Line 2: 特殊文字テスト (Unicode test)",
        "Line 3: números y acentos: á é í ó ú ñ",
      ].join("\n");
      const unicodeBuffer = new TextEncoder().encode(unicodeContent).buffer;

      const unicodeResult = await service.ingestFile({
        resourceId: crypto.randomUUID(),
        sourceId: crypto.randomUUID(),
        sourceName: "Unicode Buffer Test",
        sourceType: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
        file: {
          buffer: unicodeBuffer,
          originalName: "unicode-test.txt",
          mimeType: "text/plain",
        },
      });

      expect(unicodeResult.isOk()).toBe(true);
      expect(unicodeResult.value.extractedText).toBe(unicodeContent);
    });

    it("should produce consistent hashes for identical content and different for different content", async () => {
      const content = "Deterministic content for hash verification.";
      const buffer1 = new TextEncoder().encode(content).buffer;
      const buffer2 = new TextEncoder().encode(content).buffer;

      const result1 = await service.ingestFile({
        resourceId: crypto.randomUUID(),
        sourceId: crypto.randomUUID(),
        sourceName: "Hash Test 1",
        sourceType: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
        file: { buffer: buffer1, originalName: "hash1.txt", mimeType: "text/plain" },
      });

      const result2 = await service.ingestFile({
        resourceId: crypto.randomUUID(),
        sourceId: crypto.randomUUID(),
        sourceName: "Hash Test 2",
        sourceType: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
        file: { buffer: buffer2, originalName: "hash2.txt", mimeType: "text/plain" },
      });

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      expect(result1.value.contentHash).toBe(result2.value.contentHash);

      // Different content → different hash
      const result3 = await service.ingestFile({
        resourceId: crypto.randomUUID(),
        sourceId: crypto.randomUUID(),
        sourceName: "Different Content",
        sourceType: SourceType.PlainText,
        extractionJobId: crypto.randomUUID(),
        file: {
          buffer: new TextEncoder().encode("Completely different content").buffer,
          originalName: "different.txt",
          mimeType: "text/plain",
        },
      });

      expect(result3.isOk()).toBe(true);
      expect(result1.value.contentHash).not.toBe(result3.value.contentHash);
    });
  });

  // 6. ingestExternalResource Workflow

  describe("ingestExternalResource Workflow", () => {
    it("should handle external resource lifecycle: register, extract, and delete", async () => {
      // Register and extract
      const resourceId = crypto.randomUUID();
      const sourceId = crypto.randomUUID();
      const externalContent = "This content exists externally and requires no upload.";

      const result = await service.ingestExternalResource({
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

      const resourceResult = await service.getResource(resourceId);
      expect(resourceResult.isOk()).toBe(true);
      expect(resourceResult.value.provider).toBe("external");
      expect(resourceResult.value.isStored).toBe(true);

      // Delete external resource (marks as deleted, no storage.delete() call)
      const deleteResourceId = crypto.randomUUID();
      await service.registerExternalResource({
        id: deleteResourceId,
        name: "External to Delete",
        mimeType: "text/plain",
        uri: "https://example.com/external-file.txt",
      });

      const deleteResult = await service.deleteResource({ id: deleteResourceId });
      expect(deleteResult.isOk()).toBe(true);

      const getResult = await service.getResource(deleteResourceId);
      expect(getResult.isOk()).toBe(true);
      expect(getResult.value.isDeleted).toBe(true);
      expect(getResult.value.provider).toBe("external");
    });
  });

  // 7. Buffer Encoding Fidelity

  describe("Buffer Encoding Fidelity", () => {
    it("should correctly handle multi-byte UTF-8, emoji, and binary data sizes", async () => {
      // Multi-byte UTF-8 (Japanese: 3 bytes per char)
      const japaneseText = "こんにちは世界";
      const jpBuffer = new TextEncoder().encode(japaneseText).buffer;

      const jpResult = await service.storeResource({
        id: crypto.randomUUID(),
        buffer: jpBuffer,
        originalName: "japanese.txt",
        mimeType: "text/plain",
      });

      expect(jpResult.isOk()).toBe(true);
      expect(jpResult.value.size).toBe(jpBuffer.byteLength);
      expect(jpResult.value.size).toBeGreaterThan(japaneseText.length);

      // Emoji (4 bytes per emoji in UTF-8)
      const emojiText = "Hello 🌍🚀✨ World";
      const emojiBuffer = new TextEncoder().encode(emojiText).buffer;

      const emojiResult = await service.storeResource({
        id: crypto.randomUUID(),
        buffer: emojiBuffer,
        originalName: "emoji.txt",
        mimeType: "text/plain",
      });

      expect(emojiResult.isOk()).toBe(true);
      expect(emojiResult.value.size).toBe(emojiBuffer.byteLength);
      expect(emojiResult.value.size).toBeGreaterThan(emojiText.length);

      // Pure binary data (exact 4KB)
      const exactSize = 4096;
      const binaryData = new Uint8Array(exactSize);
      crypto.getRandomValues(binaryData);

      const binResult = await service.storeResource({
        id: crypto.randomUUID(),
        buffer: binaryData.buffer,
        originalName: "exact-4kb.bin",
        mimeType: "application/octet-stream",
      });

      expect(binResult.isOk()).toBe(true);
      expect(binResult.value.size).toBe(exactSize);
    });
  });

  // 8. Real PDF Buffer Upload

  describe("Real PDF Buffer Upload", () => {
    const PDF_PATH = "D:\\Documentos\\Documents\\pdfs\\archivo-de-educacion.pdf";
    const pdfAvailable = fs.existsSync(PDF_PATH);

    describe.skipIf(!pdfAvailable)("ingestFile with real PDF buffer", () => {
      let pdfBuffer: ArrayBuffer;
      let pdfFileSize: number;

      beforeAll(() => {
        const fileBuffer = fs.readFileSync(PDF_PATH);
        pdfFileSize = fileBuffer.byteLength;
        pdfBuffer = fileBuffer.buffer.slice(
          fileBuffer.byteOffset,
          fileBuffer.byteOffset + fileBuffer.byteLength,
        );
      });

      it("should store a real PDF buffer with correct size and preserve integrity", async () => {
        const resourceId = crypto.randomUUID();

        const result = await service.storeResource({
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
        const getResult = await service.getResource(resourceId);
        expect(getResult.isOk()).toBe(true);
        expect(getResult.value.originalName).toBe("archivo-de-educacion.pdf");
        expect(getResult.value.mimeType).toBe("application/pdf");
        expect(getResult.value.size).toBe(pdfFileSize);
        expect(getResult.value.status).toBe(ResourceStatus.Stored);

        // Verify integrity matches original file
        const originalStats = fs.statSync(PDF_PATH);
        expect(result.value.size).toBe(originalStats.size);
        expect(result.value.size).toBe(pdfBuffer.byteLength);
      });

      it("should complete full ingestFile pipeline with consistent hashes", async () => {
        const resourceId = crypto.randomUUID();
        const sourceId = crypto.randomUUID();

        const result = await service.ingestFile({
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
        expect(result.value.resourceId).toBe(resourceId);
        expect(result.value.storageUri).toMatch(/^mem:\/\//);
        expect(result.value.sourceId).toBe(sourceId);
        expect(result.value.extractedText).toBeTruthy();
        expect(result.value.extractedText.length).toBeGreaterThan(0);
        expect(result.value.contentHash).toMatch(/^[a-f0-9]{64}$/);
        expect(result.value.metadata).toBeDefined();
        expect(result.value.metadata.pageCount).toBeGreaterThan(0);

        // Consistent hash for same PDF
        const result2 = await service.ingestFile({
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

        expect(result2.isOk()).toBe(true);
        expect(result.value.contentHash).toBe(result2.value.contentHash);
        expect(result.value.extractedText).toBe(result2.value.extractedText);
      });
    });
  });
});
