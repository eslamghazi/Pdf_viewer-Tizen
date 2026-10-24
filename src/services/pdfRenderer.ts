/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as pdfjsLib from 'pdfjs-dist';
import { SearchResult } from '../types/tizen';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  } catch (err) {
    console.warn('PDF.js worker initialization notice:', err);
  }
}

export interface LoadedPdf {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  numPages: number;
  title: string;
}

/**
 * Loads a PDF document from raw binary bytes or URL.
 */
export async function loadPdf(data: Uint8Array | ArrayBuffer | string): Promise<pdfjsLib.PDFDocumentProxy> {
  const loadingTask = typeof data === 'string' 
    ? pdfjsLib.getDocument({ url: data, standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/` })
    : pdfjsLib.getDocument({ data, standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/` });
    
  return await loadingTask.promise;
}

/**
 * Renders a specific page onto an HTML5 Canvas with sharp high-DPI scaling.
 */
export async function renderPageToCanvas(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.0,
  rotation: number = 0
): Promise<{ width: number; height: number }> {
  const page = await pdfDoc.getPage(pageNumber);
  
  // Calculate viewport
  const baseViewport = page.getViewport({ scale, rotation: (page.rotate + rotation) % 360 });
  
  // Accommodate High-DPI screens (Smart TVs, Retina screens, Samsung AMOLED)
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  const ctx = canvas.getContext('2d', { alpha: false });
  
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Adjust canvas pixel dimensions for DPI
  canvas.width = Math.floor(baseViewport.width * dpr);
  canvas.height = Math.floor(baseViewport.height * dpr);

  // Set CSS display dimensions
  canvas.style.width = `${Math.floor(baseViewport.width)}px`;
  canvas.style.height = `${Math.floor(baseViewport.height)}px`;

  // Scale context to match devicePixelRatio
  ctx.save();
  ctx.scale(dpr, dpr);

  // Clear canvas with white background before rendering
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, baseViewport.width, baseViewport.height);

  const renderContext = {
    canvasContext: ctx,
    viewport: baseViewport,
    canvas: canvas,
  };

  await page.render(renderContext).promise;
  ctx.restore();

  return {
    width: baseViewport.width,
    height: baseViewport.height,
  };
}

/**
 * Extracts plain text from a specific PDF page for Text-To-Speech (TTS) and search.
 */
export async function extractPageText(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number
): Promise<string> {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map((item: any) => item.str || '');
    return strings.join(' ').replace(/\s+/g, ' ').trim();
  } catch (err) {
    console.error(`Failed to extract text from page ${pageNumber}:`, err);
    return '';
  }
}

/**
 * Searches across all pages in the PDF document.
 */
export async function searchPdf(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  query: string
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  const normalizedQuery = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const text = await extractPageText(pdfDoc, pageNum);
    const lowerText = text.toLowerCase();
    
    let matchIndex = lowerText.indexOf(normalizedQuery);
    let count = 0;
    while (matchIndex !== -1 && count < 5) {
      const start = Math.max(0, matchIndex - 35);
      const end = Math.min(text.length, matchIndex + normalizedQuery.length + 45);
      const snippet = (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');

      results.push({
        pageNumber: pageNum,
        snippet,
        matchIndex,
      });

      count++;
      matchIndex = lowerText.indexOf(normalizedQuery, matchIndex + normalizedQuery.length);
    }
  }

  return results;
}
