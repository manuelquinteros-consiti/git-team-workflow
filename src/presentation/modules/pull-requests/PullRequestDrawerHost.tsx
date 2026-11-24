import { useDependencies } from '../../../app/providers/DependenciesProvider';
import { Badge, SEMANTIC_TONE, STATUS_TONE } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ErrorState, LoadingState } from '../../components/common/States';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useUiStore } from '../../store/uiStore';

function PullRequestDetailContent({ id }: { id: number }) {
  const { useCases } = useDependencies();
  const { data, loading, error } = useAsyncData(
    () => useCases.getPullRequestDetail.execute(id),
    [useCases, id],
  );
  if (error) return <ErrorState message={error} />;
  if (loading || !data) return <LoadingState />;
  const { view, reviews } = data;
  const { pr, semantic } = view;

  return (
    <div className="detail">
      <h3>
        #{pr.id} · {pr.title}
      </h3>
      <div className="chips">
        <Badge tone={STATUS_TONE[pr.status]}>{pr.status}</Badge>
        <Badge tone={SEMANTIC_TONE[semantic.type]}>{semantic.type}</Badge>
        <Badge tone={STATUS_TONE[pr.review]}>{pr.review}</Badge>
        <Badge tone={STATUS_TONE[pr.pipeline]}>CI: {pr.pipeline}</Badge>
      </div>
      <dl>
        <dt>Autor</dt>
        <dd>{view.author?.name ?? '—'}</dd>
        <dt>Equipo</dt>
        <dd>{view.team?.name ?? '—'}</dd>
        <dt>Repositorio</dt>
        <dd>{view.repository?.name ?? '—'}</dd>
        <dt>Ramas</dt>
        <dd>
          {pr.source} → {pr.target}
        </dd>
        <dt>Creado</dt>
        <dd>
          {pr.date} {String(pr.hour).padStart(2, '0')}:00
        </dd>
        <dt>Cambios</dt>
        <dd>
          {pr.files} archivos · +{pr.additions} −{pr.deletions}
        </dd>
        <dt>Comentarios</dt>
        <dd>{pr.comments}</dd>
      </dl>
      <h4>Análisis semántico</h4>
      <p>
        {semantic.valid ? 'Cumple Conventional Commits.' : 'No cumple Conventional Commits.'} Tipo:{' '}
        <b>{semantic.type}</b>
        {semantic.scope && (
          <>
            {' '}
            · Scope: <b>{semantic.scope}</b>
          </>
        )}
        {semantic.breaking && (
          <>
            {' '}
            · <b>Breaking change</b>
          </>
        )}
      </p>
      {semantic.errors.length > 0 && (
        <ul className="reasons">
          {semantic.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {semantic.suggestions.length > 0 && (
        <>
          <h4>Sugerencias</h4>
          <ul>
            {semantic.suggestions.map((s) => (
              <li key={s}>
                <code>{s}</code>
              </li>
            ))}
          </ul>
        </>
      )}
      <small>El análisis verifica el formato del título, no el contenido del código.</small>
      <h4>Revisiones</h4>
      {reviews.length === 0 ? (
        <p>Sin revisores asignados.</p>
      ) : (
        <ul>
          {reviews.map(({ review, reviewer }) => (
            <li key={review.id}>
              {reviewer?.name ?? 'Revisor'} ·{' '}
              <Badge tone={STATUS_TONE[review.status]}>{review.status}</Badge>
              {review.responseHours !== null && <> · {review.responseHours} h</>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Drawer global: cualquier página abre el detalle con `useUiStore().selectPullRequest(id)`. */
export function PullRequestDrawerHost() {
  const { selectedPullRequestId, selectPullRequest } = useUiStore();
  if (selectedPullRequestId === null) return null;
  return (
    <Modal
      variant="drawer"
      title="Detalle del Pull Request"
      onClose={() => selectPullRequest(null)}
    >
      <PullRequestDetailContent id={selectedPullRequestId} />
    </Modal>
  );
}
