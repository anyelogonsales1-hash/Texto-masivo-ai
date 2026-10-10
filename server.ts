import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { PDFParse } from "pdf-parse";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || "3000", 10);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper to determine if an error is token quota exhaustion
function isQuotaExhaustedError(err: unknown): boolean {
  if (!err) return false;
  const msg = typeof err === "object" && err !== null && "message" in err ? String((err as { message: unknown }).message) : String(err);
  const status = typeof err === "object" && err !== null && "status" in err ? (err as { status: unknown }).status : undefined;
  const code = typeof err === "object" && err !== null && "code" in err ? (err as { code: unknown }).code : undefined;
  const name = typeof err === "object" && err !== null && "name" in err ? String((err as { name: unknown }).name) : "";

  return (
    status === 429 ||
    status === "RESOURCE_EXHAUSTED" ||
    code === 429 ||
    name === "ApiError" && (String(status) === "429" || msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) ||
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.toLowerCase().includes("quota exceeded") ||
    msg.toLowerCase().includes("rate limit") ||
    msg.toLowerCase().includes("exceeded your current quota")
  );
}

// Helper to determine if an error is 503 model high demand / UNAVAILABLE
function isHighDemandUnavailableError(err: unknown): boolean {
  if (!err) return false;
  const msg = typeof err === "object" && err !== null && "message" in err ? String((err as { message: unknown }).message) : String(err);
  const status = typeof err === "object" && err !== null && "status" in err ? String((err as { status: unknown }).status) : "";
  const code = typeof err === "object" && err !== null && "code" in err ? Number((err as { code: unknown }).code) : 0;

  return (
    code === 503 ||
    status === "UNAVAILABLE" ||
    msg.includes("503") ||
    msg.includes("high demand") ||
    msg.includes("Spikes in demand are usually temporary") ||
    msg.includes("UNAVAILABLE")
  );
}

// Helper to generate content with intelligent model fallback (gemini-3.1-flash-lite -> gemini-3.8-flash)
async function generateContentWithFallback(params: {
  contents: string;
  systemInstruction?: string;
  temperature?: number;
}): Promise<string> {
  const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash"];
  let lastError: unknown = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          temperature: params.temperature ?? 0.7,
        },
      });
      return response.text || "";
    } catch (err: unknown) {
      lastError = err;
      if (isQuotaExhaustedError(err)) {
        console.warn(`[DocuChunk AI] Modelo '${model}' reportó cuota agotada (429/RESOURCE_EXHAUSTED).`);
        if (i < candidateModels.length - 1) {
          console.info(`[DocuChunk AI] Alternando automáticamente a modelo de respaldo '${candidateModels[i + 1]}'...`);
          continue;
        }
      } else if (isHighDemandUnavailableError(err)) {
        console.warn(`[DocuChunk AI] Modelo '${model}' en alta demanda temporal (503 UNAVAILABLE).`);
        if (i < candidateModels.length - 1) {
          console.info(`[DocuChunk AI] Alternando automáticamente a modelo de respaldo '${candidateModels[i + 1]}'...`);
          continue;
        }
      }
      throw err;
    }
  }

  throw lastError;
}

// Endpoint: Parse file formats including PDF
app.post("/api/parse-document", async (req, res) => {
  try {
    const { base64Data, fileName } = req.body;
    if (!base64Data || typeof base64Data !== "string") {
      return res.status(400).json({ error: "No se proporcionaron datos de archivo" });
    }

    const buffer = Buffer.from(base64Data, "base64");
    const ext = fileName?.split(".").pop()?.toLowerCase() || "";

    if (ext === "pdf") {
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      const text = textResult.text ? textResult.text.trim() : "";
      const numPages = textResult.total || (textResult.pages ? textResult.pages.length : undefined);
      await parser.destroy();

      if (!text) {
        return res.status(400).json({
          error: "El archivo PDF no contiene texto legible incrustado (puede ser un documento escaneado como imagen o estar protegido).",
        });
      }
      return res.json({
        text,
        numPages,
        fileName: fileName || "Documento.pdf",
      });
    }

    return res.status(400).json({ error: `Extensión .${ext} no soportada para análisis binario.` });
  } catch (error: unknown) {
    console.error("Error parsing document file:", error);
    const msg = error instanceof Error ? error.message : "Error al procesar el archivo PDF";
    return res.status(500).json({ error: msg });
  }
});

