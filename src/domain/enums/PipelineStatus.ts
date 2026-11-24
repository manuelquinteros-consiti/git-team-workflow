export const PIPELINE_STATUSES = ['Exitoso', 'Fallido', 'En ejecución', 'Pendiente'] as const;
export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];
