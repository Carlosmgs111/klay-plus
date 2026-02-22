import type { ResourceStorage } from "../../domain/ResourceStorage.js";

/**
 * In-memory resource storage for testing purposes.
 * Stores buffers in a Map keyed by URI.
 */
export class InMemoryResourceStorage implements ResourceStorage {
  private store = new Map<string, { buffer: ArrayBuffer; name: string }>();

  async upload(params: {
    buffer: ArrayBuffer;
    originalName: string;
    mimeType: string;
  }): Promise<{ uri: string; size: number }> {
    const uri = `mem://${crypto.randomUUID()}/${params.originalName}`;
    this.store.set(uri, {
      buffer: params.buffer,
      name: params.originalName,
    });
    return { uri, size: params.buffer.byteLength };
  }

  async delete(uri: string): Promise<void> {
    this.store.delete(uri);
  }

  async exists(uri: string): Promise<boolean> {
    return this.store.has(uri);
  }
}
