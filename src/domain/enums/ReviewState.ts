/** Estado global de revisión de un Pull Request. */
export const PULL_REQUEST_REVIEW_STATES = [
  'Pendiente',
  'En revisión',
  'Aprobado',
  'Cambios solicitados',
] as const;
export type PullRequestReviewState = (typeof PULL_REQUEST_REVIEW_STATES)[number];

/** Resultado individual de una revisión asignada a un revisor. */
export const REVIEW_STATUSES = ['Pendiente', 'Aprobado', 'Cambios solicitados'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
