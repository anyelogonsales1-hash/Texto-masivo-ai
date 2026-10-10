import React from 'react';
import { Play, Pause, RotateCcw, Clock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { DocumentChunk } from '../types';

interface ProgressTrackerProps {
  chunks: DocumentChunk[];
  isProcessing: boolean;
  status: string;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSelectChunk: (index: number) => void;
  selectedChunkIndex: number;
  retryState?: {
    chunkIndex: number;
    secondsLeft: number;
    attempt: number;
    message: string;
  } | null;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  chunks,
  isProcessing,
  status,
  onPause,
  onResume,
  onReset,
  onSelectChunk,
  selectedChunkIndex,
  retryState,
}) => {
  const total = chunks.length;
  const completed = chunks.filter((c) => c.status === 'completed').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const currentlyProcessing = chunks.findIndex((c) => c.status === 'processing');

  const completedWords = chunks
    .filter((c) => c.status === 'completed')
    .reduce((acc, c) => acc + c.wordCount, 0);
  const totalWords = chunks.reduce((acc, c) => acc + c.wordCount, 0);

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-4">
      {/* Top row: Status, Percentage & Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-stone-900">
              Progreso del Documento: Parte {completed} de {total} ({percentage}%)
            </h3>
            {retryState ? (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300 animate-pulse">
                <Clock className="w-3 h-3 text-amber-700" />
                <span>Error 503: Reintentando en {retryState.secondsLeft}s (Intento #{retryState.attempt})</span>
              </span>
            ) : status === 'processing' ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                <span>Procesando parte {currentlyProcessing >= 0 ? currentlyProcessing + 1 : ''}...</span>
              </span>
            ) : null}
            {status === 'completed' && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Completado íntegramente</span>
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {completedWords.toLocaleString()} de {totalWords.toLocaleString()} palabras transformadas
          </p>
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <button
              type="button"
              onClick={onPause}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md text-xs font-semibold transition-colors border border-stone-300"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pausar</span>
            </button>
          ) : (
            status !== 'completed' && completed < total && (
              <button
                type="button"
                onClick={onResume}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-semibold transition-colors shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{completed > 0 ? `Reanudar (Parte ${completed + 1})` : 'Comenzar'}</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={onReset}
            disabled={isProcessing}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors disabled:opacity-40"
            title="Reiniciar progreso"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main visual progress bar */}
      <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full bg-stone-900 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Chunk navigation strip */}
      <div className="pt-1">
        <div className="flex items-center justify-between text-[11px] text-stone-500 mb-2">
          <span>Mapa interactivo de partes (haz clic en cualquier parte para inspeccionar):</span>
          <span>{total - completed} pendientes</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {chunks.map((chunk, idx) => {
            const isSelected = selectedChunkIndex === idx;
            let bgClass = 'bg-stone-100 text-stone-600 border-stone-200';

            if (chunk.status === 'completed') {
              bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
            } else if (chunk.status === 'processing') {
              bgClass = 'bg-amber-100 text-amber-900 border-amber-400 animate-pulse';
            } else if (chunk.status === 'failed') {
              bgClass = 'bg-rose-100 text-rose-800 border-rose-300';
            } else if (chunk.status === 'paused') {
              bgClass = 'bg-amber-50 text-amber-800 border-amber-300';
            }

            return (
              <button
                key={chunk.id}
                type="button"
                onClick={() => onSelectChunk(idx)}
                className={`px-2 py-1 text-xs rounded border transition-all flex items-center gap-1 ${bgClass} ${
                  isSelected ? 'ring-2 ring-stone-900 ring-offset-1 font-bold' : 'hover:border-stone-400'
                }`}
              >
                <span>P.{idx + 1}</span>
                {chunk.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                {chunk.status === 'processing' && <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />}
                {chunk.status === 'failed' && <AlertCircle className="w-3 h-3 text-rose-600" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
