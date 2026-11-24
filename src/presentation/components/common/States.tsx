import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="state" role="status">
      <Inbox size={28} />
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="state state-error" role="alert">
      <AlertTriangle size={28} />
      <strong>Ocurrió un error</strong>
      <p>{message}</p>
    </div>
  );
}

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="state" role="status" aria-busy="true">
      <Loader2 size={24} className="spin" />
      <p>{label}</p>
    </div>
  );
}
