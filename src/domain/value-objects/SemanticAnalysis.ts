import type { SemanticTypeOrInvalid } from '../enums/SemanticType';

/** Resultado del análisis del formato de un título. No evalúa el contenido del código. */
export interface SemanticAnalysis {
  title: string;
  type: SemanticTypeOrInvalid;
  scope: string;
  description: string;
  breaking: boolean;
  valid: boolean;
  errors: string[];
  suggestions: string[];
}
