import { ValueObject } from "./ValueObject";

interface UniqueIdProps {
  value: string;
}

export class UniqueId extends ValueObject<UniqueIdProps> {
  get value(): string {
    return this.props.value;
  }

  static create(value: string): UniqueId {
    if (!value || value.trim().length === 0) {
      throw new Error("UniqueId cannot be empty");
    }
    return new UniqueId({ value });
  }

  toString(): string {
    return this.props.value;
  }
}
