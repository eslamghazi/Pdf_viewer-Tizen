/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Tv, Watch, Monitor, Sliders, Download, Radio } from 'lucide-react';
import { TizenDeviceMode } from '../types/tizen';

interface TizenHeaderProps {
  deviceMode: TizenDeviceMode;
  onDeviceModeChange: (mode: TizenDeviceMode) => void;
  remoteOpen: boolean;
  onToggleRemote: () => void;
  onOpenPackaging: () => void;
  lastKeyCode?: number;
  lastKeyName?: string;
}

export const TizenHeader: React.FC<TizenHeaderProps> = ({
  deviceMode,
  onDeviceModeChange,
  remoteOpen,
  onToggleRemote,
  onOpenPackaging,
  lastKeyCode,
  lastKeyName,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090d16] border-b border-slate-800 text-slate-100 px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-6 max-w-7xl mx-auto">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <img
            src="/src/assets/images/tizen_pdf_icon_1792799395027.jpg"
            alt="Tizen PDF Reader"
            className="w-9 h-9 rounded-lg border border-cyan-500/30 object-cover shadow-sm shadow-cyan-500/20"
          />
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-white whitespace-nowrap">
              Tizen PDF Reader
            </span>
            <span className="text-[11px] text-cyan-400 font-medium tracking-wide">
              Samsung Tizen OS Engine
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links / Device Mode & Remote Affordance */}
        <nav className="flex items-center gap-2 lg:gap-3">
          <div className="bg-slate-900/90 border border-slate-800 p-1 rounded-lg flex items-center gap-1">
            <button
              onClick={() => onDeviceModeChange('tv')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                deviceMode === 'tv'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="10-Foot UI optimized for Samsung Smart TVs and D-Pad remote"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Smart TV (10-Foot UI)</span>
            </button>

            <button
              onClick={() => onDeviceModeChange('wearable')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                deviceMode === 'wearable'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Circular display mode for Galaxy Watch & rotary bezel control"
            >
              <Watch className="w-3.5 h-3.5" />
              <span>Galaxy Watch (Circular)</span>
            </button>

            <button
              onClick={() => onDeviceModeChange('tablet')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap hidden sm:flex ${
                deviceMode === 'tablet'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Touch & dual-page spread layout for Samsung tablets and smart monitors"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Tablet / Monitor</span>
            </button>
          </div>

          {/* Virtual Smart Remote Toggle */}
          <button
            onClick={onToggleRemote}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
              remoteOpen
                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Samsung Remote</span>
            <span className="md:hidden">Remote</span>
          </button>

          {/* Live Keycode Flash (Telemetry indicator) */}
          {lastKeyCode && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-400 tabular-nums">
              <span className="text-slate-500">KEY:</span>
              <span className="font-semibold">{lastKeyName || lastKeyCode}</span>
              <span className="text-slate-600">({lastKeyCode})</span>
            </div>
          )}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenPackaging}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-cyan-400/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Tizen .WGT</span>
          </button>
        </div>
      </div>
    </header>
  );
};