// Endpoint: Pre-analysis of text metrics
app.post("/api/analyze-document", (req, res) => {
  try {
    const { text, fileName } = req.body;
    if (typeof text !== "string") {
      return res.status(400).json({ error: "El contenido de texto es requerido" });
    }

    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s+/g, "").length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    // Standard estimation: ~250 words per page or ~1500 chars
    const estimatedPages = Math.max(1, Math.ceil(words / 280));
    // Approximate tokens (~4 chars per token for Latin languages)
    const estimatedTokens = Math.ceil(characters / 3.8);

    // Recommended chunk size calculation based on document length
    // If doc is large (> 50,000 words), chunk size ~ 2,500 words
    // If doc is medium (10,000 - 50,000 words), chunk size ~ 1,800 words
    // If doc is small (1,000 - 10,000 words), chunk size ~ 1,200 words
    let recommendedChunkWords = 1500;
    if (words > 60000) recommendedChunkWords = 2500;
    else if (words > 20000) recommendedChunkWords = 1800;
    else if (words < 5000) recommendedChunkWords = 900;

    const recommendedChunks = Math.max(1, Math.ceil(words / recommendedChunkWords));

    return res.json({
      fileName: fileName || "Documento",
      characters,
      charactersNoSpaces,
      words,
      estimatedPages,
      estimatedTokens,
      recommendedChunkWords,
      recommendedChunks,
    });
  } catch (error) {
    console.error("Error analyzing document:", error);
    return res.status(500).json({ error: "Error al analizar métricas del documento" });
  }
});

