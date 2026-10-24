/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TizenDeviceMode = 'tv' | 'wearable' | 'tablet';

export type PdfViewMode = 'single' | 'continuous' | 'spread';

export type ColorTheme = 'dark-oled' | 'light-clean' | 'sepia' | 'high-contrast-amber';

export interface DocumentMetadata {
  id: string;
  title: string;
  filename: string;
  totalPages: number;
  author?: string;
  category: string;
  fileSize: string;
  description: string;
  dataUrl?: string;
  rawBytes?: Uint8Array;
}

export interface Bookmark {
  id: string;
  documentId: string;
  pageNumber: number;
  label: string;
  createdAt: number;
}

export interface SearchResult {
  pageNumber: number;
  snippet: string;
  matchIndex: number;
}

export interface TizenKeyEvent {
  keyCode: number;
  keyName: string;
  description: string;
  timestamp: number;
}

// Standard Tizen TV & Wearable Key Codes
export const TIZEN_KEYS = {
  // Navigation
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  ENTER: 13,
  RETURN: 10009, // Tizen Back / Return
  EXIT: 10182,

  // Media & Controls
  PLAY: 415,
  PAUSE: 19,
  PLAY_PAUSE: 10252,
  STOP: 413,
  REWIND: 412,
  FAST_FORWARD: 417,

  // Channels / Zoom
  CHANNEL_UP: 427, // Mapped to Zoom In
  CHANNEL_DOWN: 428, // Mapped to Zoom Out

  // Color Buttons (Samsung Smart TV Remote)
  COLOR_RED: 403, // Function A: Bookmarks
  COLOR_GREEN: 404, // Function B: Night Mode
  COLOR_YELLOW: 405, // Function C: Read Aloud (TTS)
  COLOR_BLUE: 406, // Function D: Presentation / Fullscreen

  // Additional Tizen Smart TV keys
  INFO: 457,
  MENU: 18,
  SEARCH: 10182,
} as const;
