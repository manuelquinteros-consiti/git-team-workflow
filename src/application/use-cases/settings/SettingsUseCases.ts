import type { Settings } from '../../../domain/entities/Settings';
import { ValidationError } from '../../../domain/errors/DomainError';
import { SEMANTIC_TYPES } from '../../../domain/enums/SemanticType';
import type { ISettingsRepository } from '../../../domain/repositories/ISettingsRepository';
import type { IDataResetter } from '../../ports/IDataResetter';
import type { IEventBus } from '../../ports/IEventBus';

export class GetSettings {
  constructor(private readonly settings: ISettingsRepository) {}
  execute(): Promise<Settings> {
    return this.settings.get();
  }
}

export class UpdateSettings {
  constructor(
    private readonly settings: ISettingsRepository,
    private readonly events: IEventBus,
  ) {}

  async execute(
    patch: Partial<Omit<Settings, 'semantic'>> & { semantic?: Partial<Settings['semantic']> },
  ) {
    const current = await this.settings.get();
    const next: Settings = {
      ...current,
      ...patch,
      semantic: { ...current.semantic, ...patch.semantic },
    };
    if (![10, 20, 50].includes(next.pageSize)) throw new ValidationError('Paginación inválida');
    if (next.semantic.maxTitleLength < 20 || next.semantic.maxTitleLength > 200)
      throw new ValidationError('La longitud máxima debe estar entre 20 y 200 caracteres');
    const allowed = next.semantic.allowedTypes.filter((t) =>
      (SEMANTIC_TYPES as readonly string[]).includes(t),
    );
    if (allowed.length === 0)
      throw new ValidationError('Debe permitirse al menos un tipo semántico');
    next.semantic.allowedTypes = allowed;
    await this.settings.save(next);
    this.events.publish({ type: 'data-changed', entity: 'settings' });
    return next;
  }
}

export class ResetSettings {
  constructor(
    private readonly settings: ISettingsRepository,
    private readonly events: IEventBus,
  ) {}
  async execute(): Promise<Settings> {
    const defaults = await this.settings.reset();
    this.events.publish({ type: 'data-changed', entity: 'settings' });
    return defaults;
  }
}

export class ResetSimulatedData {
  constructor(
    private readonly resetter: IDataResetter,
    private readonly events: IEventBus,
  ) {}
  async execute(): Promise<void> {
    await this.resetter.resetSimulatedData();
    this.events.publish({ type: 'data-changed', entity: 'all' });
  }
}
