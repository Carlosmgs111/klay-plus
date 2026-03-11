import type { PreparationStrategy } from "../../domain/ports/PreparationStrategy";

interface BasicPreparationConfig {
  normalizeWhitespace: boolean;
  normalizeEncoding: boolean;
  trimContent: boolean;
}

export class BasicPreparationStrategy implements PreparationStrategy {
  readonly strategyId = "basic";
  readonly version = 1;

  constructor(private readonly _config: BasicPreparationConfig) {}

  async prepare(content: string): Promise<string> {
    let result = content;

    if (this._config.normalizeEncoding) {
      result = result.normalize("NFC");
      result = result.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    }

    if (this._config.normalizeWhitespace) {
      result = result.replace(/[^\S\n]+/g, " ");   // collapse spaces/tabs to single space
      result = result.replace(/\n{3,}/g, "\n\n");   // collapse 3+ newlines to double
      result = result.replace(/ +\n/g, "\n");        // trim trailing whitespace per line
      result = result.replace(/\n +/g, "\n");        // trim leading whitespace per line
    }

    if (this._config.trimContent) {
      result = result.trim();
    }

    return result;
  }
}
