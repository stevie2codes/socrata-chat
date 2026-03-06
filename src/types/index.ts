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

export interface ColumnMapping {
  intent: string;
  fieldName: string;
  rationale: string;
}

export interface TechnicalNotes {
  columnMappings: ColumnMapping[];
  assumptions: string[];
  exclusions: string[];
}

export interface QueryConfirmation {
  dataset: {
    name: string;
    id: string;
    domain: string;
    rowCount: number;
  };
  soql: string;
  filters: QueryFilter[];
  columns: string[];
  estimatedDescription: string;
  availableColumns: DatasetColumn[];
  methodology?: string;
  technicalNotes?: TechnicalNotes;
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

export interface ChatSummary {
  id: string;
  title: string;
  portal: string;
  createdAt: number;
  updatedAt: number;
}
