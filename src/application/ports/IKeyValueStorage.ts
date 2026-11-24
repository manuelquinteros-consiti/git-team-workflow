/** Puerto de persistencia clave/valor serializable. */
export interface IKeyValueStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}
