export interface CountItem {
  label: string;
  value: number;
}

export interface PullRequestSummary {
  total: number;
  open: number;
  merged: number;
  closed: number;
  draft: number;
  /** Porcentaje de títulos válidos (0-100). */
  compliance: number;
}

export interface DashboardMetrics extends PullRequestSummary {
  today: number;
  pendingReview: number;
  validTitles: number;
  invalidTitles: number;
  breaking: number;
  failedPipelines: number;
  byTeam: CountItem[];
  byDeveloper: CountItem[];
  bySemantic: CountItem[];
  byStatus: CountItem[];
  daily: Array<{ date: string; count: number }>;
}
