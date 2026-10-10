import React from 'react';
import { AlertOctagon, Play, HardDrive, RefreshCw, CheckCircle2 } from 'lucide-react';

interface QuotaExhaustedBannerProps {
  currentChunkIndex: number;
  totalChunks: number;
  errorMessage?: string;
  onResume: () => void;
  isSimulated: boolean;
  onDisableSimulation?: () => void;
}

export const QuotaExhaustedBanner: React.FC<QuotaExhaustedBannerProps> = ({
  currentChunkIndex,
  totalChunks,
  errorMessage,
  onResume,
  isSimulated,
  onDisableSimulation,
}) => {
  const displayMessage = errorMessage && errorMessage.includes('RESOURCE_EXHAUSTED')
    ? 'Has alcanzado el límite diario de la cuota gratuita de solicitudes de Google Gemini (20 solicitudes/día en el nivel gratuito). Tal como solicitaste, el documento y todo el avance de las partes completadas se han guardado con seguridad en tu navegador para continuar en cuanto se restablezca la cuota (en aprox. 13 horas).'
    : errorMessage ||
      'La IA ha agotado los tokens permitidos o la cuota diaria. Tal como se solicitó, el progreso se detuvo de manera ordenada para evitar pérdidas.';

  return (
    <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-rose-950">
                {isSimulated
                  ? 'Pausa por Simulación de Agotamiento de Tokens'
                  : 'Proceso Pausado: Límite de Cuota de IA Alcanzado (429)'}
              </h3>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 bg-rose-200 text-rose-900 rounded">
                Pausa Segura
              </span>
            </div>
            <p className="text-xs sm:text-sm text-rose-800 leading-relaxed max-w-2xl">
              {displayMessage}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center gap-2 sm:self-center shrink-0">
          {isSimulated && onDisableSimulation && (
            <button
              type="button"
              onClick={onDisableSimulation}
              className="px-3 py-2 text-xs font-medium text-rose-800 hover:bg-rose-100 rounded-md border border-rose-300 transition-colors"
            >
              Desactivar simulación
            </button>
          )}
          <button
            type="button"
            onClick={onResume}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Reanudar desde la Parte {currentChunkIndex + 1}</span>
          </button>
        </div>
      </div>

      {/* Safe Storage Guarantee Box */}
      <div className="bg-white/80 rounded-lg p-3.5 border border-rose-200/80 text-xs text-rose-900 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-rose-700 shrink-0" />
          <div>
            <div className="font-semibold text-rose-950">Progreso Guardado Localmente</div>
            <div className="text-[11px] text-rose-700">Se conservan las {currentChunkIndex} partes ya completadas</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-rose-700 shrink-0" />
          <div>
            <div className="font-semibold text-rose-950">Continuación Exacta</div>
            <div className="text-[11px] text-rose-700">Quedan {totalChunks - currentChunkIndex} partes pendientes</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <div className="font-semibold text-stone-900">Puedes volver mañana</div>
            <div className="text-[11px] text-stone-600">Al abrir la aplicación tu documento estará disponible</div>
          </div>
        </div>
      </div>
    </div>
  );
};
