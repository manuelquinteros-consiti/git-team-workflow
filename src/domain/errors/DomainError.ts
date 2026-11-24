export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {}
export class NotFoundError extends DomainError {}
/** Operación rechazada porque otros registros dependen del recurso. */
export class ReferentialIntegrityError extends DomainError {}