// Endpoint: Process an individual chunk
app.post("/api/process-chunk", async (req, res) => {
  try {
    const {
      chunkIndex,
      totalChunks,
      chunkText,
      mode,
      options = {},
      simulateQuotaExceeded = false,
      simulate503HighDemand = false,
    } = req.body;

    if (!chunkText || typeof chunkText !== "string") {
      return res.status(400).json({ error: "Texto de la parte no proporcionado" });
    }

    // Support simulated 503 high demand error
    if (simulate503HighDemand) {
      return res.status(503).json({
        error: {
          code: 503,
          message: "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
          status: "UNAVAILABLE",
        },
        retryAfterSeconds: 5,
        isHighDemand: true,
      });
    }

    // Support simulated quota exhaustion so user can test pause-and-resume
    if (simulateQuotaExceeded) {
      return res.status(429).json({
        error: "QUOTA_EXHAUSTED",
        message: "Límite de cuota de tokens alcanzado (Simulación). El proceso se pausa de forma segura para reanudar más tarde.",
        chunkIndex,
        isQuotaExhausted: true,
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "NO_API_KEY",
        message: "Clave de API de Gemini no configurada en el entorno.",
      });
    }

    const {
      targetLanguage = "Español",
      summaryType = "executive",
      styleTarget = "formal",
      customInstructions = "",
      skipIntroAndIndex = false,
      skipReferences = false,
      preserveTechnicalTerms = false,
      highlightKeyMetrics = false,
      extraTasksPrompt = "",
      contextSummary = "",
    } = options;

    const extraDirectivesList: string[] = [];

    if (skipIntroAndIndex) {
      extraDirectivesList.push(
        "FILTRO DE CONTENIDO: Omite y salta por completo introducciones, prólogos, notas de autor preliminares, tablas de contenido o índices y comentarios introductorios. Enfócate exclusivamente en el CUERPO PRINCIPAL Y SUSTANCIAL del texto."
      );
    }
    if (skipReferences) {
      extraDirectivesList.push(
        "FILTRO DE CONTENIDO: Omite bibliografías, listas de referencias y notas al pie sin valor narrativo."
      );
    }
    if (preserveTechnicalTerms) {
      extraDirectivesList.push(
        "TERMINOLOGÍA: Conserva términos técnicos especializados, nombres propios y acrónimos originales sin alterarlos."
      );
    }
    if (highlightKeyMetrics) {
      extraDirectivesList.push(
        "MÉTRICAS: Resalta de forma clara y prioritaria fechas, cifras numéricas, porcentajes y conclusiones medibles."
      );
    }
    if (extraTasksPrompt && typeof extraTasksPrompt === "string" && extraTasksPrompt.trim()) {
      extraDirectivesList.push(
        `TAREAS EXTRAS DEL USUARIO: ${extraTasksPrompt.trim()}`
      );
    }
    if (customInstructions && typeof customInstructions === "string" && customInstructions.trim()) {
      extraDirectivesList.push(
        `INSTRUCCIÓN ESPECÍFICA: ${customInstructions.trim()}`
      );
    }

    const extraDirectivesText = extraDirectivesList.length > 0
      ? `\nDIRECTIVAS Y TAREAS EXTRAS OBLIGATORIAS:\n${extraDirectivesList.map((d, i) => `${i + 1}. ${d}`).join("\n")}\n`
      : "";

    let systemInstruction = "";
    let prompt = "";

    const contextPrefix = contextSummary
      ? `CONTEXTO PREVIO DEL DOCUMENTO HASTA LA PARTE ANTERIOR:\n"""${contextSummary}"""\n\n`
      : "";

    switch (mode) {
      case "translate":
        systemInstruction = `Eres un traductor profesional de alta fidelidad. Tu misión es traducir de forma íntegra, fluida y precisa el fragmento del documento al idioma objetivo: ${targetLanguage}.
Reglas estrictas:
- Traduce el contenido del fragmento respetando el formato markdown.
${extraDirectivesText}
- No añadas comentarios introductorios ni despedidas. Devuelve únicamente el texto procesado.`;

        prompt = `${contextPrefix}Esta es la PARTE ${chunkIndex + 1} de ${totalChunks} de un documento extenso.
Idioma destino: ${targetLanguage}.
${extraDirectivesText}

TEXTO A TRADUCIR:
"""
${chunkText}
"""`;
        break;

      case "summarize":
        let styleDetail = "un resumen ejecutivo detallado y estructurado con puntos clave";
        if (summaryType === "bullet_points") styleDetail = "una lista concisa de viñetas con las ideas más importantes y datos clave";
        if (summaryType === "key_takeaways") styleDetail = "las lecciones, conclusiones y aprendizajes esenciales";
        if (summaryType === "detailed") styleDetail = "una síntesis exhaustiva que preserve argumentos, datos, evidencias y cronología";

        systemInstruction = `Eres un sintetizador y analista de textos de clase mundial. Tu objetivo es procesar partes consecutivas de un documento masivo y generar ${styleDetail}.
Reglas estrictas:
- El resumen debe ser claro, articulado y sustancioso.
${extraDirectivesText}
- No agregues introducciones como "En esta sección...", ve directo al contenido sintético estructurado.`;

        prompt = `${contextPrefix}Esta es la PARTE ${chunkIndex + 1} de ${totalChunks} del documento.
Tipo de resumen deseado: ${summaryType}.
${extraDirectivesText}

TEXTO DE ESTA PARTE:
"""
${chunkText}
"""`;
        break;

      case "proofread":
        systemInstruction = `Eres un corrector de estilo, gramática y ortografía editorial riguroso.
Tu objetivo es corregir minuciosamente el fragmento entregado:
- Corrige faltas ortográficas, tildes, puntuación y cohesión oracional.
- Respeta estrictamente la voz y mensaje original.
${extraDirectivesText}
- No incluyas notas al pie o saludos previos, entrega directamente la versión corregida.`;

        prompt = `${contextPrefix}Esta es la PARTE ${chunkIndex + 1} de ${totalChunks} del documento.
${extraDirectivesText}

TEXTO A CORREGIR:
"""
${chunkText}
"""`;
        break;

      case "style":
        let styleDesc = "Formal y Ejecutivo";
        if (styleTarget === "academic") styleDesc = "Académico, riguroso y formal con vocabulario erudito";
        if (styleTarget === "journalistic") styleDesc = "Periodístico, directo, atrapante y claro";
        if (styleTarget === "creative") styleDesc = "Creativo, literario y expresivo";
        if (styleTarget === "casual") styleDesc = "Cercano, conversacional y divulgativo accesible";
        if (styleTarget === "technical") styleDesc = "Técnico, preciso, estructurado y sin ambigüedades";

        systemInstruction = `Eres un maestro de la redacción y adaptación de estilo textual.
Tu tarea es reescribir el fragmento adaptándolo fielmente al estilo: ${styleDesc}.
${extraDirectivesText}
- No agregues prólogos ni explicaciones meta; entrega directamente el texto adaptado.`;

        prompt = `${contextPrefix}Esta es la PARTE ${chunkIndex + 1} de ${totalChunks} del documento.
Estilo objetivo: ${styleDesc}.
${extraDirectivesText}

TEXTO A ADAPTAR:
"""
${chunkText}
"""`;
        break;

      default:
        return res.status(400).json({ error: `Modo '${mode}' no reconocido` });
    }

    const resultText = await generateContentWithFallback({
      contents: prompt,
      systemInstruction,
      temperature: mode === "translate" || mode === "proofread" ? 0.2 : 0.7,
    });

    return res.json({
      chunkIndex,
      totalChunks,
      mode,
      resultText,
      inputChars: chunkText.length,
      outputChars: resultText.length,
      timestamp: Date.now(),
    });
  } catch (error: unknown) {
    if (isHighDemandUnavailableError(error)) {
      console.warn("[DocuChunk AI] Modelo temporalmente en alta demanda (503 UNAVAILABLE). Notificando para auto-reintento.");
      return res.status(503).json({
        error: {
          code: 503,
          message: "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
          status: "UNAVAILABLE",
        },
        retryAfterSeconds: 5,
        isHighDemand: true,
      });
    }

    if (isQuotaExhaustedError(error)) {
      const msg = typeof error === "object" && error !== null && "message" in error ? String((error as { message: unknown }).message) : "";
      const retryMatch = msg.match(/retry in\s+([0-9hms\.]+)/i);
      const retryTimeStr = retryMatch ? retryMatch[1].replace(/\.[0-9]+s/, 's') : undefined;

      console.warn(`[DocuChunk AI] Cuota diaria de tokens de IA agotada (RESOURCE_EXHAUSTED). Pausa segura activa. Reintento en ${retryTimeStr || 'mañana'}.`);

      return res.status(429).json({
        error: "QUOTA_EXHAUSTED",
        message: `Has alcanzado la cuota de tokens de la IA (RESOURCE_EXHAUSTED). El avance se ha guardado de forma segura y se reanudará en cuanto se restablezcan los tokens${retryTimeStr ? ` (estimado: en ${retryTimeStr})` : ' más tarde'}.`,
        isQuotaExhausted: true,
        retryIn: retryTimeStr,
      });
    }

    console.error("Error processing chunk (unexpected):", error);
    const errorMsg =
      error instanceof Error ? error.message : "Error desconocido al procesar la parte del documento";
    return res.status(500).json({ error: "PROCESSING_FAILED", message: errorMsg });
  }
});

