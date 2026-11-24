import { X } from 'lucide-react';
import { useToasts } from '../../hooks/useToasts';

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="toaster" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.level}`}
          role={t.level === 'error' ? 'alert' : 'status'}
        >
          <span>{t.message}</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Cerrar notificación"
            onClick={() => dismiss(t.id)}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
