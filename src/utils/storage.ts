import { ProcessingSession, TaskPreset } from '../types';

const STORAGE_KEY_CURRENT = 'docuchunk_current_session';
const STORAGE_KEY_HISTORY = 'docuchunk_session_history';
const STORAGE_KEY_TASK_PRESETS = 'docuchunk_task_presets';

export const DEFAULT_TASK_PRESETS: TaskPreset[] = [
  {
    id: 'preset-skip-intro-index',
    name: 'Solo Cuerpo Principal',
    description: 'Omite introducción, prólogo, índice y notas preliminares para ir directo al grano.',
    isBuiltIn: true,
    createdAt: 1,
    skipIntroAndIndex: true,
    skipReferences: true,
    preserveTechnicalTerms: false,
    highlightKeyMetrics: false,
    extraTasksPrompt: 'Enfocarse exclusivamente en el desarrollo y argumentos principales del cuerpo del texto, omitiendo notas de bienvenida, preámbulos y agradecimientos.',
  },
  {
    id: 'preset-executive-metrics',
    name: 'Enfoque Ejecutivo y Cifras',
    description: 'Destaca datos numéricos, fechas, porcentajes e hitos medibles con viñetas limpias.',
    isBuiltIn: true,
    createdAt: 2,
    skipIntroAndIndex: true,
    skipReferences: true,
    preserveTechnicalTerms: true,
    highlightKeyMetrics: true,
    extraTasksPrompt: 'Extraer y priorizar datos numéricos, porcentajes, montos, plazos e hitos críticos en viñetas directas y estructuradas.',
  },
  {
    id: 'preset-legal-clauses',
    name: 'Contratos y Auditoría Legal',
    description: 'Centrado en obligaciones, cláusulas vinculantes, plazos y responsabilidades sin rodeos.',
    isBuiltIn: true,
    createdAt: 3,
    skipIntroAndIndex: true,
    skipReferences: false,
    preserveTechnicalTerms: true,
    highlightKeyMetrics: true,
    extraTasksPrompt: 'Identificar obligaciones vinculantes de las partes, sanciones, plazos de cumplimiento, exclusiones y consecuencias jurídicas.',
  },
  {
    id: 'preset-technical-rigorous',
    name: 'Técnico Especializado',
    description: 'Preserva nombres propios, algoritmos, siglas y terminología de ingeniería intactos.',
    isBuiltIn: true,
    createdAt: 4,
    skipIntroAndIndex: false,
    skipReferences: true,
    preserveTechnicalTerms: true,
    highlightKeyMetrics: true,
    extraTasksPrompt: 'Mantener intactos los nombres de tecnologías, variables, fórmulas, siglas y vocabulario técnico especializado.',
  },
];

export function getSavedTaskPresets(): TaskPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASK_PRESETS);
    const userPresets: TaskPreset[] = raw ? JSON.parse(raw) : [];
    return [...DEFAULT_TASK_PRESETS, ...userPresets];
  } catch (err) {
    console.warn('Error reading task presets:', err);
    return DEFAULT_TASK_PRESETS;
  }
}

export function saveUserTaskPreset(preset: TaskPreset): TaskPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASK_PRESETS);
    const userPresets: TaskPreset[] = raw ? JSON.parse(raw) : [];
    const existingIndex = userPresets.findIndex((p) => p.id === preset.id || p.name.trim().toLowerCase() === preset.name.trim().toLowerCase());
    if (existingIndex >= 0) {
      userPresets[existingIndex] = { ...preset, isBuiltIn: false };
    } else {
      userPresets.unshift({ ...preset, isBuiltIn: false });
    }
    localStorage.setItem(STORAGE_KEY_TASK_PRESETS, JSON.stringify(userPresets));
    return [...DEFAULT_TASK_PRESETS, ...userPresets];
  } catch (err) {
    console.error('Failed to save task preset:', err);
    return DEFAULT_TASK_PRESETS;
  }
}

export function deleteUserTaskPreset(id: string): TaskPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASK_PRESETS);
    const userPresets: TaskPreset[] = raw ? JSON.parse(raw) : [];
    const filtered = userPresets.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY_TASK_PRESETS, JSON.stringify(filtered));
    return [...DEFAULT_TASK_PRESETS, ...filtered];
  } catch (err) {
    console.error('Failed to delete task preset:', err);
    return DEFAULT_TASK_PRESETS;
  }
}

export function saveCurrentSession(session: ProcessingSession): void {
  try {
    session.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(session));

    // Also update history list
    const history = getSessionHistory();
    const existingIndex = history.findIndex((s) => s.id === session.id);
    if (existingIndex >= 0) {
      history[existingIndex] = {
        id: session.id,
        title: session.title,
        updatedAt: session.updatedAt,
        status: session.status,
        mode: session.options.mode,
        completedChunks: session.chunks.filter((c) => c.status === 'completed').length,
        totalChunks: session.chunks.length,
      };
    } else {
      history.unshift({
        id: session.id,
        title: session.title,
        updatedAt: session.updatedAt,
        status: session.status,
        mode: session.options.mode,
        completedChunks: session.chunks.filter((c) => c.status === 'completed').length,
        totalChunks: session.chunks.length,
      });
    }
    // Keep last 10
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, 10)));
  } catch (err) {
    console.warn('Could not save session to localStorage (may have exceeded quota):', err);
  }
}

export function loadCurrentSession(): ProcessingSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (!raw) return null;
    return JSON.parse(raw) as ProcessingSession;
  } catch (err) {
    console.error('Failed to parse saved session:', err);
    return null;
  }
}

export function clearCurrentSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT);
  } catch (err) {
    console.warn('Error clearing current session:', err);
  }
}

export interface SessionHistoryItem {
  id: string;
  title: string;
  updatedAt: number;
  status: string;
  mode: string;
  completedChunks: number;
  totalChunks: number;
}

export function getSessionHistory(): SessionHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