// Endpoint: Global synthesis across all processed chunks
app.post("/api/synthesize-global", async (req, res) => {
  try {
    const { mode, documentTitle, chunkSummaries } = req.body;

    if (!Array.isArray(chunkSummaries) || chunkSummaries.length === 0) {
      return res.status(400).json({ error: "Se requiere la lista de fragmentos procesados" });
    }

    const combinedSummaries = chunkSummaries
      .map((item, idx) => `### Parte ${idx + 1} de ${chunkSummaries.length}:\n${item}`)
      .join("\n\n");

    const prompt = `Has procesado un documento extenso titulado "${documentTitle || "Documento"}" parte por parte.
A continuación tienes los resultados obtenidos en cada una de las ${chunkSummaries.length} partes:

${combinedSummaries}

TAREA FINAL:
Genera una SÍNTESIS GLOBAL MAESTRA y coherente que integre todos los hallazgos, estructura y conclusiones del documento completo.
Debe incluir:
1. Visión general panorámica y tesis central.
2. Hitos e ideas estructuradas secuencialmente a través de todas las partes.
3. Conclusiones finales o implicaciones clave.`;

    const resultText = await generateContentWithFallback({
      contents: prompt,
      systemInstruction:
        "Eres un editor en jefe y analista de síntesis estratégica. Genera un informe global cohesionado, estructurado con markdown profesional, sin redundancias.",
      temperature: 0.5,
    });

    return res.json({
      globalSynthesis: resultText || "",
    });
  } catch (error) {
    if (isHighDemandUnavailableError(error)) {
      return res.status(503).json({
        error: {
          code: 503,
          message: "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
          status: "UNAVAILABLE",
        },
        retryAfterSeconds: 5,
        isHighDemand: true,
      });
    }
    if (isQuotaExhaustedError(error)) {
      console.warn("[DocuChunk AI] Cuota agotada al sintetizar documento global.");
      return res.status(429).json({
        error: "QUOTA_EXHAUSTED",
        message: "Límite de cuota alcanzado al generar la síntesis global.",
        isQuotaExhausted: true,
      });
    }
    console.error("Error synthesizing global doc (unexpected):", error);
    return res.status(500).json({ error: "Error al generar la síntesis global" });
  }
});

// Explicit 404 for unhandled API routes so they NEVER fall through to HTML SPA
app.all("/api/*", (_req, res) => {
  res.status(404).json({ error: "API_ROUTE_NOT_FOUND", message: "Ruta de API no encontrada" });
});

// Global API error-handling middleware ensuring all API errors return JSON, never HTML
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error("Express global error handler:", err);
  if (isHighDemandUnavailableError(err)) {
    return res.status(503).json({
      error: {
        code: 503,
        message: "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
        status: "UNAVAILABLE",
      },
      retryAfterSeconds: 5,
      isHighDemand: true,
    });
  }
  if (isQuotaExhaustedError(err)) {
    return res.status(429).json({
      error: "QUOTA_EXHAUSTED",
      message: "Se ha alcanzado la cuota de tokens o límite de solicitudes de la IA.",
      isQuotaExhausted: true,
    });
  }
  const status = typeof err?.status === "number" ? err.status : 500;
  return res.status(status).json({
    error: err?.name || "INTERNAL_ERROR",
    message: err?.message || "Error procesando la solicitud en el servidor",
  });
});

// Setup Vite or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`DocuChunk AI server running at http://localhost:${port}`);
  });
}

setupServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
