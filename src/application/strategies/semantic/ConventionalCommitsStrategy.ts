import {
  INVALID_SEMANTIC_TYPE,
  SEMANTIC_TYPES,
  type SemanticType,
} from '../../../domain/enums/SemanticType';
import type { SemanticAnalysis } from '../../../domain/value-objects/SemanticAnalysis';
import type { SemanticValidationStrategy } from './SemanticValidationStrategy';

export interface ConventionalCommitsOptions {
  allowedTypes: readonly string[];
  requireScope: boolean;
  maxTitleLength: number;
}

export const DEFAULT_CONVENTIONAL_OPTIONS: ConventionalCommitsOptions = {
  allowedTypes: SEMANTIC_TYPES,
  requireScope: false,
  maxTitleLength: 72,
};

const HEADER = /^([A-Za-z]+)(?:\(([^()]*)\))?(!)?:(\s*)(.*)$/;

const KEYWORDS: Array<[RegExp, SemanticType]> = [
  [/\b(revert|rollback|undo)\b/i, 'revert'],
  [/\b(fix|bug|error|hotfix|corrig\w*|arregl\w*)\b/i, 'fix'],
  [/\b(doc|docs|readme|documentaci\w*)\b/i, 'docs'],
  [/\b(test|tests|coverage|cobertura|prueba\w*)\b/i, 'test'],
  [/\b(refactor\w*|clean\w*|limpi\w*)\b/i, 'refactor'],
  [/\b(perf\w*|optimi\w*|speed|rendimiento)\b/i, 'perf'],
  [/\b(ci|pipeline|deploy\w*|workflow|despliegue)\b/i, 'ci'],
  [/\b(build|depend\w*|package|bundle)\b/i, 'build'],
  [/\b(style|format\w*|lint\w*|estilo\w*)\b/i, 'style'],
  [/\b(add|new|feature|implement\w*|agreg\w*|nuev\w*|funcionalidad)\b/i, 'feat'],
];

function guessType(title: string): SemanticType {
  return KEYWORDS.find(([pattern]) => pattern.test(title))?.[1] ?? 'chore';
}

function guessScope(title: string): string {
  const match = /\b(?:en|in|for|de|del)\s+([a-z0-9][\w-]{1,20})$/i.exec(title.trim());
  return match ? match[1].toLowerCase() : '';
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** Valida el formato Conventional Commits: tipo(scope)!: descripción. No evalúa el código. */
export class ConventionalCommitsStrategy implements SemanticValidationStrategy {
  constructor(
    private readonly options: ConventionalCommitsOptions = DEFAULT_CONVENTIONAL_OPTIONS,
  ) {}

  analyze(rawTitle: string): SemanticAnalysis {
    const title = rawTitle.trim();
    const base = {
      title,
      type: INVALID_SEMANTIC_TYPE,
      scope: '',
      description: '',
      breaking: false,
    } as const;

    if (!title) {
      return {
        ...base,
        valid: false,
        errors: ['El título está vacío'],
        suggestions: ['Usa el formato tipo(scope): descripción, por ejemplo feat(auth): add login'],
      };
    }

    const match = HEADER.exec(title);
    if (!match) {
      const type = guessType(title);
      const scope = guessScope(title);
      const scopePart = scope ? `(${scope})` : '';
      return {
        ...base,
        valid: false,
        errors: ['El título no sigue el formato tipo(scope): descripción'],
        suggestions: [
          `${type}${scopePart}: ${lowerFirst(title)}`,
          'Formato esperado: tipo(scope)!: descripción',
        ],
      };
    }

    const [, rawType, rawScope, bang, space, rawDescription] = match;
    const description = rawDescription.trim();
    const errors: string[] = [];
    const suggestions: string[] = [];
    const lowerType = rawType.toLowerCase();
    const isKnown = (value: string) =>
      (SEMANTIC_TYPES as readonly string[]).includes(value) &&
      this.options.allowedTypes.includes(value);

    const typeRecognized = isKnown(rawType);
    if (!typeRecognized) {
      if (isKnown(lowerType)) {
        errors.push(`El tipo "${rawType}" debe escribirse en minúsculas`);
        suggestions.push(`Usa "${lowerType}" en lugar de "${rawType}"`);
      } else {
        errors.push(`El tipo "${rawType}" no es válido`);
        suggestions.push(`Tipos permitidos: ${this.options.allowedTypes.join(', ')}`);
      }
    }
    if (rawScope !== undefined && rawScope.trim() === '') {
      errors.push('El scope entre paréntesis está vacío');
      suggestions.push('Elimina los paréntesis o indica un scope, por ejemplo (auth)');
    }
    if (rawScope !== undefined && /\s/.test(rawScope.trim())) {
      errors.push('El scope no debe contener espacios');
      suggestions.push(`Usa "${rawScope.trim().replace(/\s+/g, '-')}" como scope`);
    }
    if (this.options.requireScope && !rawScope?.trim()) {
      errors.push('El scope es obligatorio según la configuración');
      suggestions.push(`Agrega un scope: ${lowerType}(scope): ${description || 'descripción'}`);
    }
    if (!space && description) {
      errors.push('Falta un espacio después de los dos puntos');
      suggestions.push(`${rawType}${rawScope ? `(${rawScope})` : ''}${bang ?? ''}: ${description}`);
    }
    if (!description) {
      errors.push('Falta la descripción después de los dos puntos');
      suggestions.push('Describe el cambio, por ejemplo: fix(api): resolve validation error');
    }
    if (title.length > this.options.maxTitleLength) {
      errors.push(
        `El título tiene ${title.length} caracteres (máximo ${this.options.maxTitleLength})`,
      );
      suggestions.push('Acorta la descripción y mueve los detalles al cuerpo del Pull Request');
    }

    return {
      title,
      type: typeRecognized ? (rawType as SemanticType) : INVALID_SEMANTIC_TYPE,
      scope: rawScope?.trim() ?? '',
      description,
      breaking: Boolean(bang),
      valid: errors.length === 0,
      errors,
      suggestions,
    };
  }
}
