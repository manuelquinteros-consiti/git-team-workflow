import type { SemanticAnalysis } from '../../../domain/value-objects/SemanticAnalysis';

/** Estrategia de validación de títulos. Permite incorporar otras convenciones o análisis con IA. */
export interface SemanticValidationStrategy {
  analyze(title: string): SemanticAnalysis;
}
