import type { ReactNode } from 'react';

export type Tone = 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'neutral';

export function Badge({
  tone = 'neutral',
  children,
  title,
}: {
  tone?: Tone;
  children: ReactNode;
  title?: string;
}) {
  return (
    <span className={`badge badge-${tone}`} title={title}>
      {children}
    </span>
  );
}

export const STATUS_TONE: Record<string, Tone> = {
  Abierto: 'success',
  Fusionado: 'purple',
  Cerrado: 'danger',
  Borrador: 'neutral',
  Exitoso: 'success',
  Fallido: 'danger',
  'En ejecución': 'warning',
  Pendiente: 'neutral',
  'En revisión': 'info',
  Aprobado: 'success',
  'Cambios solicitados': 'warning',
};

export const SEMANTIC_TONE: Record<string, Tone> = {
  feat: 'success',
  fix: 'danger',
  docs: 'info',
  style: 'neutral',
  refactor: 'warning',
  perf: 'warning',
  test: 'info',
  build: 'purple',
  ci: 'purple',
  chore: 'neutral',
  revert: 'danger',
  Inválido: 'danger',
};
