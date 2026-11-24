import type { IKeyValueStorage } from '../../application/ports/IKeyValueStorage';
import { ValidationError } from '../../domain/errors/DomainError';

/**
 * Colección persistida: se inicializa con datos semilla (JSON) la primera vez
 * y a partir de entonces lee y escribe en el almacenamiento.
 */
export class JsonCollection<T extends { id: number }> {
  constructor(
    private readonly storage: IKeyValueStorage,
    private readonly key: string,
    private readonly seed: () => T[],
  ) {}

  all(): T[] {
    const stored = this.storage.get<T[]>(this.key);
    if (Array.isArray(stored)) return stored;
    const initial = this.seed();
    this.storage.set(this.key, initial);
    return initial;
  }

  find(id: number): T | undefined {
    return this.all().find((item) => item.id === id);
  }

  upsert(item: T): T {
    const items = this.all();
    if (item.id === 0) {
      const created = { ...item, id: Math.max(0, ...items.map((i) => i.id)) + 1 };
      this.storage.set(this.key, [...items, created]);
      return created;
    }
    if (!items.some((i) => i.id === item.id))
      throw new ValidationError(`No existe el registro ${item.id}`);
    this.storage.set(
      this.key,
      items.map((i) => (i.id === item.id ? item : i)),
    );
    return item;
  }

  remove(id: number): void {
    this.storage.set(
      this.key,
      this.all().filter((i) => i.id !== id),
    );
  }

  clear(): void {
    this.storage.remove(this.key);
  }
}
