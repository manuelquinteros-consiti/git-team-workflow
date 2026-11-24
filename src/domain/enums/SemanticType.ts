/** Tipos definidos por Conventional Commits. */
export const SEMANTIC_TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
] as const;
export type SemanticType = (typeof SEMANTIC_TYPES)[number];

export const INVALID_SEMANTIC_TYPE = 'Inválido' as const;
export type SemanticTypeOrInvalid = SemanticType | typeof INVALID_SEMANTIC_TYPE;
