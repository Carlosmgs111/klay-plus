import { ValueObject } from "../../../../shared/domain";

interface StorageLocationProps {
  provider: string;
  uri: string;
}

/**
 * Represents where a resource is physically stored.
 * The provider identifies the storage backend (e.g., "local", "cloudinary", "external").
 * The uri is the fully qualified path or URL to the stored resource.
 */
export class StorageLocation extends ValueObject<StorageLocationProps> {
  get provider(): string {
    return this.props.provider;
  }

  get uri(): string {
    return this.props.uri;
  }

  static create(provider: string, uri: string): StorageLocation {
    if (!provider || provider.trim().length === 0) {
      throw new Error("StorageLocation provider is required");
    }
    if (!uri || uri.trim().length === 0) {
      throw new Error("StorageLocation uri is required");
    }
    return new StorageLocation({ provider, uri });
  }

  /**
   * Creates a storage location for externally referenced resources.
   */
  static external(uri: string): StorageLocation {
    return StorageLocation.create("external", uri);
  }
}
