/**
 * Port interface for resource storage operations.
 *
 * Implementations handle the actual upload/delete of file content
 * to specific storage backends (local filesystem, Cloudinary, S3, etc.).
 */
export interface ResourceStorage {
  /**
   * Uploads a file buffer to storage.
   * Returns the URI and actual size of the stored file.
   */
  upload(params: {
    buffer: ArrayBuffer;
    originalName: string;
    mimeType: string;
  }): Promise<{ uri: string; size: number }>;

  /**
   * Deletes a resource from storage by its URI.
   */
  delete(uri: string): Promise<void>;

  /**
   * Checks if a resource exists at the given URI.
   */
  exists(uri: string): Promise<boolean>;
}
