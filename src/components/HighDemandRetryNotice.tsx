import React from 'react';
import { Clock, RefreshCw, AlertTriangle, Sparkles } from 'lucide-react';

interface HighDemandRetryNoticeProps {
  chunkIndex: number;
  totalChunks: number;
  secondsLeft: number;
  attempt: number;
  message?: string;
  onRetryNow?: () => void;
}

export const HighDemandRetryNotice: React.FC<HighDemandRetryNoticeProps> = ({
  chunkIndex,
  totalChunks,
  secondsLeft,
  attempt,
  message,
  onRetryNow,
}) => {
  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 sm:p-5 shadow-xs transition-all animate-pulse duration-1000">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 font-bold font-mono text-base shadow-xs">
            {secondsLeft}s
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-900 text-sm">
                Alta Demanda Temporal en la IA (Error 503)
              </span>
              <span className="text-[11px] font-medium bg-amber-200/90 text-amber-950 px-2 py-0.5 rounded">
                Reintento en {secondsLeft} seg. (Intento #{attempt})
              </span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed max-w-2xl font-mono">
              "{message || 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.'}"
            </p>
            <p className="text-[11px] text-stone-600 mt-0.5">
              Reintentando automáticamente la <strong>Parte {chunkIndex + 1} de {totalChunks}</strong> en {secondsLeft} segundos...
            </p>
          </div>
        </div>

        {/* Visual Countdown Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-200/80 text-amber-950 rounded-lg text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Reintentando en {secondsLeft}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
