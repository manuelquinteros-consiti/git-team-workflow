import {
  CheckCircle2,
  FileText,
  GitBranch,
  GitPullRequest,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import type { PullRequestView } from '../../../domain/value-objects/PullRequestView';
import { Avatar } from '../../components/common/Avatar';
import { Badge, SEMANTIC_TONE, STATUS_TONE } from '../../components/common/Badge';

interface Props {
  view: PullRequestView;
  showAvatar?: boolean;
  onOpen: (id: number) => void;
}

/** Fila vertical compacta inspirada en la lista de Pull Requests de GitHub. */
export function PullRequestItem({ view, showAvatar = true, onOpen }: Props) {
  const { pr, author, repository, team, semantic } = view;
  const authorName = author?.name ?? 'Sin autor';
  return (
    <article className="pr-item" data-testid="pr-item">
      <span className={`pr-icon status-${pr.status}`} title={pr.status}>
        <GitPullRequest size={18} />
      </span>
      <div className="pr-content">
        <div className="pr-title-row">
          <button type="button" className="title-button" onClick={() => onOpen(pr.id)}>
            {pr.title}
          </button>
          {semantic.breaking && (
            <Badge tone="danger" title="Breaking change">
              Breaking
            </Badge>
          )}
        </div>
        <div className="pr-meta">
          <span>#{pr.id}</span>
          {showAvatar && <Avatar name={authorName} size={18} />}
          <span>{authorName}</span>
          <span>{team?.name ?? 'Sin equipo'}</span>
          <span>{repository?.name ?? 'Sin repositorio'}</span>
          <span>
            {pr.date} {String(pr.hour).padStart(2, '0')}:00
          </span>
        </div>
        <div className="pr-meta">
          <span>
            <GitBranch size={12} /> {pr.source} → {pr.target}
          </span>
          <span title="Archivos modificados">
            <FileText size={12} /> {pr.files}
          </span>
          <span className="added">+{pr.additions}</span>
          <span className="removed">−{pr.deletions}</span>
          <span title="Comentarios">
            <MessageSquare size={12} /> {pr.comments}
          </span>
        </div>
      </div>
      <div className="pr-labels">
        <Badge tone={STATUS_TONE[pr.status]}>{pr.status}</Badge>
        <Badge tone={SEMANTIC_TONE[semantic.type]}>{semantic.type}</Badge>
        {semantic.scope && <Badge>{semantic.scope}</Badge>}
        <Badge tone={STATUS_TONE[pr.review]} title="Estado de revisión">
          {pr.review}
        </Badge>
        <Badge tone={STATUS_TONE[pr.pipeline]} title="Pipeline">
          CI: {pr.pipeline}
        </Badge>
        {semantic.valid ? (
          <span className="compliance ok" title="Título conforme a Conventional Commits">
            <CheckCircle2 size={16} />
          </span>
        ) : (
          <span className="compliance bad" title={semantic.errors.join('. ')}>
            <XCircle size={16} />
          </span>
        )}
      </div>
    </article>
  );
}
