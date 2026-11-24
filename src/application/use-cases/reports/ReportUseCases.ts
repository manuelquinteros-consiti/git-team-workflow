import { byDateRange } from '../../../domain/specifications/pullRequestSpecifications';
import { NotFoundError } from '../../../domain/errors/DomainError';
import type { TableData } from '../../../shared/types';
import type { IFileDownloader } from '../../ports/IFileDownloader';
import { pullRequestsToTable } from '../../services/TableMappers';
import type { PullRequestViewBuilder } from '../../services/PullRequestViewBuilder';
import type { ExportStrategy } from '../../strategies/export/ExportStrategy';
import type { ReportStrategy } from '../../strategies/report/ReportStrategy';
import type { PullRequestPage } from '../../dto/PullRequestQuery';

export interface ReportRequest {
  reportId: string;
  from: string;
  to: string;
}

export class GenerateReport {
  constructor(
    private readonly views: PullRequestViewBuilder,
    private readonly strategies: ReportStrategy[],
  ) {}

  listReports(): Array<{ id: string; label: string }> {
    return this.strategies.map(({ id, label }) => ({ id, label }));
  }

  async execute({ reportId, from, to }: ReportRequest): Promise<TableData> {
    const strategy = this.strategies.find((s) => s.id === reportId);
    if (!strategy) throw new NotFoundError(`Reporte desconocido: ${reportId}`);
    const range = byDateRange(from, to);
    const views = (await this.views.buildAll()).filter((v) => range.isSatisfiedBy(v));
    return strategy.build(views);
  }
}

/** Serializa una tabla con la estrategia elegida y delega la descarga en el puerto de archivos. */
export class ExportTable {
  constructor(
    private readonly downloader: IFileDownloader,
    private readonly strategies: ExportStrategy[],
  ) {}

  listFormats(): Array<{ id: string; label: string }> {
    return this.strategies.map(({ id, label }) => ({ id, label }));
  }

  execute(table: TableData, baseName: string, formatId = 'csv'): string {
    const strategy = this.strategies.find((s) => s.id === formatId);
    if (!strategy) throw new NotFoundError(`Formato de exportación desconocido: ${formatId}`);
    const filename = `${baseName}.${strategy.extension}`;
    this.downloader.download(filename, strategy.serialize(table), strategy.mimeType);
    return filename;
  }
}

export class ExportPullRequests {
  constructor(private readonly exporter: ExportTable) {}

  execute(page: Pick<PullRequestPage, 'filtered'>, formatId = 'csv'): string {
    return this.exporter.execute(pullRequestsToTable(page.filtered), 'pull-requests', formatId);
  }
}
