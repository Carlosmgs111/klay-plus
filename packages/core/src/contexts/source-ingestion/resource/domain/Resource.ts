import { AggregateRoot } from "../../../../shared/domain/index.js";
import { ResourceId } from "./ResourceId.js";
import type { ResourceStatus as ResourceStatusType } from "./ResourceStatus.js";
import { ResourceStatus } from "./ResourceStatus.js";
import { StorageLocation } from "./StorageLocation.js";
import { ResourceStored } from "./events/ResourceStored.js";
import { ResourceDeleted } from "./events/ResourceDeleted.js";

/**
 * Resource aggregate — represents a physical file or external reference.
 *
 * A resource can be:
 * - A file uploaded by the user (buffer → storage provider → URI)
 * - An external reference (URI pointing to an existing location)
 *
 * It does NOT store the file content itself, only metadata and storage location.
 * The actual bytes are managed by the ResourceStorage port.
 */
export class Resource extends AggregateRoot<ResourceId> {
  private _originalName: string;
  private _mimeType: string;
  private _size: number;
  private _status: ResourceStatusType;
  private _storageLocation: StorageLocation | null;
  private _createdAt: Date;

  private constructor(
    id: ResourceId,
    originalName: string,
    mimeType: string,
    size: number,
    status: ResourceStatusType,
    storageLocation: StorageLocation | null,
    createdAt: Date,
  ) {
    super(id);
    this._originalName = originalName;
    this._mimeType = mimeType;
    this._size = size;
    this._status = status;
    this._storageLocation = storageLocation;
    this._createdAt = createdAt;
  }

  get originalName(): string {
    return this._originalName;
  }

  get mimeType(): string {
    return this._mimeType;
  }

  get size(): number {
    return this._size;
  }

  get status(): ResourceStatusType {
    return this._status;
  }

  get storageLocation(): StorageLocation | null {
    return this._storageLocation;
  }

  get storageUri(): string | null {
    return this._storageLocation?.uri ?? null;
  }

  get provider(): string | null {
    return this._storageLocation?.provider ?? null;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get isStored(): boolean {
    return this._status === ResourceStatus.Stored;
  }

  get isDeleted(): boolean {
    return this._status === ResourceStatus.Deleted;
  }

  /**
   * Creates a resource from a successfully uploaded file.
   */
  static store(
    id: ResourceId,
    originalName: string,
    mimeType: string,
    size: number,
    storageLocation: StorageLocation,
  ): Resource {
    const resource = new Resource(
      id,
      originalName,
      mimeType,
      size,
      ResourceStatus.Stored,
      storageLocation,
      new Date(),
    );

    resource.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: ResourceStored.EVENT_TYPE,
      aggregateId: id.value,
      payload: {
        originalName,
        mimeType,
        size,
        provider: storageLocation.provider,
        storageUri: storageLocation.uri,
      },
    });

    return resource;
  }

  /**
   * Creates a resource from an external reference (no upload).
   */
  static reference(
    id: ResourceId,
    name: string,
    mimeType: string,
    externalUri: string,
    size?: number,
  ): Resource {
    const storageLocation = StorageLocation.external(externalUri);
    const resource = new Resource(
      id,
      name,
      mimeType,
      size ?? 0,
      ResourceStatus.Stored,
      storageLocation,
      new Date(),
    );

    resource.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: ResourceStored.EVENT_TYPE,
      aggregateId: id.value,
      payload: {
        originalName: name,
        mimeType,
        size: size ?? 0,
        provider: "external",
        storageUri: externalUri,
      },
    });

    return resource;
  }

  /**
   * Reconstitutes a resource from persistence (no events emitted).
   */
  static reconstitute(
    id: ResourceId,
    originalName: string,
    mimeType: string,
    size: number,
    status: ResourceStatusType,
    storageLocation: StorageLocation | null,
    createdAt: Date,
  ): Resource {
    return new Resource(id, originalName, mimeType, size, status, storageLocation, createdAt);
  }

  /**
   * Marks the resource as failed (storage upload failed).
   */
  markFailed(): void {
    this._status = ResourceStatus.Failed;
  }

  /**
   * Marks the resource as deleted and emits a ResourceDeleted event.
   */
  markDeleted(): void {
    this._status = ResourceStatus.Deleted;

    this.record({
      eventId: crypto.randomUUID(),
      occurredOn: new Date(),
      eventType: ResourceDeleted.EVENT_TYPE,
      aggregateId: this.id.value,
      payload: {
        originalName: this._originalName,
        storageUri: this._storageLocation?.uri,
      },
    });
  }
}
