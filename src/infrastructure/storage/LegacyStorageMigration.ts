import type { IKeyValueStorage } from '../../application/ports/IKeyValueStorage';
import { STORAGE_SCHEMA_VERSION } from '../../shared/constants';

const VERSION_KEY = 'schema-version';

/**
 * Migra datos persistidos por la versión 1 (claves teams, devs, repos, prs, theme)
 * al esquema actual sin perder los cambios del usuario.
 */
export function migrateLegacyStorage(storage: IKeyValueStorage): void {
  const version = storage.get<number>(VERSION_KEY) ?? 1;
  if (version >= STORAGE_SCHEMA_VERSION) return;

  const moves: Array<[from: string, to: string]> = [
    ['devs', 'developers'],
    ['repos', 'repositories'],
    ['prs', 'pullRequests'],
  ];
  for (const [from, to] of moves) {
    const value = storage.get<unknown>(from);
    if (Array.isArray(value)) storage.set(to, value);
    storage.remove(from);
  }

  const theme = storage.get<unknown>('theme');
  if (theme === 'dark' || theme === 'light') storage.set('settings', { theme });
  storage.remove('theme');

  // Los equipos conservan la misma clave y forma.
  if (!Array.isArray(storage.get<unknown>('teams'))) storage.remove('teams');
  storage.set(VERSION_KEY, STORAGE_SCHEMA_VERSION);
}
