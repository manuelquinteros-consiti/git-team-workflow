export const PULL_REQUEST_STATUSES = ['Abierto', 'Fusionado', 'Cerrado', 'Borrador'] as const;
export type PullRequestStatus = (typeof PULL_REQUEST_STATUSES)[number];
