import type { TableData } from '../../../shared/types';

export interface ExportStrategy {
  id: string;
  label: string;
  extension: string;
  mimeType: string;
  serialize(table: TableData): string;
}

/** CSV con todas las celdas entre comillas y neutralización de fórmulas de hojas de cálculo. */
export class CsvExportStrategy implements ExportStrategy {
  readonly id = 'csv';
  readonly label = 'CSV';
  readonly extension = 'csv';
  readonly mimeType = 'text/csv;charset=utf-8';

  serialize(table: TableData): string {
    const escape = (value: string | number): string => {
      const text = typeof value === 'string' ? value.replace(/^[=+\-@\t\r]/, "'$&") : String(value);
      return `"${text.replaceAll('"', '""')}"`;
    };
    const lines = [table.columns, ...table.rows].map((row) => row.map(escape).join(','));
    return '\ufeff' + lines.join('\n');
  }
}

export class JsonExportStrategy implements ExportStrategy {
  readonly id = 'json';
  readonly label = 'JSON';
  readonly extension = 'json';
  readonly mimeType = 'application/json;charset=utf-8';

  serialize(table: TableData): string {
    const objects = table.rows.map((row) =>
      Object.fromEntries(table.columns.map((column, i) => [column, row[i]])),
    );
    return JSON.stringify(objects, null, 2);
  }
}

export const EXPORT_STRATEGIES: ExportStrategy[] = [
  new CsvExportStrategy(),
  new JsonExportStrategy(),
];
