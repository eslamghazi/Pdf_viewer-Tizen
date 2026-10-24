/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, RotateCcw, Eye, EyeOff, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface TizenWearableDialProps {
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  onRotaryDetent: (direction: 'CW' | 'CCW') => void;
  children: React.ReactNode;
  nightMode: boolean;
  onToggleNightMode: () => void;
}

export const TizenWearableDial: React.FC<TizenWearableDialProps> = ({
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
  onRotaryDetent,
  children,
  nightMode,
  onToggleNightMode,
}) => {
  const [ambientMode, setAmbientMode] = useState(false);
  const [bezelAngle, setBezelAngle] = useState(0);
  const dialRef = useRef<HTMLDivElement>(null);

  // Handle physical mouse wheel over the dial as rotary detents
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      triggerDetent('CW');
    } else if (e.deltaY < 0) {
      triggerDetent('CCW');
    }
  };

  const triggerDetent = (direction: 'CW' | 'CCW') => {
    const delta = direction === 'CW' ? 18 : -18;
    setBezelAngle((prev) => (prev + delta) % 360);
    onRotaryDetent(direction);
    if (direction === 'CW') {
      onNextPage();
    } else {
      onPrevPage();
    }

    // Dispatch real Tizen rotarydetent CustomEvent to document
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('rotarydetent', { detail: { direction } });
      document.dispatchEvent(event);
    }
  };

  // Calculate circular progress percentage for outer ring
  const progressPercent = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
  const radius = 194;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Wearable Dial Container */}
      <div
        ref={dialRef}
        onWheel={handleWheel}
        className={`relative w-[380px] h-[380px] sm:w-[440px] sm:h-[440px] rounded-full p-3 flex items-center justify-center transition-colors duration-300 select-none ${
          ambientMode ? 'bg-black shadow-none' : 'bg-gradient-to-br from-slate-900 via-slate-950 to-black shadow-2xl shadow-cyan-950/40 border-4 border-slate-800'
        }`}
      >
        {/* Outer Circular SVG Progress Arc */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 440 440">
          {/* Background Track */}
          <circle
            cx="220"
            cy="220"
            r={radius}
            fill="none"
            stroke="rgba(30, 41, 59, 0.6)"
            strokeWidth="4"
          />
          {/* Active Progress Track */}
          <circle
            cx="220"
            cy="220"
            r={radius}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300"
          />
        </svg>

        {/* Rotary Bezel Rim Ticks */}
        <div
          className="absolute inset-2 rounded-full border border-slate-700/50 pointer-events-none transition-transform duration-150"
          style={{ transform: `rotate(${bezelAngle}deg)` }}
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-2 bg-slate-600 left-1/2 -translate-x-1/2 top-1 origin-[50%_206px]"
              style={{ transform: `rotate(${i * 15}deg)` }}
            />
          ))}
        </div>

        {/* Top Arc Curved Status Header */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1 bg-slate-950/80 rounded-full border border-slate-800 text-[11px] font-mono tracking-widest text-cyan-400">
          <span>PAGE {currentPage} / {totalPages}</span>
        </div>

        {/* Inner AMOLED Circular Display Screen */}
        <div
          className={`relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] rounded-full overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner ${
            ambientMode ? 'opacity-40 grayscale contrast-125 bg-black' : nightMode ? 'bg-[#000000]' : 'bg-slate-900'
          }`}
        >
          {/* Scrollable / Rendered PDF Content Area */}
          <div className="w-full h-full overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start p-2 scrollbar-none">
            {children}
          </div>
        </div>

        {/* Bottom Arc Controls: Bezel Navigation Touch Targets */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          <button
            onClick={() => triggerDetent('CCW')}
            className="flex items-center gap-1 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-300 text-xs font-semibold shadow-md active:scale-95 transition-transform"
            title="Rotate Bezel Left / Previous (CCW)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Prev</span>
          </button>

          <button
            onClick={() => setAmbientMode(!ambientMode)}
            className={`p-1.5 rounded-full border text-xs shadow-md active:scale-95 transition-all ${
              ambientMode
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle Ambient / Always-on Display (AOD)"
          >
            {ambientMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => triggerDetent('CW')}
            className="flex items-center gap-1 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-300 text-xs font-semibold shadow-md active:scale-95 transition-transform"
            title="Rotate Bezel Right / Next (CW)"
          >
            <span>Next</span>
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Wearable Usage Helper */}
      <div className="mt-4 text-center text-xs text-slate-400 flex flex-col gap-1">
        <p className="font-medium text-slate-300">
          Galaxy Watch Rotary Bezel Simulator
        </p>
        <p className="text-[11px] text-slate-500">
          Rotate mouse wheel or click <span className="text-cyan-400">Prev / Next</span> to trigger Tizen <span className="font-mono text-cyan-400">rotarydetent</span> events.
        </p>
      </div>
    </div>
  );
};
