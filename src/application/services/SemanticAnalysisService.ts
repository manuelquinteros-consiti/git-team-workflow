import type { ISettingsRepository } from '../../domain/repositories/ISettingsRepository';
import type { SemanticAnalysis } from '../../domain/value-objects/SemanticAnalysis';
import type { SemanticValidationStrategy } from '../strategies/semantic/SemanticValidationStrategy';
import type { ConventionalCommitsOptions } from '../strategies/semantic/ConventionalCommitsStrategy';

export type SemanticStrategyFactory = (
  options: ConventionalCommitsOptions,
) => SemanticValidationStrategy;

/** Orquesta el análisis semántico seleccionando la estrategia según la configuración vigente. */
export class SemanticAnalysisService {
  constructor(
    private readonly settings: ISettingsRepository,
    private readonly createStrategy: SemanticStrategyFactory,
  ) {}

  async getStrategy(): Promise<SemanticValidationStrategy> {
    const { semantic } = await this.settings.get();
    return this.createStrategy(semantic);
  }

  async analyze(title: string): Promise<SemanticAnalysis> {
    return (await this.getStrategy()).analyze(title);
  }
}
