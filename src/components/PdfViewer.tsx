/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Upload,
  BookOpen,
  Columns,
  Maximize,
  Moon,
  Sun,
  FileText,
  List,
  Sparkles,
  ArrowUp,
  ArrowDown,
  X,
  Trash2,
} from 'lucide-react';
import {
  DocumentMetadata,
  TizenDeviceMode,
  PdfViewMode,
  ColorTheme,
  Bookmark as BookmarkItem,
  SearchResult,
  TIZEN_KEYS,
} from '../types/tizen';
import { SAMPLE_DOCUMENTS } from '../services/sampleDocuments';
import { loadPdf, renderPageToCanvas, extractPageText, searchPdf } from '../services/pdfRenderer';

interface PdfViewerProps {
  deviceMode: TizenDeviceMode;
  nightMode: boolean;
  onToggleNightMode: () => void;
  onTtsStatusChange: (isPlaying: boolean) => void;
  onKeycodeReceived: (keyCode: number, keyName: string, desc: string) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  deviceMode,
  nightMode,
  onToggleNightMode,
  onTtsStatusChange,
  onKeycodeReceived,
}) => {
  // Document state
  const [documents, setDocuments] = useState<DocumentMetadata[]>(SAMPLE_DOCUMENTS);
  const [activeDocIndex, setActiveDocIndex] = useState<number>(0);
  const [pdfProxy, setPdfProxy] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(true);

  // View & display settings
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [viewMode, setViewMode] = useState<PdfViewMode>('single');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('dark-oled');

  // Search state
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0);

  // Bookmarks state
  const [bookmarksOpen, setBookmarksOpen] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [bookmarkLabel, setBookmarkLabel] = useState<string>('');

  // Audio / Speech (TTS) state
  const [isPlayingTts, setIsPlayingTts] = useState<boolean>(false);
  const [ttsRate, setTtsRate] = useState<number>(1.0);
  const [currentSpeechText, setCurrentSpeechText] = useState<string>('');
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Canvas refs
  const primaryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const secondaryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeDoc = documents[activeDocIndex];

  // Load Bookmarks from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tizen_bookmarks_${activeDoc?.id}`);
      if (saved) {
        setBookmarks(JSON.parse(saved));
      } else {
        setBookmarks([]);
      }
    } catch (e) {
      console.warn('LocalStorage bookmarks error:', e);
    }
  }, [activeDoc?.id]);

  // Sync NightMode prop with internal colorTheme
  useEffect(() => {
    if (nightMode && colorTheme === 'light-clean') {
      setColorTheme('dark-oled');
    } else if (!nightMode && colorTheme === 'dark-oled') {
      setColorTheme('light-clean');
    }
  }, [nightMode]);

  // Load PDF document when active document changes
  useEffect(() => {
    let isCancelled = false;

    async function loadActiveDocument() {
      if (!activeDoc) return;
      setIsLoadingDoc(true);
      stopTts();

      try {
        let proxy: PDFDocumentProxy;
        if (activeDoc.rawBytes) {
          proxy = await loadPdf(activeDoc.rawBytes);
        } else if (activeDoc.dataUrl) {
          proxy = await loadPdf(activeDoc.dataUrl);
        } else {
          throw new Error('No PDF data available');
        }

        if (!isCancelled) {
          setPdfProxy(proxy);
          setTotalPages(proxy.numPages);
          setCurrentPage(1);
          setIsLoadingDoc(false);
        }
      } catch (err) {
        console.error('Failed to load PDF document:', err);
        if (!isCancelled) {
          setIsLoadingDoc(false);
        }
      }
    }

    loadActiveDocument();

    return () => {
      isCancelled = true;
    };
  }, [activeDocIndex, activeDoc]);

  // Render current page(s) to Canvas
  const renderCurrentPages = useCallback(async () => {
    if (!pdfProxy || isLoadingDoc) return;

    // Render Primary Canvas
    if (primaryCanvasRef.current) {
      try {
        await renderPageToCanvas(
          pdfProxy,
          currentPage,
          primaryCanvasRef.current,
          zoomLevel,
          rotation
        );
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    }

    // Render Secondary Canvas for Two-Page Spread mode
    if (viewMode === 'spread' && secondaryCanvasRef.current && currentPage + 1 <= totalPages) {
      try {
        await renderPageToCanvas(
          pdfProxy,
          currentPage + 1,
          secondaryCanvasRef.current,
          zoomLevel,
          rotation
        );
      } catch (err) {
        console.error('Error rendering secondary page:', err);
      }
    }
  }, [pdfProxy, currentPage, zoomLevel, rotation, viewMode, totalPages, isLoadingDoc]);

  useEffect(() => {
    renderCurrentPages();
  }, [renderCurrentPages]);

  // Navigation handlers
  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => {
      const step = viewMode === 'spread' ? 2 : 1;
      return Math.min(totalPages, prev + step);
    });
  }, [totalPages, viewMode]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => {
      const step = viewMode === 'spread' ? 2 : 1;
      return Math.max(1, prev - step);
    });
  }, [viewMode]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(2.5, Number((prev + 0.15).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(0.5, Number((prev - 0.15).toFixed(2))));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Text-To-Speech (TTS) Engine
  const stopTts = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingTts(false);
    onTtsStatusChange(false);
  }, [onTtsStatusChange]);

  const startTts = useCallback(async () => {
    if (!pdfProxy || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    stopTts();
    const text = await extractPageText(pdfProxy, currentPage);
    if (!text) return;

    setCurrentSpeechText(text);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = ttsRate;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsPlayingTts(false);
      onTtsStatusChange(false);
      // Auto-advance to next page if speech completes
      if (currentPage < totalPages) {
        handleNextPage();
      }
    };

    utterance.onerror = () => {
      setIsPlayingTts(false);
      onTtsStatusChange(false);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlayingTts(true);
    onTtsStatusChange(true);
  }, [pdfProxy, currentPage, totalPages, ttsRate, stopTts, handleNextPage, onTtsStatusChange]);

  const toggleTts = useCallback(() => {
    if (isPlayingTts) {
      stopTts();
    } else {
      startTts();
    }
  }, [isPlayingTts, stopTts, startTts]);

  // Bookmarking Handlers
  const handleToggleBookmark = useCallback(() => {
    if (!activeDoc) return;
    const existingIndex = bookmarks.findIndex((b) => b.pageNumber === currentPage);

    let updated: BookmarkItem[];
    if (existingIndex >= 0) {
      updated = bookmarks.filter((b) => b.pageNumber !== currentPage);
    } else {
      const newBookmark: BookmarkItem = {
        id: `bm_${Date.now()}`,
        documentId: activeDoc.id,
        pageNumber: currentPage,
        label: bookmarkLabel.trim() || `Bookmark Page ${currentPage}`,
        createdAt: Date.now(),
      };
      updated = [...bookmarks, newBookmark].sort((a, b) => a.pageNumber - b.pageNumber);
    }

    setBookmarks(updated);
    setBookmarkLabel('');
    try {
      localStorage.setItem(`tizen_bookmarks_${activeDoc.id}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [activeDoc, bookmarks, currentPage, bookmarkLabel]);

  const handleRemoveBookmark = (id: string) => {
    if (!activeDoc) return;
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    try {
      localStorage.setItem(`tizen_bookmarks_${activeDoc.id}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  };

  // Search Engine
  const handleExecuteSearch = async () => {
    if (!pdfProxy || !searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchPdf(pdfProxy, searchQuery);
      setSearchResults(results);
      setSelectedResultIndex(0);
      if (results.length > 0) {
        setCurrentPage(results[0].pageNumber);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Fullscreen / Presentation Mode
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn('Fullscreen failed:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Exit fullscreen failed:', err);
      });
    }
  };

  // Handle User File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        const customDoc: DocumentMetadata = {
          id: `custom_${Date.now()}`,
          title: file.name.replace(/\.pdf$/i, ''),
          filename: file.name,
          totalPages: 1,
          author: 'Uploaded Document',
          category: 'User Custom PDF',
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          description: 'Custom user document loaded via Tizen file reader interface.',
          rawBytes: new Uint8Array(buffer),
        };

        setDocuments((prev) => [customDoc, ...prev]);
        setActiveDocIndex(0);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Global Keyboard / Tizen Remote Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in search input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      switch (e.keyCode || e.which) {
        // Up Arrow
        case TIZEN_KEYS.UP:
        case 38:
          e.preventDefault();
          handlePrevPage();
          onKeycodeReceived(38, 'KEY_UP', 'Previous Page / Scroll Up');
          break;

        // Down Arrow
        case TIZEN_KEYS.DOWN:
        case 40:
          e.preventDefault();
          handleNextPage();
          onKeycodeReceived(40, 'KEY_DOWN', 'Next Page / Scroll Down');
          break;

        // Left Arrow
        case TIZEN_KEYS.LEFT:
        case 37:
          e.preventDefault();
          handlePrevPage();
          onKeycodeReceived(37, 'KEY_LEFT', 'Previous Page');
          break;

        // Right Arrow
        case TIZEN_KEYS.RIGHT:
        case 39:
          e.preventDefault();
          handleNextPage();
          onKeycodeReceived(39, 'KEY_RIGHT', 'Next Page');
          break;

        // Enter / OK
        case TIZEN_KEYS.ENTER:
        case 13:
          e.preventDefault();
          onKeycodeReceived(13, 'KEY_ENTER', 'Select / Confirm');
          break;

        // Tizen Return / Back (10009) or Backspace/Escape
        case TIZEN_KEYS.RETURN:
        case 27:
        case 8:
          e.preventDefault();
          if (searchOpen) setSearchOpen(false);
          if (bookmarksOpen) setBookmarksOpen(false);
          onKeycodeReceived(10009, 'KEY_RETURN', 'Close Modal / Back');
          break;

        // Channel Up (Zoom In)
        case TIZEN_KEYS.CHANNEL_UP:
          e.preventDefault();
          handleZoomIn();
          onKeycodeReceived(427, 'KEY_CH_UP', 'Zoom In');
          break;

        // Channel Down (Zoom Out)
        case TIZEN_KEYS.CHANNEL_DOWN:
          e.preventDefault();
          handleZoomOut();
          onKeycodeReceived(428, 'KEY_CH_DOWN', 'Zoom Out');
          break;

        // Media Play / Pause
        case TIZEN_KEYS.PLAY:
        case TIZEN_KEYS.PAUSE:
        case TIZEN_KEYS.PLAY_PAUSE:
          e.preventDefault();
          toggleTts();
          onKeycodeReceived(415, 'KEY_PLAY_PAUSE', 'TTS Play/Pause');
          break;

        // Color Red (403 or key 'r' / '1'): Bookmarks
        case TIZEN_KEYS.COLOR_RED:
        case 82: // 'r'
        case 49: // '1'
          e.preventDefault();
          setBookmarksOpen((prev) => !prev);
          onKeycodeReceived(403, 'KEY_RED', 'Toggle Bookmarks');
          break;

        // Color Green (404 or key 'g' / '2'): Night Mode
        case TIZEN_KEYS.COLOR_GREEN:
        case 71: // 'g'
        case 50: // '2'
          e.preventDefault();
          onToggleNightMode();
          onKeycodeReceived(404, 'KEY_GREEN', 'Toggle Night Mode');
          break;

        // Color Yellow (405 or key 'y' / '3'): TTS Read Aloud
        case TIZEN_KEYS.COLOR_YELLOW:
        case 89: // 'y'
        case 51: // '3'
          e.preventDefault();
          toggleTts();
          onKeycodeReceived(405, 'KEY_YELLOW', 'Read Aloud (TTS)');
          break;

        // Color Blue (406 or key 'b' / '4'): Fullscreen
        case TIZEN_KEYS.COLOR_BLUE:
        case 66: // 'b'
        case 52: // '4'
          e.preventDefault();
          handleToggleFullscreen();
          onKeycodeReceived(406, 'KEY_BLUE', 'Fullscreen');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleNextPage,
    handlePrevPage,
    handleZoomIn,
    handleZoomOut,
    toggleTts,
    onToggleNightMode,
    searchOpen,
    bookmarksOpen,
    onKeycodeReceived,
  ]);

  // CSS Filter classes for reading themes
  const getThemeFilter = () => {
    switch (colorTheme) {
      case 'dark-oled':
        return 'invert(90%) hue-rotate(180deg) contrast(110%) brightness(95%)';
      case 'sepia':
        return 'sepia(45%) contrast(95%) brightness(95%)';
      case 'high-contrast-amber':
        return 'invert(100%) sepia(100%) saturate(300%) hue-rotate(10deg)';
      case 'light-clean':
      default:
        return 'none';
    }
  };

  const isCurrentPageBookmarked = bookmarks.some((b) => b.pageNumber === currentPage);

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex flex-col min-h-0 relative select-none ${
        colorTheme === 'dark-oled' ? 'bg-[#030712] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Document Ribbon Selector Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Library:
          </span>
          <div className="flex items-center gap-1.5">
            {documents.map((doc, idx) => (
              <button
                key={doc.id}
                onClick={() => setActiveDocIndex(idx)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-all whitespace-nowrap truncate max-w-[200px] md:max-w-xs ${
                  idx === activeDocIndex
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/60 border border-slate-800'
                }`}
                title={doc.title}
              >
                {doc.title}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Custom PDF Button */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-xs font-medium text-slate-200 cursor-pointer transition-colors shadow-sm">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open PDF File</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Reader Secondary Toolbar: Controls, Zoom, Views, Search */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Page Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-md bg-slate-800/90 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
            title="Previous Page (Key Left / Key Up)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300 px-2 py-1 bg-slate-900 rounded border border-slate-800 tabular-nums">
            <span>Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  setCurrentPage(val);
                }
              }}
              className="w-10 bg-slate-950 border border-slate-700 text-center rounded text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
            />
            <span className="text-slate-500">of</span>
            <span>{totalPages}</span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-md bg-slate-800/90 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
            title="Next Page (Key Right / Key Down)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Zoom & Layout Affordances */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md p-1">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 transition-colors"
              title="Zoom Out (Remote CH Down)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-2 text-cyan-400 font-semibold tabular-nums min-w-[50px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 transition-colors"
              title="Zoom In (Remote CH Up)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleRotate}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-slate-300 transition-colors"
            title="Rotate 90 Degrees"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md p-1">
            <button
              onClick={() => setViewMode('single')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'single'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Single Page Mode"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('spread')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'spread'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Two-Page Spread (TV 16:9 Widescreen)"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Color Themes, Search, Bookmarks, TTS */}
        <div className="flex items-center gap-2">
          {/* Theme Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md p-1">
            <button
              onClick={() => {
                setColorTheme('dark-oled');
                if (!nightMode) onToggleNightMode();
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                colorTheme === 'dark-oled' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
              }`}
              title="OLED Pure Black"
            >
              OLED
            </button>
            <button
              onClick={() => {
                setColorTheme('light-clean');
                if (nightMode) onToggleNightMode();
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                colorTheme === 'light-clean' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
              }`}
              title="Paper Light"
            >
              Light
            </button>
            <button
              onClick={() => setColorTheme('sepia')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                colorTheme === 'sepia' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
              }`}
              title="Sepia Warm"
            >
              Sepia
            </button>
          </div>

          {/* Bookmarks Toggle (Color Red / Key 403) */}
          <button
            onClick={() => setBookmarksOpen(!bookmarksOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              bookmarksOpen || isCurrentPageBookmarked
                ? 'bg-red-950/60 border-red-600/50 text-red-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
            title="Bookmarks Panel [Red Key / 403]"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isCurrentPageBookmarked ? 'fill-current' : ''}`} />
            <span className="hidden md:inline">Bookmarks</span>
          </button>

          {/* Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className={`p-1.5 rounded-md border transition-colors ${
              searchOpen
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
            title="Search In Document"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Text-to-Speech (Yellow Key / 405) */}
          <button
            onClick={toggleTts}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              isPlayingTts
                ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
            title="Read Aloud with Voice (Yellow Key / 405)"
          >
            {isPlayingTts ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isPlayingTts ? 'Stop Voice' : 'Read Aloud'}</span>
          </button>

          {/* Fullscreen (Blue Key / 406) */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-slate-300 transition-colors"
            title="Toggle Fullscreen [Blue Key / 406]"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Workspace Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 lg:p-8 relative min-h-[450px]">
        {/* Loading Spinner */}
        {isLoadingDoc ? (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Parsing Tizen Document Vector Stream...</span>
          </div>
        ) : (
          <div
            className={`flex items-center justify-center gap-6 transition-all duration-300 ${
              deviceMode === 'wearable' ? 'scale-90' : ''
            }`}
            style={{ filter: getThemeFilter() }}
          >
            {/* Primary Document Page Canvas */}
            <div className="relative shadow-2xl rounded-sm border border-slate-700/60 bg-white overflow-hidden">
              <canvas ref={primaryCanvasRef} className="block max-w-full h-auto" />
              {/* Spatial Navigation Focus Ring (TV 10-foot mode) */}
              {deviceMode === 'tv' && (
                <div className="absolute inset-0 border-2 border-cyan-400/40 pointer-events-none rounded-sm" />
              )}
            </div>

            {/* Secondary Page Canvas (for Two-Page Spread on 16:9 TV) */}
            {viewMode === 'spread' && currentPage + 1 <= totalPages && (
              <div className="relative shadow-2xl rounded-sm border border-slate-700/60 bg-white overflow-hidden hidden md:block">
                <canvas ref={secondaryCanvasRef} className="block max-w-full h-auto" />
              </div>
            )}
          </div>
        )}

        {/* Live TTS Voice Playback Status Card */}
        {isPlayingTts && (
          <div className="absolute bottom-4 left-6 z-30 max-w-md bg-slate-950/95 border border-amber-500/50 rounded-xl p-3 shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-amber-300 flex items-center justify-between">
                <span>Reading Page {currentPage} Aloud</span>
                <span className="font-mono text-slate-400">{ttsRate}x Speed</span>
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                {currentSpeechText.slice(0, 80)}...
              </p>
            </div>
            <button
              onClick={stopTts}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bookmarks Drawer Overlay */}
        {bookmarksOpen && (
          <div className="absolute top-4 right-4 z-30 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col text-slate-200 backdrop-blur-md">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Document Bookmarks
                </span>
              </div>
              <button
                onClick={() => setBookmarksOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Add Bookmark for Current Page */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex flex-col gap-2">
              <div className="text-[11px] text-slate-400">
                Current Position: <span className="text-cyan-400 font-bold">Page {currentPage}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Label (optional)..."
                  value={bookmarkLabel}
                  onChange={(e) => setBookmarkLabel(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                />
                <button
                  onClick={handleToggleBookmark}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    isCurrentPageBookmarked
                      ? 'bg-rose-900/60 border border-rose-600/50 text-rose-300'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {isCurrentPageBookmarked ? 'Remove' : 'Bookmark'}
                </button>
              </div>
            </div>

            {/* Bookmarks List */}
            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {bookmarks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No bookmarks yet. Press the Red Remote button (403) to bookmark this page!
                </div>
              ) : (
                bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                      bm.pageNumber === currentPage
                        ? 'bg-red-950/40 border border-red-600/40 text-red-200'
                        : 'bg-slate-950/40 hover:bg-slate-800 text-slate-300 border border-transparent'
                    }`}
                    onClick={() => setCurrentPage(bm.pageNumber)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Bookmark className="w-3.5 h-3.5 text-red-400 shrink-0 fill-current" />
                      <div className="truncate">
                        <span className="text-xs font-medium block truncate">{bm.label}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Page {bm.pageNumber}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBookmark(bm.id);
                      }}
                      className="p-1 hover:text-rose-400 text-slate-500 transition-colors"
                      title="Delete bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Search Overlay Drawer */}
        {searchOpen && (
          <div className="absolute top-4 left-4 z-30 w-84 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col text-slate-200 backdrop-blur-md">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                In-Document Search
              </span>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
              <input
                type="text"
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleExecuteSearch();
                }}
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleExecuteSearch}
                disabled={isSearching}
                className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-xs transition-colors"
              >
                {isSearching ? '...' : 'Find'}
              </button>
            </div>

            {/* Results Count & List */}
            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {searchResults.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  {searchQuery ? 'No occurrences found.' : 'Enter text and press Find.'}
                </div>
              ) : (
                searchResults.map((res, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedResultIndex(i);
                      setCurrentPage(res.pageNumber);
                    }}
                    className={`p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                      i === selectedResultIndex
                        ? 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-200'
                        : 'bg-slate-950/40 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 mb-1">
                      <span>Match #{i + 1}</span>
                      <span>Page {res.pageNumber}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{res.snippet}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tizen 10-Foot Spatial Footer Navigation Bar */}
      <footer className="bg-slate-950 border-t border-slate-800/80 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300">{activeDoc.title}</span>
          <span>·</span>
          <span>{activeDoc.fileSize}</span>
          <span>·</span>
          <span>{activeDoc.category}</span>
        </div>

        {/* Remote Shortcuts Legend for TV UI */}
        <div className="hidden lg:flex items-center gap-3 font-mono text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> [A] Bookmarks
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> [B] Night
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> [C] Voice
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> [D] Fullscreen
          </span>
          <span className="text-slate-500">|</span>
          <span>[CH +/-] Zoom</span>
          <span>[D-Pad] Turn Page</span>
        </div>
      </footer>
    </div>
  );
};
