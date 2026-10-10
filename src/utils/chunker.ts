import { DocumentChunk, DocumentMetrics } from '../types';

export function calculateMetrics(text: string, customChunkWords?: number, actualPdfPages?: number): DocumentMetrics {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s+/g, '').length;
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const estimatedPages = Math.max(1, Math.ceil(words / 280));
  const estimatedTokens = Math.ceil(characters / 3.8);

  let recommendedChunkWords = 1500;
  if (words > 50000) recommendedChunkWords = 2500;
  else if (words > 15000) recommendedChunkWords = 1800;
  else if (words < 4000) recommendedChunkWords = 800;

  const effectiveChunkWords = customChunkWords && customChunkWords > 100 ? customChunkWords : recommendedChunkWords;
  const recommendedChunks = Math.max(1, Math.ceil(words / effectiveChunkWords));

  return {
    characters,
    charactersNoSpaces,
    words,
    estimatedPages,
    actualPdfPages,
    estimatedTokens,
    recommendedChunkWords: effectiveChunkWords,
    recommendedChunks,
  };
}

/**
 * Splits text into smart chunks respecting paragraphs and sentences.
 */
export function partitionTextIntoChunks(text: string, targetWordsPerChunk: number): DocumentChunk[] {
  const cleanText = text.trim();
  if (!cleanText) return [];

  // Split into paragraphs first
  const rawParagraphs = cleanText.split(/\n\s*\n/);
  const chunks: DocumentChunk[] = [];

  let currentChunkParagraphs: string[] = [];
  let currentWordCount = 0;

  const finalizeCurrentChunk = () => {
    if (currentChunkParagraphs.length === 0) return;
    const chunkText = currentChunkParagraphs.join('\n\n').trim();
    const wordCount = chunkText.split(/\s+/).length;
    chunks.push({
      id: `chunk-${chunks.length}-${Date.now()}`,
      index: chunks.length,
      text: chunkText,
      wordCount,
      charCount: chunkText.length,
      status: 'pending',
    });
    currentChunkParagraphs = [];
    currentWordCount = 0;
  };

  for (const para of rawParagraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    const paraWords = trimmedPara.split(/\s+/).length;

    // If paragraph itself is larger than 1.5x targetWordsPerChunk, split paragraph by sentences
    if (paraWords > targetWordsPerChunk * 1.3) {
      finalizeCurrentChunk();

      // Split sentences
      const sentences = trimmedPara.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [trimmedPara];
      let subSentences: string[] = [];
      let subWordCount = 0;

      for (const sentence of sentences) {
        const sentenceWords = sentence.trim().split(/\s+/).length;
        if (subWordCount + sentenceWords > targetWordsPerChunk && subSentences.length > 0) {
          const subText = subSentences.join(' ').trim();
          chunks.push({
            id: `chunk-${chunks.length}-${Date.now()}`,
            index: chunks.length,
            text: subText,
            wordCount: subText.split(/\s+/).length,
            charCount: subText.length,
            status: 'pending',
          });
          subSentences = [];
          subWordCount = 0;
        }
        subSentences.push(sentence.trim());
        subWordCount += sentenceWords;
      }

      if (subSentences.length > 0) {
        const subText = subSentences.join(' ').trim();
        chunks.push({
          id: `chunk-${chunks.length}-${Date.now()}`,
          index: chunks.length,
          text: subText,
          wordCount: subText.split(/\s+/).length,
          charCount: subText.length,
          status: 'pending',
        });
      }
      continue;
    }

    // Check if adding this paragraph exceeds target chunk size
    if (currentWordCount + paraWords > targetWordsPerChunk && currentChunkParagraphs.length > 0) {
      finalizeCurrentChunk();
    }

    currentChunkParagraphs.push(trimmedPara);
    currentWordCount += paraWords;
  }

  finalizeCurrentChunk();

  // If no chunks created but text exists, create single chunk
  if (chunks.length === 0 && cleanText) {
    chunks.push({
      id: `chunk-0-${Date.now()}`,
      index: 0,
      text: cleanText,
      wordCount: cleanText.split(/\s+/).length,
      charCount: cleanText.length,
      status: 'pending',
    });
  }

  return chunks;
}
