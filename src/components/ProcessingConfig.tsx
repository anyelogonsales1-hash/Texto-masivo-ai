import React, { useState } from 'react';
import {
  Languages,
  FileText,
  CheckCircle,
  Palette,
  Sparkles,
  Play,
  ShieldAlert,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Filter,
  Plus,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Save,
  Check,
} from 'lucide-react';
import { ProcessingMode, ProcessingOptions, StyleTarget, SummaryType, TaskPreset } from '../types';
import {
  getSavedTaskPresets,
  saveUserTaskPreset,
  deleteUserTaskPreset,
} from '../utils/storage';

interface ProcessingConfigProps {
  options: ProcessingOptions;
  onChange: (updated: Partial<ProcessingOptions>) => void;
  onStart: () => void;
  isProcessing: boolean;
  totalChunks: number;
}

const LANGUAGES = [
  'Español',
  'Inglés (English)',
  'Francés (Français)',
  'Alemán (Deutsch)',
  'Portugués (Português)',
  'Italiano',
  'Chino Mandarín (中文)',
  'Japonés (日本語)',
  'Ruso (Русский)',
  'Árabe (العربية)',
];

const SUMMARY_TYPES: { id: SummaryType; label: string; desc: string }[] = [
  { id: 'executive', label: 'Resumen Ejecutivo', desc: 'Estructurado con visión general y puntos clave' },
  { id: 'bullet_points', label: 'Viñetas Clave', desc: 'Lista concisa de datos, cifras y conceptos centrales' },
  { id: 'key_takeaways', label: 'Conclusiones y Aprendizajes', desc: 'Enfocado en resoluciones e impactos' },
  { id: 'detailed', label: 'Síntesis Exhaustiva', desc: 'Preserva argumentos completos y cronología' },
];

const STYLE_TARGETS: { id: StyleTarget; label: string; desc: string }[] = [
  { id: 'executive', label: 'Ejecutivo y Corporativo', desc: 'Conciso, formal, orientado a decisiones y resultados' },
  { id: 'academic', label: 'Académico y Erudito', desc: 'Riguroso, formal con terminología analítica' },
  { id: 'journalistic', label: 'Periodístico y Directo', desc: 'Ágil, cautivador, claro y de lectura fluida' },
  { id: 'creative', label: 'Creativo y Literario', desc: 'Expresivo, rico en recursos narrativos y ritmo' },
  { id: 'casual', label: 'Divulgativo y Accesible', desc: 'Cercano, comprensible para todo público sin perder rigor' },
  { id: 'technical', label: 'Técnico y Preciso', desc: 'Estructurado, exacto y sin ambigüedades' },
];

const SUGGESTED_EXTRA_TASKS = [
  'Omitir saludos, firmas y formalismos',
  'Resaltar conceptos clave en negrita',
  'Explicar términos complejos brevemente',
  'Extraer cronología e hitos en lista ordenada',
  'Priorizar acuerdos y compromisos vinculantes',
];

