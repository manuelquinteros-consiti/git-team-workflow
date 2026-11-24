import { useDependencies } from '../../../app/providers/DependenciesProvider';
import { PIPELINE_STATUSES } from '../../../domain/enums/PipelineStatus';
import { PULL_REQUEST_STATUSES } from '../../../domain/enums/PullRequestStatus';
import { PULL_REQUEST_REVIEW_STATES } from '../../../domain/enums/ReviewState';
import { INVALID_SEMANTIC_TYPE, SEMANTIC_TYPES } from '../../../domain/enums/SemanticType';
import { describeActiveFilters } from '../../../application/services/ActiveFilters';
import { useCatalog } from '../../hooks/useCatalog';
import { usePullRequestFiltersStore } from '../../store/pullRequestFiltersStore';
import { DateRangeFilter } from './DateRangeFilter';
import { ActiveFilterChips } from './ActiveFilterChips';
import { Search } from 'lucide-react';

interface SelectProps<V extends string | number> {
  label: string;
  value: V | null | '';
  options: Array<{ value: V; label: string }>;
  onChange: (value: V | null) => void;
}

function FilterSelect<V extends string | number>({
  label,
  value,
  options,
  onChange,
}: SelectProps<V>) {
  return (
    <label>
      {label}
      <select
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') return onChange(null);
          const match = options.find((o) => String(o.value) === raw);
          onChange(match ? match.value : null);
        }}
      >
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const strings = <T extends string>(list: readonly T[]) => list.map((v) => ({ value: v, label: v }));

export function PullRequestFilterBar({ availableScopes }: { availableScopes: string[] }) {
  const { clock } = useDependencies();
  const catalog = useCatalog();
  const { filters, setFilter, patchFilters, removeFilter, clearFilters } =
    usePullRequestFiltersStore();
  const active = describeActiveFilters(filters, catalog);

  return (
    <section className="card filters" aria-label="Filtros de Pull Requests">
      <label className="search">
        <Search size={14} />
        <input
          type="search"
          placeholder="Buscar por título, #número, autor o repositorio"
          value={filters.q}
          onChange={(e) => setFilter('q', e.target.value)}
        />
      </label>
      <DateRangeFilter
        from={filters.from}
        to={filters.to}
        today={clock.today()}
        onChange={patchFilters}
      />
      <div className="filter-grid">
        <FilterSelect
          label="Equipo"
          value={filters.teamId}
          onChange={(v) => setFilter('teamId', v)}
          options={catalog.teams.map((t) => ({ value: t.id, label: t.name }))}
        />
        <FilterSelect
          label="Desarrollador"
          value={filters.developerId}
          onChange={(v) => setFilter('developerId', v)}
          options={catalog.developers.map((d) => ({ value: d.id, label: d.name }))}
        />
        <FilterSelect
          label="Repositorio"
          value={filters.repositoryId}
          onChange={(v) => setFilter('repositoryId', v)}
          options={catalog.repositories.map((r) => ({ value: r.id, label: r.name }))}
        />
        <FilterSelect
          label="Estado"
          value={filters.status}
          onChange={(v) => setFilter('status', v ?? '')}
          options={strings(PULL_REQUEST_STATUSES)}
        />
        <FilterSelect
          label="Tipo semántico"
          value={filters.type}
          onChange={(v) => setFilter('type', v ?? '')}
          options={strings([...SEMANTIC_TYPES, INVALID_SEMANTIC_TYPE])}
        />
        <FilterSelect
          label="Scope"
          value={filters.scope}
          onChange={(v) => setFilter('scope', v ?? '')}
          options={strings(availableScopes)}
        />
        <FilterSelect
          label="Revisión"
          value={filters.review}
          onChange={(v) => setFilter('review', v ?? '')}
          options={strings(PULL_REQUEST_REVIEW_STATES)}
        />
        <FilterSelect
          label="Pipeline"
          value={filters.pipeline}
          onChange={(v) => setFilter('pipeline', v ?? '')}
          options={strings(PIPELINE_STATUSES)}
        />
        <FilterSelect
          label="Semántica"
          value={filters.validity}
          onChange={(v) => setFilter('validity', v ?? '')}
          options={[
            { value: 'valid', label: 'Válida' },
            { value: 'invalid', label: 'Inválida' },
          ]}
        />
        <label className="checkbox">
          <input
            type="checkbox"
            checked={filters.breaking}
            onChange={(e) => setFilter('breaking', e.target.checked)}
          />
          Breaking changes
        </label>
      </div>
      <ActiveFilterChips filters={active} onRemove={removeFilter} onClear={clearFilters} />
    </section>
  );
}
