import React from 'react';
import { Layers, ShieldCheck, HardDriveDownload, RotateCcw, AlertTriangle } from 'lucide-react';
import { ProcessingSession } from '../types';

interface HeaderProps {
  session: ProcessingSession | null;
  onNewSession: () => void;
  onReset: () => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({ session, onNewSession, onReset, isProcessing }) => {
  const completedChunks = session ? session.chunks.filter((c) => c.status === 'completed').length : 0;
  const totalChunks = session ? session.chunks.length : 0;

  return (
    <header className="border-b border-stone-200 bg-stone-50/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-stone-900 flex items-center justify-center text-amber-100 shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg text-stone-900 tracking-tight">DocuChunk AI</span>
              <span className="text-xs text-stone-500 font-sans hidden sm:inline">· Procesador Masivo por Partes</span>
            </div>
            <p className="text-[11px] text-stone-500 font-sans leading-none hidden md:block">
              Análisis completo de documentos extensos con persistencia ante límites de tokens
            </p>
          </div>
        </div>

        {/* Status indicator & actions */}
        <div className="flex items-center gap-3">
          {session && totalChunks > 0 && (
            <div className="hidden lg:flex items-center gap-3 text-xs text-stone-600 bg-stone-100 px-3 py-1.5 rounded-md border border-stone-200">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  session.status === 'processing'
                    ? 'bg-amber-500 animate-pulse'
                    : session.status === 'quota_paused'
                    ? 'bg-rose-500'
                    : session.status === 'completed'
                    ? 'bg-emerald-500'
                    : 'bg-stone-400'
                }`} />
                <span className="font-medium text-stone-800">
                  {session.status === 'processing' && 'Procesando...'}
                  {session.status === 'quota_paused' && 'En pausa por cuota'}
                  {session.status === 'paused' && 'En pausa manual'}
                  {session.status === 'completed' && 'Completado'}
                  {session.status === 'ready' && 'Listo para procesar'}
                  {session.status === 'idle' && 'En espera'}
                </span>
              </div>
              <span className="text-stone-300">|</span>
              <span>
                {completedChunks} de {totalChunks} partes ({totalChunks > 0 ? Math.round((completedChunks / totalChunks) * 100) : 0}%)
              </span>
              <span className="text-stone-300">|</span>
              <span className="flex items-center gap-1 text-stone-500" title="Todo el progreso se guarda localmente en tiempo real">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
                <span>Auto-guardado activo</span>
              </span>
            </div>
          )}

          {session && (
            <button
              onClick={onReset}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-md transition-colors disabled:opacity-50"
              title="Reiniciar o cargar otro documento"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nuevo documento</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
