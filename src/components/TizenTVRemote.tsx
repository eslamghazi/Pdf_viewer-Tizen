/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Home,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  X,
  Bookmark,
  Moon,
  Volume2 as SpeechIcon,
  Maximize2,
  Power,
} from 'lucide-react';
import { TIZEN_KEYS } from '../types/tizen';

interface TizenTVRemoteProps {
  isOpen: boolean;
  onClose: () => void;
  onDispatchKey: (keyCode: number, keyName: string, description: string) => void;
  isPlayingTts: boolean;
  nightMode: boolean;
  isFullscreen: boolean;
  lastKeyCode?: number;
  lastKeyName?: string;
}

export const TizenTVRemote: React.FC<TizenTVRemoteProps> = ({
  isOpen,
  onClose,
  onDispatchKey,
  isPlayingTts,
  nightMode,
  isFullscreen,
  lastKeyCode,
  lastKeyName,
}) => {
  if (!isOpen) return null;

  return (
    <aside
      aria-label="Samsung Smart TV Remote Control"
      className="fixed bottom-6 right-6 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 rounded-3xl border border-slate-700/80 shadow-2xl p-4 flex flex-col items-center select-none backdrop-blur-md"
    >
      {/* Remote Top Header */}
      <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-bold tracking-wider text-slate-300">
            SAMSUNG SMART REMOTE
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-full transition-colors"
          title="Minimize remote"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Top Controls: Power & Home */}
      <div className="w-full flex items-center justify-between px-3 py-1 mb-3">
        <button
          onClick={() => onDispatchKey(TIZEN_KEYS.RETURN, 'KEY_POWER', 'Power toggle')}
          className="w-8 h-8 rounded-full bg-rose-950/80 hover:bg-rose-900 border border-rose-600/50 flex items-center justify-center text-rose-400 transition-all active:scale-95 shadow-sm"
          title="TV Power"
        >
          <Power className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onDispatchKey(TIZEN_KEYS.INFO, 'KEY_INFO', 'Document Information')}
          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 border border-slate-700 transition-all active:scale-95"
          title="Document Info (Key 457)"
        >
          123 / INFO
        </button>

        <button
          onClick={() => onDispatchKey(TIZEN_KEYS.EXIT, 'KEY_HOME', 'Smart Hub Home')}
          className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 transition-all active:scale-95 shadow-sm"
          title="Smart Hub (Key 10182)"
        >
          <Home className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Circular D-Pad Wheel */}
      <div className="relative w-44 h-44 rounded-full bg-slate-800/80 border-2 border-slate-700 flex items-center justify-center shadow-inner my-2">
        {/* UP */}
        <button
          onClick={() => onDispatchKey(TIZEN_KEYS.UP, 'KEY_UP', 'Previous Page / Scroll Up')}
          className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-9 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-700/60 rounded-t-full transition-all active:scale-90"
          title="Up Arrow (Key 38)"
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        {/* DOWN */}
        <button
          onClick={() => onDispatchKey(TIZEN_KEYS.DOWN, 'KEY_DOWN', 'Next Page / Scroll Down')}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-9 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-700/60 rounded-b-full transition-all active:scale-90"
          title="Down Arrow (Key 40)"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        {/* LEFT */}
        <button
          onClick={() => onDispatchKey(TIZEN_KEYS.LEFT, 'KEY_LEFT', 'Previous Page')}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-10 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-700/60 rounded-l-full transition-all active:scale-90"
          title="Left Arrow (Key 37)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* RIGHT */}
        <button
          onClick={() => onDispatchKey(TIZEN_KEYS.RIGHT, 'KEY_RIGHT', 'Next Page')}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-10 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-700/60 rounded-r-full transition-all active:scale-90"
          title="Right Arrow (Key 39)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Center OK / ENTER */}
        <button
          onClick={() => onDispatchKey(TIZEN_KEYS.ENTER, 'KEY_ENTER', 'Select / Focus Action')}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center font-bold text-xs tracking-wider text-white hover:text-cyan-300 hover:border-cyan-500/50 shadow-md transition-all active:scale-90"
          title="OK / Enter (Key 13)"
        >
          OK
        </button>
      </div>

      {/* Navigation Row: Return/Back & Play/Pause */}
      <div className="w-full grid grid-cols-2 gap-3 px-3 mt-3 mb-2">
        <button
          onClick={() => onDispatchKey(TIZEN_KEYS.RETURN, 'KEY_RETURN', 'Back / Exit Screen')}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 transition-all active:scale-95"
          title="Return / Back (Key 10009)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>RETURN</span>
        </button>

        <button
          onClick={() =>
            onDispatchKey(
              isPlayingTts ? TIZEN_KEYS.PAUSE : TIZEN_KEYS.PLAY,
              isPlayingTts ? 'KEY_PAUSE' : 'KEY_PLAY',
              'Play/Pause Speech Reader'
            )
          }
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all active:scale-95 ${
            isPlayingTts
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
              : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-300'
          }`}
          title="Play / Pause TTS (Keys 415 / 19)"
        >
          {isPlayingTts ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>PLAY</span>
            </>
          )}
        </button>
      </div>

      {/* Rockers: Zoom (Channel) & Volume */}
      <div className="w-full grid grid-cols-2 gap-3 px-3 my-2">
        {/* Zoom (CH +/-) */}
        <div className="flex flex-col items-center bg-slate-900 border border-slate-800 rounded-xl p-1.5">
          <span className="text-[10px] text-slate-400 font-bold mb-1">CH / ZOOM</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDispatchKey(TIZEN_KEYS.CHANNEL_UP, 'KEY_CH_UP', 'Zoom In (+15%)')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-transform active:scale-90"
              title="Channel Up / Zoom In (Key 427)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDispatchKey(TIZEN_KEYS.CHANNEL_DOWN, 'KEY_CH_DOWN', 'Zoom Out (-15%)')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-transform active:scale-90"
              title="Channel Down / Zoom Out (Key 428)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Volume (VOL +/-) */}
        <div className="flex flex-col items-center bg-slate-900 border border-slate-800 rounded-xl p-1.5">
          <span className="text-[10px] text-slate-400 font-bold mb-1">VOL / SPEED</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDispatchKey(TIZEN_KEYS.COLOR_YELLOW, 'KEY_VOL_UP', 'Faster Speech')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-transform active:scale-90"
              title="Volume / Speed Up"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDispatchKey(TIZEN_KEYS.COLOR_YELLOW, 'KEY_VOL_DOWN', 'Slower Speech')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-transform active:scale-90"
              title="Volume / Speed Down"
            >
              <VolumeX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Samsung Dedicated Color Buttons (A, B, C, D) */}
      <div className="w-full pt-2 border-t border-slate-800">
        <div className="text-[10px] font-semibold tracking-wider text-slate-400 text-center mb-1.5">
          TIZEN COLOR FUNCTION KEYS
        </div>
        <div className="grid grid-cols-4 gap-2 px-1">
          {/* RED (Key 403) */}
          <button
            onClick={() => onDispatchKey(TIZEN_KEYS.COLOR_RED, 'KEY_RED', 'Toggle Bookmarks')}
            className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-600/40 text-red-300 transition-all active:scale-90"
            title="Red Key (403): Bookmarks"
          >
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            <Bookmark className="w-3 h-3" />
            <span className="text-[9px] font-bold">A: Mark</span>
          </button>

          {/* GREEN (Key 404) */}
          <button
            onClick={() => onDispatchKey(TIZEN_KEYS.COLOR_GREEN, 'KEY_GREEN', 'Toggle Night Mode')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all active:scale-90 ${
              nightMode
                ? 'bg-emerald-900/90 border-emerald-400 text-emerald-200'
                : 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-600/40 text-emerald-300'
            }`}
            title="Green Key (404): Night Mode"
          >
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <Moon className="w-3 h-3" />
            <span className="text-[9px] font-bold">B: Night</span>
          </button>

          {/* YELLOW (Key 405) */}
          <button
            onClick={() => onDispatchKey(TIZEN_KEYS.COLOR_YELLOW, 'KEY_YELLOW', 'Text-to-Speech (TTS)')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all active:scale-90 ${
              isPlayingTts
                ? 'bg-amber-900/90 border-amber-400 text-amber-200'
                : 'bg-amber-950/60 hover:bg-amber-900/80 border-amber-600/40 text-amber-300'
            }`}
            title="Yellow Key (405): Text-to-Speech"
          >
            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            <SpeechIcon className="w-3 h-3" />
            <span className="text-[9px] font-bold">C: Read</span>
          </button>

          {/* BLUE (Key 406) */}
          <button
            onClick={() => onDispatchKey(TIZEN_KEYS.COLOR_BLUE, 'KEY_BLUE', 'Fullscreen / Presentation')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all active:scale-90 ${
              isFullscreen
                ? 'bg-blue-900/90 border-blue-400 text-blue-200'
                : 'bg-blue-950/60 hover:bg-blue-900/80 border-blue-600/40 text-blue-300'
            }`}
            title="Blue Key (406): Fullscreen"
          >
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <Maximize2 className="w-3 h-3" />
            <span className="text-[9px] font-bold">D: View</span>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcut Note & Live Intercept */}
      <div className="w-full mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex flex-col gap-1 text-center font-mono">
        <div>Keyboard: Arrow keys / Enter / Backspace / Esc</div>
        {lastKeyCode && (
          <div className="text-cyan-400 font-semibold truncate">
            Dispatched: {lastKeyName} ({lastKeyCode})
          </div>
        )}
      </div>
    </aside>
  );
};
