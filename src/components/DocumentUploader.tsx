import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  BookOpen,
  ArrowRight,
  FileType,
  Loader2,
  FileCode,
  CheckCircle,
} from 'lucide-react';
import mammoth from 'mammoth';
import { SAMPLE_DOCUMENTS, SampleDoc } from '../utils/sampleDocuments';

interface DocumentUploaderProps {
  onDocumentLoaded: (text: string, fileName: string, actualPdfPages?: number) => void;
  isLoading: boolean;
}

const SUPPORTED_FORMATS = [
  { ext: 'PDF', label: 'Adobe PDF (.pdf)', badge: 'bg-rose-100 text-rose-800' },
  { ext: 'DOCX', label: 'Word (.docx)', badge: 'bg-blue-100 text-blue-800' },
  { ext: 'TXT', label: 'Texto plano (.txt)', badge: 'bg-stone-100 text-stone-800' },
  { ext: 'MD', label: 'Markdown (.md)', badge: 'bg-purple-100 text-purple-800' },
  { ext: 'HTML', label: 'Web (.html, .htm)', badge: 'bg-amber-100 text-amber-800' },
  { ext: 'RTF', label: 'Rich Text (.rtf)', badge: 'bg-indigo-100 text-indigo-800' },
  { ext: 'CSV/JSON', label: 'Datos (.csv, .json)', badge: 'bg-emerald-100 text-emerald-800' },
];

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onDocumentLoaded, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [fileNameCustom, setFileNameCustom] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parsingStatusText, setParsingStatusText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);
    setIsParsingFile(true);
    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    try {
      if (ext === 'pdf') {
        setParsingStatusText('Extrayendo texto y páginas del archivo PDF...');
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        const len = bytes.byteLength;
        const chunkSize = 8192;
        for (let i = 0; i < len; i += chunkSize) {
          binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(i + chunkSize, len))));
        }
        const base64Data = btoa(binary);

        const res = await fetch('/api/parse-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data, fileName: file.name }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Error al procesar el archivo PDF');
        }

        onDocumentLoaded(data.text, file.name, data.numPages);
      } else if (ext === 'docx') {
        setParsingStatusText('Extrayendo texto de documento Word (.docx)...');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (!result.value || !result.value.trim()) {
          throw new Error('No se pudo extraer texto legible del archivo .docx');
        }
        onDocumentLoaded(result.value, fileName);
      } else if (ext === 'html' || ext === 'htm') {
        setParsingStatusText('Analizando contenido HTML y depurando etiquetas...');
        const textContent = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(textContent, 'text/html');
        doc.querySelectorAll('script, style, noscript, nav, header, footer').forEach((el) => el.remove());
        const extracted = (doc.body.textContent || '').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
        if (!extracted) throw new Error('El archivo HTML no contiene texto interpretable');
        onDocumentLoaded(extracted, fileName);
      } else if (ext === 'rtf') {
        setParsingStatusText('Decodificando archivo de formato enriquecido (.rtf)...');
        const rawRtf = await file.text();
        const stripped = rawRtf
          .replace(/\\par[d]?/g, '\n')
          .replace(/\{\\*?\\[^{}]+;\}|[{}]|\\\w+/g, '')
          .trim();
        if (!stripped) throw new Error('No se pudo extraer texto legible del archivo RTF');
        onDocumentLoaded(stripped, fileName);
      } else {
        // Text, markdown, csv, tsv, json, xml, yaml, etc.
        setParsingStatusText('Cargando archivo de texto...');
        const content = await file.text();
        if (!content || !content.trim()) {
          throw new Error('El archivo seleccionado está vacío');
        }
        onDocumentLoaded(content, fileName);
      }
    } catch (err: unknown) {
      console.error('Error reading file:', err);
      const msg = err instanceof Error ? err.message : 'Error al procesar el archivo';
      setErrorMessage(msg);
    } finally {
      setIsParsingFile(false);
      setParsingStatusText('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handlePastedSubmit = () => {
    if (!pastedText.trim()) return;
    const name = fileNameCustom.trim() || 'Texto pegado sin título';
    onDocumentLoaded(pastedText, name);
  };

  const handleSelectSample = (sample: SampleDoc) => {
    onDocumentLoaded(sample.text, sample.title);
  };

  const pastedWordCount = pastedText.trim() ? pastedText.trim().split(/\s+/).length : 0;
  const pastedCharCount = pastedText.length;

  return (
    <div className="space-y-8">
      {/* Editorial intro banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-4">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
          Procesamiento Masivo de Texto por Partes
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          Los modelos convencionales de IA truncan o simplifican en exceso cuando reciben documentos extensos.
          DocuChunk analiza primero el volumen total de páginas y letras de cualquier archivo (<strong>PDF, Word, Markdown, etc.</strong>), particiona inteligentemente el texto en bloques coherentes, y los procesa secuencialmente con memoria y salvaguarda automática ante el agotamiento de cuotas.
        </p>

        {/* Supported formats showcase bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="text-xs text-stone-500 font-medium mr-1">Formatos admitidos:</span>
          {SUPPORTED_FORMATS.map((fmt) => (
            <span
              key={fmt.ext}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${fmt.badge}`}
              title={fmt.label}
            >
              {fmt.ext}
            </span>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="max-w-2xl mx-auto p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900 text-xs font-semibold">
            Cerrar
          </button>
        </div>
      )}

      {/* Main Upload / Input area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Drag and Drop & Paste */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-base font-semibold text-stone-900">1. Proporcionar Documento Extenso</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Arrastra o selecciona un archivo (<strong>PDF, DOCX, TXT, MD, HTML, RTF</strong>) o pega texto directamente.
            </p>
          </div>

          {/* Drag & drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isParsingFile && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-stone-800 bg-stone-50 scale-[0.99]'
                : isParsingFile
                ? 'border-amber-400 bg-amber-50/40 cursor-wait'
                : 'border-stone-300 hover:border-stone-400 hover:bg-stone-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md,.markdown,.html,.htm,.rtf,.json,.csv,.tsv,.xml,.log,.yaml,.yml"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {isParsingFile ? (
              <div className="space-y-2">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-600" />
                <p className="text-sm font-semibold text-stone-800">{parsingStatusText}</p>
                <p className="text-xs text-stone-500">Por favor, espera un momento...</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-700 mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-stone-800">
                  Haz clic para explorar o arrastra aquí tu archivo <span className="font-semibold text-stone-900">(PDF, Word DOCX, TXT, MD...)</span>
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Extracción automática de texto y conteo exacto de páginas y caracteres
                </p>
              </>
            )}
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-stone-200 w-full" />
            <span className="bg-white px-3 text-xs text-stone-400 font-medium uppercase tracking-wider">o bien pega el texto</span>
            <div className="border-t border-stone-200 w-full" />
          </div>

          {/* Paste area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <input
                type="text"
                placeholder="Título del documento (opcional)..."
                value={fileNameCustom}
                onChange={(e) => setFileNameCustom(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400"
              />
            </div>

            <div className="relative">
              <textarea
                rows={7}
                placeholder="Pega aquí el contenido completo del documento masivo que deseas procesar..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full text-xs font-mono text-stone-800 p-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 resize-y"
              />
              <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1.5 px-1">
                <div className="flex items-center gap-3">
                  <span>{pastedWordCount.toLocaleString()} palabras</span>
                  <span>·</span>
                  <span>{pastedCharCount.toLocaleString()} caracteres</span>
                  <span>·</span>
                  <span>~{Math.max(1, Math.ceil(pastedWordCount / 280))} págs. estimadas</span>
                </div>
                <button
                  type="button"
                  disabled={!pastedText.trim() || isLoading || isParsingFile}
                  onClick={handlePastedSubmit}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-stone-900 text-white rounded-md text-xs font-medium hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span>Analizar este texto</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Samples */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-stone-50 rounded-xl border border-stone-200 p-5 space-y-3">
            <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
              <BookOpen className="w-4 h-4 text-stone-700" />
              <span>Documentos de Prueba Listos</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              ¿No tienes un archivo a mano? Selecciona uno de estos documentos de múltiples páginas para probar la división en partes y el procesamiento inmediato:
            </p>

            <div className="space-y-2.5 pt-1">
              {SAMPLE_DOCUMENTS.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectSample(doc)}
                  disabled={isLoading || isParsingFile}
                  className="w-full text-left p-3 rounded-lg bg-white border border-stone-200/80 hover:border-stone-400 hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wide">
                      {doc.category}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      ~{doc.estimatedPages} páginas
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-stone-900 group-hover:text-stone-800 mt-1 line-clamp-1">
                    {doc.title}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                    {doc.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-4 text-xs text-amber-900 space-y-2">
            <div className="font-semibold flex items-center gap-1.5 text-amber-950">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Lectura Completa sin Pérdida</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              El motor extrae el texto completo de documentos PDF y Word preservando párrafos y estructura para que ninguna sección se quede sin procesar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
