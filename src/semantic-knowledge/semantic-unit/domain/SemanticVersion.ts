import { ValueObject } from "../../../shared/domain/index.js";
import { Meaning } from "./Meaning.js";

interface SemanticVersionProps {
  version: number;
  meaning: Meaning;
  createdAt: Date;
  reason: string;
}

export class SemanticVersion extends ValueObject<SemanticVersionProps> {
  get version(): number {
    return this.props.version;
  }

  get meaning(): Meaning {
    return this.props.meaning;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get reason(): string {
    return this.props.reason;
  }

  static initial(meaning: Meaning): SemanticVersion {
    return new SemanticVersion({
      version: 1,
      meaning,
      createdAt: new Date(),
      reason: "Initial version",
    });
  }

  next(meaning: Meaning, reason: string): SemanticVersion {
    if (!reason || reason.trim().length === 0) {
      throw new Error("Version reason is required");
    }
    return new SemanticVersion({
      version: this.props.version + 1,
      meaning,
      createdAt: new Date(),
      reason,
    });
  }
}
