import type { IKeyValueStorage } from '../../application/ports/IKeyValueStorage';
import { STORAGE_PREFIX } from '../../shared/constants';

/** Adapter: expone Web Storage (u otra implementación compatible) como IKeyValueStorage. */
export class LocalStorageAdapter implements IKeyValueStorage {
  constructor(
    private readonly backend: Storage,
    private readonly prefix: string = STORAGE_PREFIX,
  ) {}

  get<T>(key: string): T | null {
    const raw = this.backend.getItem(this.prefix + key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    this.backend.setItem(this.prefix + key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.backend.removeItem(this.prefix + key);
  }
}
