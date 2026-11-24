export type Theme = 'dark' | 'light';
export type Density = 'comfortable' | 'compact';

export interface SemanticSettings {
  allowedTypes: string[];
  requireScope: boolean;
  maxTitleLength: number;
}

export interface Settings {
  theme: Theme;
  density: Density;
  showAvatars: boolean;
  pageSize: 10 | 20 | 50;
  semantic: SemanticSettings;
}
