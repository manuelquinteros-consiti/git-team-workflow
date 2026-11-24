import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** 'drawer' abre un panel lateral; 'modal' un diálogo centrado. */
  variant?: 'modal' | 'drawer';
}

export function Modal({ title, onClose, children, variant = 'modal' }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={`overlay overlay-${variant}`} onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={variant === 'drawer' ? 'drawer' : 'modal'}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose}>
            <X size={16} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}
