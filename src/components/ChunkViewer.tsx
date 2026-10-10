import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Check, RefreshCw, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { DocumentChunk, ProcessingMode } from '../types';

interface ChunkViewerProps {
  chunk: DocumentChunk;
  totalChunks: number;
  mode: ProcessingMode;
  onPrev: () => void;
  onNext: () => void;
  onRetry: (index: number) => void;
  isProcessing: boolean;
}

export const ChunkViewer: React.FC<ChunkViewerProps> = ({
  chunk,
  totalChunks,
  mode,
  onPrev,
  onNext,
  onRetry,
  isProcessing,
}) => {
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);

  const copyToClipboard = (text: string, isResult: boolean) => {
    navigator.clipboard.writeText(text);
    if (isResult) {
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 2000);
    } else {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    }
  };

  const getModeLabel = (m: ProcessingMode) => {
    switch (m) {
      case 'translate':
        return 'Traducción generada';
      case 'summarize':
        return 'Resumen de esta sección';
      case 'proofread':
        return 'Texto corregido y depurado';
      case 'style':
        return 'Adaptación estilística';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
      {/* Chunk Header */}
      <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-serif font-bold text-sm text-stone-900">
            Parte {chunk.index + 1} de {totalChunks}
          </span>
          <span className="text-stone-300">·</span>
          <span className="text-xs text-stone-500">
            {chunk.wordCount.toLocaleString()} palabras ({chunk.charCount.toLocaleString()} caracteres)
          </span>
          <span className="text-stone-300">·</span>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
              chunk.status === 'completed'
                ? 'bg-emerald-100 text-emerald-800'
                : chunk.status === 'processing'
                ? 'bg-amber-100 text-amber-900'
                : chunk.status === 'failed'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-stone-200 text-stone-700'
            }`}
          >
            {chunk.status === 'completed' && 'Completado'}
            {chunk.status === 'processing' && 'En proceso'}
            {chunk.status === 'failed' && 'Error'}
            {chunk.status === 'pending' && 'En cola'}
            {chunk.status === 'paused' && 'En pausa'}
          </span>
        </div>

        {/* Chunk navigation & actions */}
        <div className="flex items-center gap-2">
          {chunk.status === 'failed' && (
            <button
              type="button"
              onClick={() => onRetry(chunk.index)}
              disabled={isProcessing}
              className="inline-flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 bg-rose-50 px-2.5 py-1 rounded border border-rose-200"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reintentar esta parte</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrev}
              disabled={chunk.index === 0}
              className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-200/70 disabled:opacity-30 disabled:pointer-events-none"
              title="Parte anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-stone-400 font-mono">
              {chunk.index + 1}/{totalChunks}
            </span>
            <button
              type="button"
              onClick={onNext}
              disabled={chunk.index === totalChunks - 1}
              className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-200/70 disabled:opacity-30 disabled:pointer-events-none"
              title="Siguiente parte"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-side view */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
        {/* Left: Original Chunk */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold text-stone-700 uppercase tracking-wide text-[11px]">
              Fragmento Original ({chunk.wordCount} palabras)
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(chunk.text, false)}
              className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-800"
            >
              {copiedOriginal ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedOriginal ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto text-xs font-mono text-stone-700 leading-relaxed whitespace-pre-wrap bg-stone-50 p-4 rounded-lg border border-stone-200/60">
            {chunk.text}
          </div>
        </div>

        {/* Right: Processed Result */}
        <div className="p-5 space-y-3 bg-stone-50/30">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-semibold text-stone-900 uppercase tracking-wide text-[11px]">
              {getModeLabel(mode)}
            </span>
            {chunk.result && (
              <button
                type="button"
                onClick={() => copyToClipboard(chunk.result || '', true)}
                className="inline-flex items-center gap-1 text-[11px] text-stone-600 hover:text-stone-900 font-medium"
              >
                {copiedResult ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedResult ? 'Copiado' : 'Copiar resultado'}</span>
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto text-xs text-stone-900 leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-lg border border-stone-200">
            {chunk.status === 'completed' && chunk.result ? (
              chunk.result
            ) : chunk.status === 'processing' ? (
              <div className="py-12 text-center space-y-2 text-stone-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-600" />
                <p className="text-xs font-medium">Procesando este fragmento con IA...</p>
                <p className="text-[11px] text-stone-400">Analizando sintaxis y contexto</p>
              </div>
            ) : chunk.status === 'failed' ? (
              <div className="py-8 text-center space-y-2 text-rose-600">
                <p className="text-xs font-semibold">Ocurrió un error al procesar esta parte:</p>
                <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                  {chunk.error || 'Fallo desconocido'}
                </p>
              </div>
            ) : (
              <div className="py-12 text-center text-stone-400 text-xs">
                Esta parte está pendiente de procesamiento. Se ejecutará en su turno dentro de la secuencia.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
