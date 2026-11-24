import type { IKeyValueStorage } from '../../application/ports/IKeyValueStorage';
import type { Settings } from '../../domain/entities/Settings';
import type { ISettingsRepository } from '../../domain/repositories/ISettingsRepository';

type StoredSettings = Partial<Omit<Settings, 'semantic'>> & {
  semantic?: Partial<Settings['semantic']>;
};

export class JsonSettingsRepository implements ISettingsRepository {
  private static readonly KEY = 'settings';

  constructor(
    private readonly storage: IKeyValueStorage,
    private readonly defaults: Settings,
  ) {}

  async get(): Promise<Settings> {
    const stored = this.storage.get<StoredSettings>(JsonSettingsRepository.KEY) ?? {};
    return {
      ...this.defaults,
      ...stored,
      semantic: { ...this.defaults.semantic, ...stored.semantic },
    };
  }

  async save(settings: Settings): Promise<void> {
    this.storage.set(JsonSettingsRepository.KEY, settings);
  }

  async reset(): Promise<Settings> {
    this.storage.remove(JsonSettingsRepository.KEY);
    return this.get();
  }
}
