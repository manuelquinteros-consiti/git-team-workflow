import { useEffect, useState } from 'react';
import { useDependencies } from '../../../app/providers/DependenciesProvider';
import { EMPTY_FILTERS } from '../../../application/dto/PullRequestQuery';
import type { SemanticAnalysis } from '../../../domain/value-objects/SemanticAnalysis';
import { Badge, SEMANTIC_TONE } from '../../components/common/Badge';
import { MetricCard } from '../../components/common/MetricCard';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState, ErrorState } from '../../components/common/States';
import { SemanticDistributionChart } from '../../components/charts/Charts';
import { useAsyncData, useDataVersion } from '../../hooks/useAsyncData';
import { useUiStore } from '../../store/uiStore';

const EXAMPLES = [
  'feat(auth): implement authentication',
  'fix(api): resolve validation error',
  'docs: update README',
  'feat(api)!: change response structure',
  'Update code',
  'Fix bugs',
];

function Simulator() {
  const { useCases } = useDependencies();
  const [title, setTitle] = useState('feat(auth): implement authentication');
  const [result, setResult] = useState<SemanticAnalysis | null>(null);
  const version = useDataVersion(); // reevalúa el título cuando cambia la configuración semántica

  useEffect(() => {
    let cancelled = false;
    useCases.analyzeTitle.execute(title).then((r) => !cancelled && setResult(r));
    return () => {
      cancelled = true;
    };
  }, [useCases, title, version]);

  return (
    <section className="card">
      <h2>Simulador de validación</h2>
      <label>
        Título del Pull Request
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Título a validar"
        />
      </label>
      <div className="chips">
        {EXAMPLES.map((example) => (
          <button key={example} type="button" className="chip" onClick={() => setTitle(example)}>
            {example}
          </button>
        ))}
      </div>
      {result && (
        <div className={result.valid ? 'result ok' : 'result bad'} aria-live="polite">
          <p>
            <strong>{result.valid ? 'Título válido' : 'Título inválido'}</strong>
          </p>
          <dl className="stats">
            <div>
              <dt>Tipo</dt>
              <dd>{result.type}</dd>
            </div>
            <div>
              <dt>Scope</dt>
              <dd>{result.scope || '—'}</dd>
            </div>
            <div>
              <dt>Breaking</dt>
              <dd>{result.breaking ? 'Sí' : 'No'}</dd>
            </div>
            <div>
              <dt>Descripción</dt>
              <dd>{result.description || '—'}</dd>
            </div>
          </dl>
          {result.errors.length > 0 && (
            <ul className="reasons">
              {result.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          {result.suggestions.length > 0 && (
            <>
              <h4>Sugerencias</h4>
              <ul>
                {result.suggestions.map((s) => (
                  <li key={s}>
                    <code>{s}</code>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      <small>Se valida el formato del título, no el contenido real del código.</small>
    </section>
  );
}

export function SemanticAnalysisPage() {
  const { useCases } = useDependencies();
  const select = useUiStore((s) => s.selectPullRequest);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const metrics = useAsyncData(
    () => useCases.getDashboardMetrics.execute({ from: '', to: '' }),
    [useCases],
  );
  const invalid = useAsyncData(
    () =>
      useCases.queryPullRequests.execute({
        filters: { ...EMPTY_FILTERS, validity: 'invalid' },
        sortBy: 'date',
        sortDirection: 'desc',
        groupBy: '',
        page,
        pageSize,
      }),
    [useCases, page, pageSize],
  );

  return (
    <>
      <PageHeader
        title="Análisis semántico"
        description="Validación de títulos según Conventional Commits"
      />
      <Simulator />
      {metrics.data && (
        <>
          <div className="metrics">
            <MetricCard label="Cumplimiento" value={`${metrics.data.compliance}%`} />
            <MetricCard label="Válidos" value={metrics.data.validTitles} />
            <MetricCard label="Inválidos" value={metrics.data.invalidTitles} />
            <MetricCard label="Breaking changes" value={metrics.data.breaking} />
          </div>
          <div className="charts">
            <SemanticDistributionChart data={metrics.data.bySemantic} />
          </div>
        </>
      )}
      <section className="card">
        <h2>Títulos que incumplen la convención {invalid.data && `(${invalid.data.total})`}</h2>
        {invalid.error && <ErrorState message={invalid.error} />}
        {invalid.data?.total === 0 && (
          <EmptyState title="Todos los títulos cumplen la convención" />
        )}
        <ul className="plain-list">
          {invalid.data?.items.map(({ pr, semantic }) => (
            <li key={pr.id} className="violation">
              <button type="button" className="title-button" onClick={() => select(pr.id)}>
                #{pr.id} · {pr.title}
              </button>
              <Badge tone={SEMANTIC_TONE[semantic.type]}>{semantic.type}</Badge>
              <ul className="reasons">
                {semantic.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              <small>
                Sugerencia: <code>{semantic.suggestions[0]}</code>
              </small>
            </li>
          ))}
        </ul>
        {invalid.data && (
          <Pagination
            page={invalid.data.page}
            pageCount={invalid.data.pageCount}
            pageSize={pageSize}
            total={invalid.data.total}
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(0);
            }}
          />
        )}
      </section>
    </>
  );
}
