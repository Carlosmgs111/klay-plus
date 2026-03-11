import type { NetworkConnection } from "./ConnectionConfig";

export type DistanceMetric = "cosine" | "euclidean" | "dotProduct";

export type VectorStoreConfig =
  | { type: "in-memory"; dimensions: number; distanceMetric?: DistanceMetric }
  | { type: "indexeddb"; dimensions: number; databaseName?: string; distanceMetric?: DistanceMetric }
  | { type: "nedb"; dimensions: number; path?: string; distanceMetric?: DistanceMetric }
  | {
      type: "pgvector";
      connection: NetworkConnection;
      authRef?: string;
      dimensions: number;
      tableName?: string;
      distanceMetric?: DistanceMetric;
      indexType?: "hnsw" | "ivfflat";
    }
  | {
      type: "pinecone";
      authRef: string;
      indexName: string;
      namespace?: string;
      dimensions: number;
      distanceMetric?: DistanceMetric;
      cloud?: string;
      region?: string;
    }
  | {
      type: "qdrant";
      connection: NetworkConnection;
      authRef?: string;
      collectionName: string;
      dimensions: number;
      distanceMetric?: DistanceMetric;
    }
  | {
      type: "chromadb";
      connection: NetworkConnection;
      authRef?: string;
      collectionName: string;
      dimensions: number;
      distanceMetric?: DistanceMetric;
      tenant?: string;
    }
  | {
      type: "weaviate";
      connection: NetworkConnection;
      authRef?: string;
      className: string;
      dimensions: number;
      distanceMetric?: DistanceMetric;
    }
  | {
      type: "milvus";
      connection: NetworkConnection;
      authRef?: string;
      collectionName: string;
      dimensions: number;
      distanceMetric?: DistanceMetric;
      indexType?: "hnsw" | "ivfflat" | "flat";
    };
