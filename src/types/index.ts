export type ProcessingMode = 'translate' | 'summarize' | 'proofread' | 'style';

export type SummaryType = 'executive' | 'bullet_points' | 'key_takeaways' | 'detailed';

export type StyleTarget = 'academic' | 'executive' | 'journalistic' | 'creative' | 'casual' | 'technical';

export type ChunkStatus = 'pending' | 'processing' | 'completed' | 'paused' | 'failed';

export interface DocumentMetrics {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  estimatedPages: number;
  actualPdfPages?: number;
  estimatedTokens: number;
  recommendedChunkWords: number;
  recommendedChunks: number;
}

export interface DocumentChunk {
  id: string;
  index: number;
  text: string;
  wordCount: number;
  charCount: number;
  status: ChunkStatus;
  result?: string;
  error?: string;
  processedAt?: number;
  executionTimeMs?: number;
}

export interface ProcessingOptions {
  mode: ProcessingMode;
  targetLanguage: string;
  summaryType: SummaryType;
  styleTarget: StyleTarget;
  customInstructions: string;
  chunkWordSize: number;
  skipIntroAndIndex: boolean; // Saltarse introducción, comentarios e índice
  skipReferences: boolean; // Omitir bibliografía y notas al pie
  preserveTechnicalTerms: boolean; // Preservar términos técnicos y nombres propios
  highlightKeyMetrics: boolean; // Resaltar datos cuantitativos y fechas
  extraTasksPrompt: string; // Tareas extras personalizadas escritas por el usuario
  simulateQuotaAtChunk?: number | null; // e.g., trigger simulated quota exhaustion at chunk X
  simulate503AtChunk?: number | null; // e.g., trigger simulated 503 high demand at chunk X
}

export interface TaskPreset {
  id: string;
  name: string;
  description?: string;
  isBuiltIn?: boolean;
  createdAt: number;
  skipIntroAndIndex: boolean;
  skipReferences: boolean;
  preserveTechnicalTerms: boolean;
  highlightKeyMetrics: boolean;
  extraTasksPrompt: string;
  customInstructions?: string;
}

export interface ProcessingSession {
  id: string;
  title: string;
  fileName?: string;
  createdAt: number;
  updatedAt: number;
  originalText: string;
  metrics: DocumentMetrics;
  options: ProcessingOptions;
  chunks: DocumentChunk[];
  globalSynthesis?: string;
  status: 'idle' | 'analyzing' | 'ready' | 'processing' | 'paused' | 'completed' | 'quota_paused' | 'error';
  quotaExhaustedMessage?: string;
}