export const ProcessingConfig: React.FC<ProcessingConfigProps> = ({
  options,
  onChange,
  onStart,
  isProcessing,
  totalChunks,
}) => {
  const [presets, setPresets] = useState<TaskPreset[]>(() => getSavedTaskPresets());
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [showSavePresetInput, setShowSavePresetInput] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [presetSuccessMsg, setPresetSuccessMsg] = useState<string | null>(null);

  const modes: { id: ProcessingMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'translate',
      label: 'Traducir',
      icon: <Languages className="w-4 h-4" />,
      desc: 'Traducción íntegra y profesional al idioma elegido sin omisiones.',
    },
    {
      id: 'summarize',
      label: 'Resumir',
      icon: <FileText className="w-4 h-4" />,
      desc: 'Condensa cada parte y genera síntesis global articulada.',
    },
    {
      id: 'proofread',
      label: 'Mejorar Ortografía',
      icon: <CheckCircle className="w-4 h-4" />,
      desc: 'Corrección editorial: tildes, puntuación, concordancia y sintaxis.',
    },
    {
      id: 'style',
      label: 'Cambiar Estilo',
      icon: <Palette className="w-4 h-4" />,
      desc: 'Reescribe el texto adaptándolo a un tono o registro específico.',
    },
  ];

  const handleApplyPreset = (preset: TaskPreset) => {
    onChange({
      skipIntroAndIndex: preset.skipIntroAndIndex,
      skipReferences: preset.skipReferences,
      preserveTechnicalTerms: preset.preserveTechnicalTerms,
      highlightKeyMetrics: preset.highlightKeyMetrics,
      extraTasksPrompt: preset.extraTasksPrompt,
      customInstructions: preset.customInstructions || options.customInstructions,
    });
    setActivePresetId(preset.id);
    setPresetSuccessMsg(`Plantilla "${preset.name}" aplicada con éxito.`);
    setTimeout(() => setPresetSuccessMsg(null), 3000);
  };

  const handleSaveCurrentAsPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: TaskPreset = {
      id: `custom-preset-${Date.now()}`,
      name: newPresetName.trim(),
      createdAt: Date.now(),
      isBuiltIn: false,
      skipIntroAndIndex: options.skipIntroAndIndex,
      skipReferences: options.skipReferences,
      preserveTechnicalTerms: options.preserveTechnicalTerms,
      highlightKeyMetrics: options.highlightKeyMetrics,
      extraTasksPrompt: options.extraTasksPrompt,
      customInstructions: options.customInstructions,
    };
    const updated = saveUserTaskPreset(newPreset);
    setPresets(updated);
    setActivePresetId(newPreset.id);
    setNewPresetName('');
    setShowSavePresetInput(false);
    setPresetSuccessMsg(`Plantilla "${newPreset.name}" guardada permanentemente.`);
    setTimeout(() => setPresetSuccessMsg(null), 3500);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteUserTaskPreset(id);
    setPresets(updated);
    if (activePresetId === id) setActivePresetId(null);
  };

  const handleAddSuggestion = (suggestion: string) => {
    const current = options.extraTasksPrompt ? options.extraTasksPrompt.trim() : '';
    if (current.includes(suggestion)) return;
    const separator = current ? '; ' : '';
    onChange({ extraTasksPrompt: `${current}${separator}${suggestion}` });
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-7">
      {/* 1. Mode selection */}
      <div className="space-y-4">
        <div className="border-b border-stone-100 pb-3">
          <h2 className="text-base font-semibold text-stone-900">2. Selección del Modo de Procesamiento</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Elige la transformación central que la IA aplicará a cada una de las {totalChunks} partes del documento.
          </p>
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {modes.map((mode) => {
            const isSelected = options.mode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChange({ mode: mode.id })}
                disabled={isProcessing}
                className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 text-stone-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`p-1.5 rounded-md ${isSelected ? 'bg-stone-800 text-amber-300' : 'bg-stone-200 text-stone-700'}`}>
                      {mode.icon}
                    </span>
                    <span className="font-semibold text-sm">{mode.label}</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                    {mode.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sub-options for the active mode */}
        <div className="p-4 rounded-lg bg-stone-50 border border-stone-200/70 space-y-4">
          {options.mode === 'translate' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-800">
                Idioma de Destino para Todas las Partes:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => onChange({ targetLanguage: lang })}
                    disabled={isProcessing}
                    className={`px-3 py-2 text-xs rounded-md border text-left transition-colors ${
                      options.targetLanguage === lang
                        ? 'border-stone-900 bg-stone-900 text-white font-medium'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          )}

          {options.mode === 'summarize' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-800">
                Profundidad y Formato del Resumen por Parte:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUMMARY_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => onChange({ summaryType: type.id })}
                    disabled={isProcessing}
                    className={`p-3 text-xs rounded-md border text-left transition-colors ${
                      options.summaryType === type.id
                        ? 'border-stone-900 bg-stone-900 text-white font-medium'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div className="font-semibold">{type.label}</div>
                    <div className={`text-[11px] mt-0.5 ${options.summaryType === type.id ? 'text-stone-300' : 'text-stone-500'}`}>
                      {type.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {options.mode === 'proofread' && (
            <div className="text-xs text-stone-700 space-y-1">
              <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Protocolo de Corrección Ortográfica y Gramatical</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                La IA analizará cada parte exhaustivamente para subsanar gazapos, tildes, comas mal situadas, discordancias de número/género y problemas de cohesión, garantizando la preservación estricta de la intención del autor original.
              </p>
            </div>
          )}

          {options.mode === 'style' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-800">
                Estilo o Registro Deseado:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {STYLE_TARGETS.map((target) => (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => onChange({ styleTarget: target.id })}
                    disabled={isProcessing}
                    className={`p-3 text-xs rounded-md border text-left transition-colors ${
                      options.styleTarget === target.id
                        ? 'border-stone-900 bg-stone-900 text-white font-medium'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div className="font-semibold">{target.label}</div>
                    <div className={`text-[11px] mt-0.5 line-clamp-2 ${options.styleTarget === target.id ? 'text-stone-300' : 'text-stone-500'}`}>
                      {target.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Extra Tasks, Presets and Content Filtering */}
      <div className="space-y-4">
        <div className="border-b border-stone-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-700" />
              <h2 className="text-base font-semibold text-stone-900">3. Tareas Extras y Filtros Reutilizables</h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Configura directivas especiales (omitir introducciones e índices), añade tareas libres y guárdalas como plantilla para reutilizarlas una y otra vez.
            </p>
          </div>

          {/* Save current tasks as preset trigger button */}
          <button
            type="button"
            onClick={() => setShowSavePresetInput(!showSavePresetInput)}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md transition-colors self-start sm:self-auto"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-700" />
            <span>{showSavePresetInput ? 'Cancelar guardado' : 'Guardar tareas actuales como plantilla'}</span>
          </button>
        </div>

        {/* Inline Save Preset Form */}
        {showSavePresetInput && (
          <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-300 space-y-2">
            <label className="block text-xs font-semibold text-amber-950">
              Nombre para guardar esta plantilla de tareas (se conservará en la app):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ej.: Solo Cuerpo y Argumentos Centrales, Auditoría Legal, etc."
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCurrentAsPreset()}
                className="flex-1 text-xs px-3 py-2 bg-white border border-amber-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleSaveCurrentAsPreset}
                disabled={!newPresetName.trim()}
                className="inline-flex items-center gap-1 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-40"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Plantilla</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback message when preset is applied or saved */}
        {presetSuccessMsg && (
          <div className="px-3.5 py-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{presetSuccessMsg}</span>
          </div>
        )}

        {/* Saved Presets Selector Carousel/Grid */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
            <span className="flex items-center gap-1.5">
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Plantillas de tareas disponibles para aplicar con 1 clic:</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {presets.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => !isProcessing && handleApplyPreset(preset)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all relative group flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-xs'
                      : 'bg-white border-stone-200 hover:border-amber-300 hover:bg-stone-50/50 text-stone-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-xs truncate" title={preset.name}>
                        {preset.name}
                      </span>
                      {preset.isBuiltIn ? (
                        <span className="text-[10px] uppercase font-bold text-stone-400 bg-stone-100 px-1.5 py-0.2 rounded">
                          Predefinida
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleDeletePreset(preset.id, e)}
                          title="Eliminar plantilla personalizada"
                          className="text-stone-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {preset.description && (
                      <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                    <span className={isSelected ? 'font-semibold text-amber-800' : 'text-stone-400 group-hover:text-stone-700'}>
                      {isSelected ? '✓ Aplicada actualmente' : 'Hacer clic para usar'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content filter toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Skip Intro & Index */}
          <button
            type="button"
            onClick={() => {
              onChange({ skipIntroAndIndex: !options.skipIntroAndIndex });
              setActivePresetId(null);
            }}
            disabled={isProcessing}
            className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
              options.skipIntroAndIndex
                ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <div className="mt-0.5 text-amber-700">
              {options.skipIntroAndIndex ? (
                <CheckSquare className="w-4 h-4 text-amber-800" />
              ) : (
                <Square className="w-4 h-4 text-stone-400" />
              )}
            </div>
            <div>
              <div className="text-xs font-semibold">
                Saltarse introducción, comentarios e índice
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                Omite prólogos, tablas de contenido y notas preliminares para enfocarse exclusivamente en el cuerpo sustancial del texto.
              </div>
            </div>
          </button>

          {/* Skip References & Footnotes */}
          <button
            type="button"
            onClick={() => {
              onChange({ skipReferences: !options.skipReferences });
              setActivePresetId(null);
            }}
            disabled={isProcessing}
            className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
              options.skipReferences
                ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <div className="mt-0.5 text-amber-700">
              {options.skipReferences ? (
                <CheckSquare className="w-4 h-4 text-amber-800" />
              ) : (
                <Square className="w-4 h-4 text-stone-400" />
              )}
            </div>
            <div>
              <div className="text-xs font-semibold">
                Omitir bibliografía y notas al pie
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                Filtra citas bibliográficas finales y notas al pie para mantener un documento limpio y fluido.
              </div>
            </div>
          </button>

          {/* Preserve Technical Terms */}
          <button
            type="button"
            onClick={() => {
              onChange({ preserveTechnicalTerms: !options.preserveTechnicalTerms });
              setActivePresetId(null);
            }}
            disabled={isProcessing}
            className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
              options.preserveTechnicalTerms
                ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <div className="mt-0.5 text-amber-700">
              {options.preserveTechnicalTerms ? (
                <CheckSquare className="w-4 h-4 text-amber-800" />
              ) : (
                <Square className="w-4 h-4 text-stone-400" />
              )}
            </div>
            <div>
              <div className="text-xs font-semibold">
                Preservar términos técnicos y nombres propios
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                Conserva marcas, siglas, acrónimos y vocabulario especializado sin modificarlos.
              </div>
            </div>
          </button>

          {/* Highlight Key Metrics */}
          <button
            type="button"
            onClick={() => {
              onChange({ highlightKeyMetrics: !options.highlightKeyMetrics });
              setActivePresetId(null);
            }}
            disabled={isProcessing}
            className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
              options.highlightKeyMetrics
                ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <div className="mt-0.5 text-amber-700">
              {options.highlightKeyMetrics ? (
                <CheckSquare className="w-4 h-4 text-amber-800" />
              ) : (
                <Square className="w-4 h-4 text-stone-400" />
              )}
            </div>
            <div>
              <div className="text-xs font-semibold">
                Destacar cifras, métricas y fechas clave
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                Identifica y prioriza datos numéricos, porcentajes y conclusiones cuantitativas importantes.
              </div>
            </div>
          </button>
        </div>

        {/* Free-form extra tasks textarea */}
        <div className="p-4 rounded-lg bg-stone-50 border border-stone-200/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-stone-800">
              Directivas y tareas extras personalizadas para la IA:
            </label>
            {options.extraTasksPrompt && (
              <button
                type="button"
                onClick={() => onChange({ extraTasksPrompt: '' })}
                className="text-[11px] text-stone-400 hover:text-stone-700 underline"
              >
                Limpiar campo
              </button>
            )}
          </div>

          <textarea
            rows={3}
            placeholder="Ej.: Saltarse introducción y comentarios preliminares; enfocarse únicamente en el cuerpo sustancial del texto; generar conclusiones al final de cada parte..."
            value={options.extraTasksPrompt || ''}
            onChange={(e) => {
              onChange({ extraTasksPrompt: e.target.value });
              setActivePresetId(null);
            }}
            disabled={isProcessing}
            className="w-full text-xs p-3 bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 font-sans"
          />

          {/* Quick suggestions pills */}
          <div className="space-y-1">
            <span className="text-[11px] text-stone-500">Sugerencias rápidas para agregar con un clic:</span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {SUGGESTED_EXTRA_TASKS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleAddSuggestion(sug)}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-md transition-colors"
                >
                  <Plus className="w-3 h-3 text-stone-400" />
                  <span>{sug}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostics and simulation testers */}
      <div className="space-y-2 pt-1 border-t border-stone-100">
        <span className="text-xs font-semibold text-stone-700">Herramientas de simulación para pruebas:</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Token quota simulation tester */}
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-stone-600 shrink-0" />
              <div>
                <span className="font-semibold text-stone-800">Simulación cuota (429):</span>
                <span className="text-stone-500 block text-[11px]">Prueba pausa y guardado</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange({ simulateQuotaAtChunk: options.simulateQuotaAtChunk === 2 ? null : 2 })}
              className={`px-3 py-1 rounded text-[11px] font-medium border transition-colors ${
                options.simulateQuotaAtChunk === 2
                  ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              {options.simulateQuotaAtChunk === 2 ? '✓ Activa (Parte 2)' : 'Simular 429'}
            </button>
          </div>

          {/* 503 High demand simulation tester */}
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-stone-600 shrink-0" />
              <div>
                <span className="font-semibold text-stone-800">Simulación demanda (503):</span>
                <span className="text-stone-500 block text-[11px]">Prueba auto-reintento en 5s</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange({ simulate503AtChunk: options.simulate503AtChunk === 1 ? null : 1 })}
              className={`px-3 py-1 rounded text-[11px] font-medium border transition-colors ${
                options.simulate503AtChunk === 1
                  ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              {options.simulate503AtChunk === 1 ? '✓ Activa (Parte 1)' : 'Simular 503'}
            </button>
          </div>
        </div>
      </div>

      {/* Start button */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onStart}
          disabled={isProcessing || totalChunks === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-semibold hover:bg-stone-800 transition-colors shadow-xs disabled:opacity-40"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Iniciar Procesamiento de las {totalChunks} Partes</span>
        </button>
      </div>
    </div>
  );
};
