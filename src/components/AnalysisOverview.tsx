import React from 'react';
import { FileText, FileStack, Hash, Cpu, Layers, Sliders, CheckCircle2 } from 'lucide-react';
import { DocumentMetrics } from '../types';

interface AnalysisOverviewProps {
  metrics: DocumentMetrics;
  fileName: string;
  chunkWordSize: number;
  totalChunks: number;
  onChunkSizeChange: (words: number) => void;
}

export const AnalysisOverview: React.FC<AnalysisOverviewProps> = ({
  metrics,
  fileName,
  chunkWordSize,
  totalChunks,
  onChunkSizeChange,
}) => {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Diagnóstico Inicial del Documento
            </span>
          </div>
          <h2 className="text-lg font-serif font-bold text-stone-900 mt-0.5">
            {fileName}
          </h2>
        </div>
        <div className="text-xs text-stone-500 bg-stone-50 px-3 py-1.5 rounded-md border border-stone-200/80 self-start sm:self-auto">
          Estrategia: <span className="font-semibold text-stone-800">Partición Semántica Coherente</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-stone-50 border border-stone-200/60">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Letras / Caracteres</span>
            <Hash className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-stone-900">
            {metrics.characters.toLocaleString()}
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {metrics.charactersNoSpaces.toLocaleString()} sin espacios
          </p>
        </div>

        <div className="p-4 rounded-lg bg-stone-50 border border-stone-200/60">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Palabras Totales</span>
            <FileText className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-stone-900">
            {metrics.words.toLocaleString()}
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            En párrafos analizados
          </p>
        </div>

        <div className="p-4 rounded-lg bg-stone-50 border border-stone-200/60">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">
              {metrics.actualPdfPages ? 'Páginas del PDF' : 'Páginas Estimadas'}
            </span>
            <FileStack className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-stone-900">
            {metrics.actualPdfPages ? `${metrics.actualPdfPages} págs.` : `~${metrics.estimatedPages}`}
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {metrics.actualPdfPages
              ? `Documento PDF original (~${metrics.estimatedPages} págs. por texto)`
              : 'A ~280 palabras/hoja estándar'}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-stone-50 border border-stone-200/60">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Tokens Estimados</span>
            <Cpu className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-stone-900">
            ~{metrics.estimatedTokens.toLocaleString()}
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Cómputo en ventana de contexto
          </p>
        </div>
      </div>

      {/* AI Partitioning Decision */}
      <div className="p-5 rounded-xl bg-stone-900 text-stone-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-sm">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Plan de Partición: Dividido en {totalChunks} {totalChunks === 1 ? 'parte' : 'partes consecutivas'}
              </h3>
              <p className="text-xs text-stone-300">
                Cada parte conserva el contexto semántico sin truncar frases ni párrafos a la mitad.
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-amber-300 bg-stone-800 px-3 py-1.5 rounded-md border border-stone-700 self-start sm:self-auto">
            ~{chunkWordSize} palabras por parte
          </div>
        </div>

        {/* Chunk visualization bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span>Distribución de partes del documento</span>
            <span>{totalChunks} {totalChunks === 1 ? 'bloque único' : 'bloques continuos'}</span>
          </div>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(totalChunks, 16)}, minmax(0, 1fr))` }}>
            {Array.from({ length: totalChunks }).map((_, i) => (
              <div
                key={i}
                className="h-3 rounded-xs bg-amber-400/40 border border-amber-300/30 transition-all hover:bg-amber-300"
                title={`Parte ${i + 1} de ${totalChunks}`}
              />
            ))}
          </div>
        </div>

        {/* Adjust Chunk Size Control */}
        <div className="pt-2 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-300">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-stone-400" />
            <span>Ajustar tamaño por parte:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChunkSizeChange(800)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                chunkWordSize === 800 ? 'bg-amber-400 text-stone-950 font-semibold' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Pequeño (~800 pal.)
            </button>
            <button
              type="button"
              onClick={() => onChunkSizeChange(1500)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                chunkWordSize === 1500 ? 'bg-amber-400 text-stone-950 font-semibold' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Recomendado (~1,500 pal.)
            </button>
            <button
              type="button"
              onClick={() => onChunkSizeChange(2500)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                chunkWordSize === 2500 ? 'bg-amber-400 text-stone-950 font-semibold' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              Extenso (~2,500 pal.)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
