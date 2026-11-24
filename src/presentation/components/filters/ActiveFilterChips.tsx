import { X } from 'lucide-react';
import type { ActiveFilter } from '../../../application/services/ActiveFilters';
import type { PullRequestFilters } from '../../../application/dto/PullRequestQuery';

interface Props {
  filters: ActiveFilter[];
  onRemove: (key: keyof PullRequestFilters | 'dates') => void;
  onClear: () => void;
}

export function ActiveFilterChips({ filters, onRemove, onClear }: Props) {
  if (filters.length === 0) return null;
  return (
    <div className="chips" aria-label="Filtros activos">
      {filters.map((f) => (
        <span key={f.key} className="chip active-chip">
          {f.label}
          <button
            type="button"
            className="icon-button"
            aria-label={`Quitar filtro ${f.label}`}
            onClick={() => onRemove(f.key)}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <button type="button" className="link" onClick={onClear}>
        Limpiar filtros
      </button>
    </div>
  );
}
