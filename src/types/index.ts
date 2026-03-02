export interface SocrataDataset {
  id: string;
  name: string;
  description: string;
  domain: string;
  columns: DatasetColumn[];
  rowCount: number;
  updatedAt: string;
  category?: string;
  tags?: string[];
}

export interface DatasetColumn {
  fieldName: string;
  name: string;
  dataType: string;
  description?: string;
}

export interface QueryConfirmation {
  dataset: SocrataDataset;
  soql: string;
  filters: QueryFilter[];
  estimatedRows?: number;
}

export interface QueryFilter {
  column: string;
  operator: string;
  value: string;
  label: string;
}

export interface SessionState {
  portal: string;
  activeDataset: SocrataDataset | null;
  filters: QueryFilter[];
  conversationId: string;
}

export type SuggestionChip = {
  label: string;
  action: string;
};
