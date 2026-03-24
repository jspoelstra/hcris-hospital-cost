export interface HCRISRecord {
  providerNumber: string;
  providerName: string;
  fiscalYearEnd: string;
  nprDate: string;
  reportYear: number;
  sourceFile: string;
}

export interface YearStatistics {
  year: number;
  recordCount: number;
  uniqueProviders: number;
  namesMapped: number;
  unmappedProviders: number;
  latestNprDate: string;
  sourceFiles: string[];
}

export interface ProcessingPhase {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  progress: number;
  message?: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  phases: ProcessingPhase[];
  currentPhase: string;
  startTime?: number;
  elapsedTime: number;
  logs: LogEntry[];
}

export interface LogEntry {
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface ProviderMapping {
  [providerNumber: string]: string;
}

export interface ProviderGroup {
  id: string;
  name: string;
  providerNumbers: string[];
}
