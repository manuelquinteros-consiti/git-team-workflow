import type { SemanticAnalysis } from '../../../domain/value-objects/SemanticAnalysis';
import type { SemanticAnalysisService } from '../../services/SemanticAnalysisService';

export class AnalyzeTitle {
  constructor(private readonly semantic: SemanticAnalysisService) {}
  execute(title: string): Promise<SemanticAnalysis> {
    return this.semantic.analyze(title);
  }
}
