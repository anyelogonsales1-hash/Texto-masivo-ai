import React, { useState } from 'react';
import { Download, Copy, Check, FileText, Sparkles, BookOpen, Search, ArrowUpRight } from 'lucide-react';
import { DocumentChunk, ProcessingMode } from '../types';

interface ResultViewerProps {
  chunks: DocumentChunk[];
  mode: ProcessingMode;
  documentTitle: string;
  globalSynthesis?: string;
  onRequestSynthesis?: () => void;
  isSynthesizing?: boolean;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({
  chunks,
  mode,
  documentTitle,
  globalSynthesis,
  onRequestSynthesis,
  isSynthesizing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'combined' | 'synthesis' | 'chapters'>('combined');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const completedChunks = chunks.filter((c) => c.status === 'completed' && c.result);

  // Combine results with section headers
  const combinedText = completedChunks
    .map((c, i) => {
      return `=== PARTE ${c.index + 1} de ${chunks.length} ===\n\n${c.result}\n\n`;
    })
    .join('\n');

  const cleanMergedText = completedChunks.map((c) => c.result).join('\n\n');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'txt' | 'md') => {
    const content = format === 'md'
      ? `# ${documentTitle}\n\n${cleanMergedText}`
      : `${documentTitle}\n\n${cleanMergedText}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentTitle.replace(/\s+/g, '_')}_procesado.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalOutputWords = completedChunks.reduce(
    (acc, c) => acc + (c.result ? c.result.split(/\s+/).length : 0),
    0
  );

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-6">
      {/* Header and export toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div>
          <h2 className="text-base font-semibold text-stone-900">
            3. Resultado Documental Completo
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {completedChunks.length} de {chunks.length} partes procesadas · {totalOutputWords.toLocaleString()} palabras generadas
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopy(cleanMergedText)}
            disabled={completedChunks.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md text-xs font-medium transition-colors border border-stone-200 disabled:opacity-40"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado al portapapeles' : 'Copiar todo'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownload('md')}
            disabled={completedChunks.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-semibold transition-colors shadow-xs disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar (.md)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab('combined')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'combined'
              ? 'border-stone-900 text-stone-900 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Texto Íntegro Unificado
        </button>

        {mode === 'summarize' && (
          <button
            type="button"
            onClick={() => setActiveTab('synthesis')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'synthesis'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Síntesis Global Ejecutiva</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('chapters')}
          className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'chapters'
              ? 'border-stone-900 text-stone-900 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Partición por Secciones
        </button>
      </div>

      {/* Tab: Combined text */}
      {activeTab === 'combined' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar dentro del documento generado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div className="max-h-[500px] overflow-y-auto p-5 rounded-lg bg-stone-50 border border-stone-200 text-xs sm:text-sm leading-relaxed text-stone-900 font-sans whitespace-pre-wrap">
            {completedChunks.length === 0 ? (
              <p className="text-stone-400 text-center py-10">
                Aún no hay partes completadas. Inicia el procesamiento para ver los resultados integrados aquí.
              </p>
            ) : searchQuery.trim() ? (
              cleanMergedText
                .split(new RegExp(`(${searchQuery})`, 'gi'))
                .map((part, i) =>
                  part.toLowerCase() === searchQuery.toLowerCase() ? (
                    <mark key={i} className="bg-amber-200 text-stone-900 rounded-xs px-0.5">
                      {part}
                    </mark>
                  ) : (
                    part
                  )
                )
            ) : (
              cleanMergedText
            )}
          </div>
        </div>
      )}

      {/* Tab: Global Synthesis */}
      {activeTab === 'synthesis' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-600">
              Síntesis integral articulada que conecta cronológicamente los argumentos de todas las partes del documento.
            </p>
            {onRequestSynthesis && !globalSynthesis && (
              <button
                type="button"
                onClick={onRequestSynthesis}
                disabled={isSynthesizing || completedChunks.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSynthesizing ? 'Sintetizando...' : 'Generar Síntesis Global Ahora'}</span>
              </button>
            )}
          </div>

          <div className="p-5 rounded-lg bg-stone-50 border border-stone-200 text-xs sm:text-sm leading-relaxed text-stone-900 whitespace-pre-wrap">
            {globalSynthesis ? (
              globalSynthesis
            ) : (
              <div className="py-8 text-center text-stone-400 text-xs">
                {isSynthesizing
                  ? 'Generando informe global unificado con todos los fragmentos...'
                  : 'Completa las partes del documento o pulsa "Generar Síntesis Global" para obtener una visión macro.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Chapters breakdown */}
      {activeTab === 'chapters' && (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {completedChunks.map((chunk) => (
            <div key={chunk.id} className="p-4 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700 border-b border-stone-200/60 pb-2">
                <span>Parte {chunk.index + 1} de {chunks.length}</span>
                <span className="text-stone-400 font-normal">
                  {chunk.result?.split(/\s+/).length} palabras
                </span>
              </div>
              <div className="text-xs leading-relaxed text-stone-900 whitespace-pre-wrap">
                {chunk.result}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
