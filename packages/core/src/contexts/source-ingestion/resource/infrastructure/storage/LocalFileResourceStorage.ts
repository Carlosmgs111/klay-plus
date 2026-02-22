import type { ResourceStorage } from "../../domain/ResourceStorage.js";

/**
 * Local filesystem resource storage.
 * Stores files in a configurable base directory.
 */
export class LocalFileResourceStorage implements ResourceStorage {
  constructor(private readonly basePath: string) {}

  async upload(params: {
    buffer: ArrayBuffer;
    originalName: string;
    mimeType: string;
  }): Promise<{ uri: string; size: number }> {
    const fs = await import("fs/promises");
    const path = await import("path");

    // Ensure base directory exists
    await fs.mkdir(this.basePath, { recursive: true });

    // Generate unique filename to avoid collisions
    const uniquePrefix = crypto.randomUUID().slice(0, 8);
    const safeName = params.originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${uniquePrefix}-${safeName}`;
    const fullPath = path.join(this.basePath, filename);

    // Write file
    await fs.writeFile(fullPath, Buffer.from(params.buffer));

    return { uri: fullPath, size: params.buffer.byteLength };
  }

  async delete(uri: string): Promise<void> {
    const fs = await import("fs/promises");
    try {
      await fs.unlink(uri);
    } catch (error: unknown) {
      // Ignore if file already doesn't exist
      if (error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT") {
        return;
      }
      throw error;
    }
  }

  async exists(uri: string): Promise<boolean> {
    const fs = await import("fs/promises");
    try {
      await fs.access(uri);
      return true;
    } catch {
      return false;
    }
  }
}
