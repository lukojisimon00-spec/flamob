/** Erreur métier : message destiné à l'utilisateur, en français. */
export class DomainError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = "DomainError";
  }
}

export function assert(condition: unknown, message: string, field?: string): asserts condition {
  if (!condition) throw new DomainError(message, field);
}
