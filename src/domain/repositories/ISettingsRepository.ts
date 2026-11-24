import type { Settings } from '../entities/Settings';

export interface ISettingsRepository {
  get(): Promise<Settings>;
  save(settings: Settings): Promise<void>;
  /** Restablece la configuración a sus valores iniciales. */
  reset(): Promise<Settings>;
}
