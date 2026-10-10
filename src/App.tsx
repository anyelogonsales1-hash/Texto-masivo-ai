import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DocumentUploader } from './components/DocumentUploader';
import { AnalysisOverview } from './components/AnalysisOverview';
import { ProcessingConfig } from './components/ProcessingConfig';
import { ProgressTracker } from './components/ProgressTracker';
import { ChunkViewer } from './components/ChunkViewer';
import { ResultViewer } from './components/ResultViewer';
import { QuotaExhaustedBanner } from './components/QuotaExhaustedBanner';
import { HighDemandRetryNotice } from './components/HighDemandRetryNotice';
import { DocumentChunk, ProcessingOptions, ProcessingSession } from './types';
import { calculateMetrics, partitionTextIntoChunks } from './utils/chunker';
import { saveCurrentSession, loadCurrentSession, clearCurrentSession } from './utils/storage';
import { ShieldAlert, ArrowLeft, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<ProcessingSession | null>(null);
  const [selectedChunkIndex, setSelectedChunkIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [resumePrompt, setResumePrompt] = useState<ProcessingSession | null>(null);
  const [retryState, setRetryState] = useState<{
    chunkIndex: number;
    secondsLeft: number;
    attempt: number;
    message: string;
  } | null>(null);

  // Ref to cancel or pause the sequential loop synchronously
  const isPauseRequestedRef = useRef<boolean>(false);

  // Check saved session on mount
  useEffect(() => {
    const saved = loadCurrentSession();
    if (saved && saved.chunks && saved.chunks.length > 0) {
      const completed = saved.chunks.filter((c) => c.status === 'completed').length;
      if (completed > 0 && completed < saved.chunks.length) {
        setResumePrompt(saved);
      } else {
        setSession(saved);
      }
    }
  }, []);

  // Save session on changes
  useEffect(() => {
    if (session) {
      saveCurrentSession(session);
    }
  }, [session]);

  const handleDocumentLoaded = (text: string, title: string, actualPdfPages?: number) => {
    const defaultChunkWords = 1500;
    const metrics = calculateMetrics(text, defaultChunkWords, actualPdfPages);
    const chunks = partitionTextIntoChunks(text, metrics.recommendedChunkWords);

    const defaultOptions: ProcessingOptions = {
      mode: 'summarize',
      targetLanguage: 'Español',
      summaryType: 'executive',
      styleTarget: 'executive',
      customInstructions: '',
      chunkWordSize: metrics.recommendedChunkWords,
      skipIntroAndIndex: false,
      skipReferences: false,
      preserveTechnicalTerms: false,
      highlightKeyMetrics: false,
      extraTasksPrompt: '',
      simulateQuotaAtChunk: null,
      simulate503AtChunk: null,
    };

    const newSession: ProcessingSession = {
      id: `session-${Date.now()}`,
      title: title || 'Documento sin título',
      fileName: title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      originalText: text,
      metrics,
      options: defaultOptions,
      chunks,
      status: 'ready',
    };

    setSession(newSession);
    setSelectedChunkIndex(0);
    setResumePrompt(null);
  };

  const handleChunkSizeChange = (newSize: number) => {
    if (!session || isProcessing) return;
    const updatedMetrics = calculateMetrics(session.originalText, newSize, session.metrics.actualPdfPages);
    const updatedChunks = partitionTextIntoChunks(session.originalText, newSize);

    setSession({
      ...session,
      metrics: updatedMetrics,
      options: {
        ...session.options,
        chunkWordSize: newSize,
      },
      chunks: updatedChunks,
      status: 'ready',
    });
    setSelectedChunkIndex(0);
  };

  const handleOptionsChange = (updated: Partial<ProcessingOptions>) => {
    if (!session || isProcessing) return;
    setSession({
      ...session,
      options: {
        ...session.options,
        ...updated,
      },
    });
  };

  // Main processing loop
  const startOrResumeProcessing = async () => {
    if (!session || isProcessing) return;

    isPauseRequestedRef.current = false;
    setIsProcessing(true);

    const currentSession = { ...session };
    currentSession.status = 'processing';
    currentSession.quotaExhaustedMessage = undefined;
    setSession({ ...currentSession });

    let chunksCopy = [...currentSession.chunks];

    for (let i = 0; i < chunksCopy.length; i++) {
      // Check if paused
      if (isPauseRequestedRef.current) {
        currentSession.status = 'paused';
        currentSession.chunks = chunksCopy;
        setSession({ ...currentSession });
        setIsProcessing(false);
        return;
      }

      const chunk = chunksCopy[i];
      if (chunk.status === 'completed') {
        continue;
      }

      // Mark as currently processing
      chunk.status = 'processing';
      chunksCopy[i] = { ...chunk };
      currentSession.chunks = [...chunksCopy];
      setSelectedChunkIndex(i);
      setSession({ ...currentSession });

      // Build context summary from prior chunks for continuity
      const priorSummaries = chunksCopy
        .slice(Math.max(0, i - 2), i)
        .filter((c) => c.status === 'completed' && c.result)
        .map((c) => `[Parte ${c.index + 1}]: ${c.result?.slice(0, 300)}...`)
        .join('\n');

      let chunkAttempt = 0;
      let chunkSuccess = false;

      while (!chunkSuccess) {
        if (isPauseRequestedRef.current) {
          currentSession.status = 'paused';
          chunk.status = 'paused';
          chunksCopy[i] = { ...chunk };
          currentSession.chunks = [...chunksCopy];
          setSession({ ...currentSession });
          setIsProcessing(false);
          setRetryState(null);
          return;
        }

        const shouldSimulateQuota =
          currentSession.options.simulateQuotaAtChunk !== null &&
          currentSession.options.simulateQuotaAtChunk === i + 1;

        const shouldSimulate503 =
          currentSession.options.simulate503AtChunk !== null &&
          currentSession.options.simulate503AtChunk === i + 1 &&
          chunkAttempt === 0;

        try {
          const startTime = Date.now();
          const response = await fetch('/api/process-chunk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chunkIndex: i,
              totalChunks: chunksCopy.length,
              chunkText: chunk.text,
              mode: currentSession.options.mode,
              options: {
                targetLanguage: currentSession.options.targetLanguage,
                summaryType: currentSession.options.summaryType,
                styleTarget: currentSession.options.styleTarget,
                customInstructions: currentSession.options.customInstructions,
                skipIntroAndIndex: currentSession.options.skipIntroAndIndex,
                skipReferences: currentSession.options.skipReferences,
                preserveTechnicalTerms: currentSession.options.preserveTechnicalTerms,
                highlightKeyMetrics: currentSession.options.highlightKeyMetrics,
                extraTasksPrompt: currentSession.options.extraTasksPrompt,
                contextSummary: priorSummaries,
              },
              simulateQuotaExceeded: shouldSimulateQuota,
              simulate503HighDemand: shouldSimulate503,
            }),
          });

          const rawText = await response.text();
          let data: any = {};
          let isJson = false;

          try {
            data = JSON.parse(rawText);
            isJson = true;
          } catch {
            isJson = false;
          }

          // Check if response is warmup HTML from Nginx or proxy
          const isWarmupOrHtml = !isJson && (
            rawText.includes('<!doctype') ||
            rawText.includes('<html') ||
            rawText.includes('warmup') ||
            rawText.includes('Starting Server') ||
            rawText.includes('Please wait while your application starts')
          );

          // 1. SPECIFIC CHECK FOR 503 / HIGH DEMAND / UNAVAILABLE OR HTML GATEWAY 502/503/504 / WARMUP
          const is503Error =
            isWarmupOrHtml ||
            response.status === 503 ||
            response.status === 502 ||
            response.status === 504 ||
            data?.code === 503 ||
            data?.error?.code === 503 ||
            data?.error?.status === 'UNAVAILABLE' ||
            data?.status === 'UNAVAILABLE' ||
            data?.isHighDemand ||
            (!isJson && (rawText.includes('503') || rawText.includes('high demand') || rawText.includes('UNAVAILABLE') || rawText.includes('Service Unavailable') || rawText.includes('Bad Gateway'))) ||
            (typeof data?.error?.message === 'string' &&
              (data.error.message.includes('high demand') ||
                data.error.message.includes('UNAVAILABLE') ||
                data.error.message.includes('Spikes in demand'))) ||
            (typeof data?.message === 'string' &&
              (data.message.includes('high demand') ||
                data.message.includes('UNAVAILABLE') ||
                data.message.includes('Spikes in demand')));

          if (is503Error) {
            chunkAttempt++;
            const msg503 = isWarmupOrHtml
              ? 'El servidor de la aplicación se está reconectando. Reintentando automáticamente...'
              : data?.error?.message ||
                data?.message ||
                'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.';

            // Count down 5 seconds before retrying automatically!
            for (let sec = 5; sec > 0; sec--) {
              if (isPauseRequestedRef.current) {
                chunk.status = 'paused';
                chunksCopy[i] = { ...chunk };
                currentSession.chunks = [...chunksCopy];
                currentSession.status = 'paused';
                setSession({ ...currentSession });
                setIsProcessing(false);
                setRetryState(null);
                return;
              }
              setRetryState({
                chunkIndex: i,
                secondsLeft: sec,
                attempt: chunkAttempt,
                message: msg503,
              });
              await new Promise((r) => setTimeout(r, 1000));
            }
            setRetryState(null);
            // After 5 seconds, repeat while loop to retry the exact same chunk
            continue;
          }

          if (!isJson) {
            // If response is unexpectedly not JSON, wait 3 seconds and retry automatically instead of crashing
            chunkAttempt++;
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }

          // 2. CHECK FOR QUOTA EXHAUSTED (429)
          if (response.status === 429 || data.isQuotaExhausted || data.error === 'QUOTA_EXHAUSTED') {
            chunk.status = 'paused';
            chunksCopy[i] = { ...chunk };
            currentSession.chunks = [...chunksCopy];
            currentSession.status = 'quota_paused';
            currentSession.quotaExhaustedMessage =
              data.message || 'Límite de tokens alcanzado. El progreso se ha guardado para reanudar más tarde.';
            setSession({ ...currentSession });
            setIsProcessing(false);
            setRetryState(null);
            return;
          }

          if (!response.ok) {
            throw new Error(data.message || `Error del servidor (${response.status})`);
          }

          // Successfully completed chunk
          chunk.status = 'completed';
          chunk.result = data.resultText;
          chunk.processedAt = Date.now();
          chunk.executionTimeMs = Date.now() - startTime;
          chunksCopy[i] = { ...chunk };

          currentSession.chunks = [...chunksCopy];
          setSession({ ...currentSession });
          setRetryState(null);
          chunkSuccess = true;
        } catch (err: unknown) {
          const errMsg =
            typeof err === 'object' && err !== null && 'message' in err
              ? String((err as { message: unknown }).message)
              : err instanceof Error
              ? err.message
              : String(err);

          if (
            errMsg.includes('429') ||
            errMsg.includes('RESOURCE_EXHAUSTED') ||
            errMsg.toLowerCase().includes('quota') ||
            errMsg.toLowerCase().includes('rate limit')
          ) {
            console.warn('[DocuChunk AI] Cuota de tokens agotada en IA, activando pausa segura.');
            chunk.status = 'paused';
            chunksCopy[i] = { ...chunk };
            currentSession.chunks = [...chunksCopy];
            currentSession.status = 'quota_paused';
            currentSession.quotaExhaustedMessage =
              'Límite de cuota o tokens de IA excedido (RESOURCE_EXHAUSTED). El avance quedó registrado en el navegador para reanudarlo cuando se reponga el límite.';
            setSession({ ...currentSession });
            setIsProcessing(false);
            setRetryState(null);
            return;
          }

          if (
            errMsg.includes('503') ||
            errMsg.includes('high demand') ||
            errMsg.includes('UNAVAILABLE')
          ) {
            chunkAttempt++;
            for (let sec = 5; sec > 0; sec--) {
              if (isPauseRequestedRef.current) {
                chunk.status = 'paused';
                chunksCopy[i] = { ...chunk };
                currentSession.chunks = [...chunksCopy];
                currentSession.status = 'paused';
                setSession({ ...currentSession });
                setIsProcessing(false);
                setRetryState(null);
                return;
              }
              setRetryState({
                chunkIndex: i,
                secondsLeft: sec,
                attempt: chunkAttempt,
                message: errMsg,
              });
              await new Promise((r) => setTimeout(r, 1000));
            }
            setRetryState(null);
            continue;
          }

          console.error('Error processing chunk (unexpected):', err);
          chunk.status = 'failed';
          chunk.error = errMsg;
          chunksCopy[i] = { ...chunk };
          currentSession.chunks = [...chunksCopy];
          currentSession.status = 'error';
          setSession({ ...currentSession });
          setIsProcessing(false);
          setRetryState(null);
          return;
        }
      }
    }

    // All chunks processed
    currentSession.status = 'completed';
    currentSession.chunks = [...chunksCopy];
    setSession({ ...currentSession });
    setIsProcessing(false);

    // If mode is summarize, trigger global synthesis
    if (currentSession.options.mode === 'summarize') {
      handleGenerateGlobalSynthesis(currentSession);
    }
  };

  const handlePause = () => {
    isPauseRequestedRef.current = true;
    setRetryState(null);
    if (session) {
      setSession({
        ...session,
        status: 'paused',
      });
    }
    setIsProcessing(false);
  };

  const handleRetryChunk = async (chunkIndex: number) => {
    if (!session || isProcessing) return;
    const currentSession = { ...session };
    const chunk = currentSession.chunks[chunkIndex];
    if (!chunk) return;

    chunk.status = 'processing';
    chunk.error = undefined;
    setSession({ ...currentSession });
    setIsProcessing(true);

    try {
      const response = await fetch('/api/process-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunkIndex,
          totalChunks: currentSession.chunks.length,
          chunkText: chunk.text,
          mode: currentSession.options.mode,
          options: {
            targetLanguage: currentSession.options.targetLanguage,
            summaryType: currentSession.options.summaryType,
            styleTarget: currentSession.options.styleTarget,
            customInstructions: currentSession.options.customInstructions,
            skipIntroAndIndex: currentSession.options.skipIntroAndIndex,
            skipReferences: currentSession.options.skipReferences,
            preserveTechnicalTerms: currentSession.options.preserveTechnicalTerms,
            highlightKeyMetrics: currentSession.options.highlightKeyMetrics,
            extraTasksPrompt: currentSession.options.extraTasksPrompt,
          },
        }),
      });

      const rawText = await response.text();
      let data: any = {};
      let isJson = false;
      try {
        data = JSON.parse(rawText);
        isJson = true;
      } catch {
        isJson = false;
      }

      const isWarmupOrHtml = !isJson && (
        rawText.includes('<!doctype') ||
        rawText.includes('<html') ||
        rawText.includes('warmup') ||
        rawText.includes('Starting Server') ||
        rawText.includes('Please wait while your application starts')
      );

      // Check 503 UNAVAILABLE or HTML Gateway / Warmup
      if (
        isWarmupOrHtml ||
        response.status === 503 ||
        response.status === 502 ||
        response.status === 504 ||
        data?.code === 503 ||
        data?.error?.code === 503 ||
        data?.isHighDemand ||
        (!isJson && (rawText.includes('503') || rawText.includes('high demand') || rawText.includes('UNAVAILABLE') || rawText.includes('Gateway'))) ||
        (typeof data?.message === 'string' && data.message.includes('high demand'))
      ) {
        const msg503 = isWarmupOrHtml
          ? 'El servidor se está reconectando. Reintentando automáticamente...'
          : data?.error?.message ||
            data?.message ||
            'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.';

        for (let sec = 5; sec > 0; sec--) {
          setRetryState({
            chunkIndex,
            secondsLeft: sec,
            attempt: 1,
            message: msg503,
          });
          await new Promise((r) => setTimeout(r, 1000));
        }
        setRetryState(null);
        setIsProcessing(false);
        return handleRetryChunk(chunkIndex);
      }

      if (response.status === 429 || data?.isQuotaExhausted) {
        chunk.status = 'paused';
        currentSession.status = 'quota_paused';
        currentSession.quotaExhaustedMessage = data?.message || 'Cuota agotada';
      } else if (!response.ok) {
        chunk.status = 'failed';
        chunk.error = data?.message || `Error al reintentar fragmento (${response.status})`;
      } else {
        chunk.status = 'completed';
        chunk.result = data?.resultText || rawText;
        chunk.processedAt = Date.now();
      }
    } catch (err: unknown) {
      const errMsg =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : err instanceof Error
          ? err.message
          : 'Error de conexión';
      if (
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.toLowerCase().includes('quota') ||
        errMsg.toLowerCase().includes('rate limit')
      ) {
        chunk.status = 'paused';
        currentSession.status = 'quota_paused';
        currentSession.quotaExhaustedMessage = 'Límite de cuota o tokens de IA excedido (RESOURCE_EXHAUSTED).';
      } else {
        chunk.status = 'failed';
        chunk.error = errMsg;
      }
    } finally {
      setSession({ ...currentSession });
      setIsProcessing(false);
    }
  };

  const handleGenerateGlobalSynthesis = async (sessToUse?: ProcessingSession) => {
    const active = sessToUse || session;
    if (!active) return;

    const completed = active.chunks.filter((c) => c.status === 'completed' && c.result);
    if (completed.length === 0) return;

    setIsSynthesizing(true);
    try {
      const response = await fetch('/api/synthesize-global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: active.options.mode,
          documentTitle: active.title,
          chunkSummaries: completed.map((c) => c.result),
        }),
      });

      const rawText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        data = {};
      }

      if (data?.globalSynthesis) {
        setSession((prev) => (prev ? { ...prev, globalSynthesis: data.globalSynthesis } : null));
      }
    } catch (err) {
      console.error('Error in global synthesis:', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleReset = () => {
    if (isProcessing) return;
    setRetryState(null);
    clearCurrentSession();
    setSession(null);
    setResumePrompt(null);
    setSelectedChunkIndex(0);
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans flex flex-col">
      <Header
        session={session}
        onNewSession={handleReset}
        onReset={handleReset}
        isProcessing={isProcessing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Saved Session Resume Prompt modal/banner */}
        {resumePrompt && !session && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-amber-950 text-base">
                    Sesión Previa Guardada Detectada
                  </span>
                  <span className="text-[11px] font-semibold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                    Guardado Automático
                  </span>
                </div>
                <p className="text-xs text-amber-900">
                  Documento: <strong className="font-semibold text-amber-950">{resumePrompt.title}</strong> · Hay{' '}
                  <strong>{resumePrompt.chunks.filter((c) => c.status === 'completed').length} de {resumePrompt.chunks.length} partes completadas</strong>.
                  ¿Deseas continuar exactamente donde se quedó?
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearCurrentSession();
                    setResumePrompt(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 rounded-md border border-amber-300 transition-colors"
                >
                  Descartar y empezar de cero
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSession(resumePrompt);
                    setResumePrompt(null);
                  }}
                  className="px-4 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
                >
                  Continuar Sesión
                </button>
              </div>
            </div>
          </div>
        )}

        {/* State 1: No document yet -> Uploader */}
        {!session && (
          <DocumentUploader
            onDocumentLoaded={handleDocumentLoaded}
            isLoading={isProcessing}
          />
        )}

        {/* State 2: Document Loaded */}
        {session && (
          <div className="space-y-8">
            {/* Quota Exhausted Banner if paused due to quota */}
            {session.status === 'quota_paused' && (
              <QuotaExhaustedBanner
                currentChunkIndex={session.chunks.findIndex((c) => c.status !== 'completed')}
                totalChunks={session.chunks.length}
                errorMessage={session.quotaExhaustedMessage}
                onResume={startOrResumeProcessing}
                isSimulated={session.options.simulateQuotaAtChunk !== null}
                onDisableSimulation={() => {
                  setSession({
                    ...session,
                    options: {
                      ...session.options,
                      simulateQuotaAtChunk: null,
                    },
                  });
                }}
              />
            )}

            {/* 1. Pre-Analysis Overview (Letters, Words, Pages & Optimal Chunk Strategy) */}
            <AnalysisOverview
              metrics={session.metrics}
              fileName={session.title}
              chunkWordSize={session.options.chunkWordSize}
              totalChunks={session.chunks.length}
              onChunkSizeChange={handleChunkSizeChange}
            />

            {/* 2. Processing Configuration (Translate, Summarize, Proofread, Style) */}
            {session.status === 'ready' && (
              <ProcessingConfig
                options={session.options}
                onChange={handleOptionsChange}
                onStart={startOrResumeProcessing}
                isProcessing={isProcessing}
                totalChunks={session.chunks.length}
              />
            )}

            {/* High Demand (Error 503) 5-second Auto-Retry Notice */}
            {retryState && (
              <HighDemandRetryNotice
                chunkIndex={retryState.chunkIndex}
                totalChunks={session.chunks.length}
                secondsLeft={retryState.secondsLeft}
                attempt={retryState.attempt}
                message={retryState.message}
              />
            )}

            {/* Progress Tracker (Visible once started or resumed) */}
            {session.status !== 'ready' && (
              <ProgressTracker
                chunks={session.chunks}
                isProcessing={isProcessing}
                status={session.status}
                onPause={handlePause}
                onResume={startOrResumeProcessing}
                onReset={handleReset}
                onSelectChunk={(idx) => setSelectedChunkIndex(idx)}
                selectedChunkIndex={selectedChunkIndex}
                retryState={retryState}
              />
            )}

            {/* Chunk Inspector (Side-by-side verification of any chunk) */}
            {session.chunks[selectedChunkIndex] && session.status !== 'ready' && (
              <ChunkViewer
                chunk={session.chunks[selectedChunkIndex]}
                totalChunks={session.chunks.length}
                mode={session.options.mode}
                onPrev={() => setSelectedChunkIndex((prev) => Math.max(0, prev - 1))}
                onNext={() => setSelectedChunkIndex((prev) => Math.min(session.chunks.length - 1, prev + 1))}
                onRetry={handleRetryChunk}
                isProcessing={isProcessing}
              />
            )}

            {/* 3. Result Viewer (Full assembled document, export, global synthesis) */}
            {session.status !== 'ready' && (
              <ResultViewer
                chunks={session.chunks}
                mode={session.options.mode}
                documentTitle={session.title}
                globalSynthesis={session.globalSynthesis}
                onRequestSynthesis={() => handleGenerateGlobalSynthesis()}
                isSynthesizing={isSynthesizing}
              />
            )}
          </div>
        )}
      </main>

      {/* Quiet footer */}
      <footer className="border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DocuChunk AI · Procesamiento Masivo con Fragmentación Semántica y Tolerancia a Límites de Cuota</span>
          <span className="text-stone-400">Desarrollado con Google Gemini 3.8 Flash</span>
        </div>
      </footer>
    </div>
  );
}
