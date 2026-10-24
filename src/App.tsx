/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { TizenHeader } from './components/TizenHeader';
import { TizenTVRemote } from './components/TizenTVRemote';
import { TizenWearableDial } from './components/TizenWearableDial';
import { PdfViewer } from './components/PdfViewer';
import { TizenPackagingModal } from './components/TizenPackagingModal';
import { TizenDeviceMode, TizenKeyEvent } from './types/tizen';

export default function App() {
  const [deviceMode, setDeviceMode] = useState<TizenDeviceMode>('tv');
  const [remoteOpen, setRemoteOpen] = useState<boolean>(true);
  const [nightMode, setNightMode] = useState<boolean>(true);
  const [packagingOpen, setPackagingOpen] = useState<boolean>(false);
  const [isPlayingTts, setIsPlayingTts] = useState<boolean>(false);
  const [lastKeyEvent, setLastKeyEvent] = useState<TizenKeyEvent | null>(null);

  // Dispatch key event from on-screen Samsung Remote to window
  const handleDispatchRemoteKey = useCallback(
    (keyCode: number, keyName: string, description: string) => {
      setLastKeyEvent({
        keyCode,
        keyName,
        description,
        timestamp: Date.now(),
      });

      // Synthesize KeyboardEvent to activate PDF viewer keybindings
      const event = new KeyboardEvent('keydown', {
        keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);
    },
    []
  );

  // Handle keycode intercepted by PdfViewer
  const handleKeycodeReceived = useCallback(
    (keyCode: number, keyName: string, desc: string) => {
      setLastKeyEvent({
        keyCode,
        keyName,
        description: desc,
        timestamp: Date.now(),
      });
    },
    []
  );

  // Wearable detent callback
  const handleWearableRotaryDetent = useCallback(
    (direction: 'CW' | 'CCW') => {
      const keyCode = direction === 'CW' ? 39 : 37;
      const keyName = direction === 'CW' ? 'ROTARY_CW' : 'ROTARY_CCW';
      setLastKeyEvent({
        keyCode,
        keyName,
        description: `Rotary Bezel detent ${direction}`,
        timestamp: Date.now(),
      });
    },
    []
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#030712] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Tizen Top Bar Header */}
      <TizenHeader
        deviceMode={deviceMode}
        onDeviceModeChange={setDeviceMode}
        remoteOpen={remoteOpen}
        onToggleRemote={() => setRemoteOpen((prev) => !prev)}
        onOpenPackaging={() => setPackagingOpen(true)}
        lastKeyCode={lastKeyEvent?.keyCode}
        lastKeyName={lastKeyEvent?.keyName}
      />

      {/* Main Presentation View */}
      <main className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        {deviceMode === 'wearable' ? (
          <div className="flex-1 flex items-center justify-center overflow-auto p-4 bg-gradient-to-b from-[#060a14] to-[#020408]">
            <TizenWearableDial
              currentPage={1}
              totalPages={6}
              onNextPage={() => handleDispatchRemoteKey(39, 'KEY_RIGHT', 'Next Page')}
              onPrevPage={() => handleDispatchRemoteKey(37, 'KEY_LEFT', 'Previous Page')}
              onRotaryDetent={handleWearableRotaryDetent}
              nightMode={nightMode}
              onToggleNightMode={() => setNightMode(!nightMode)}
            >
              <PdfViewer
                deviceMode="wearable"
                nightMode={nightMode}
                onToggleNightMode={() => setNightMode(!nightMode)}
                onTtsStatusChange={setIsPlayingTts}
                onKeycodeReceived={handleKeycodeReceived}
              />
            </TizenWearableDial>
          </div>
        ) : (
          <PdfViewer
            deviceMode={deviceMode}
            nightMode={nightMode}
            onToggleNightMode={() => setNightMode(!nightMode)}
            onTtsStatusChange={setIsPlayingTts}
            onKeycodeReceived={handleKeycodeReceived}
          />
        )}
      </main>

      {/* Floating Samsung Smart Remote Overlay */}
      {deviceMode === 'tv' && (
        <TizenTVRemote
          isOpen={remoteOpen}
          onClose={() => setRemoteOpen(false)}
          onDispatchKey={handleDispatchRemoteKey}
          isPlayingTts={isPlayingTts}
          nightMode={nightMode}
          isFullscreen={false}
          lastKeyCode={lastKeyEvent?.keyCode}
          lastKeyName={lastKeyEvent?.keyName}
        />
      )}

      {/* Tizen Package & Manifest Generator Studio Modal */}
      <TizenPackagingModal
        isOpen={packagingOpen}
        onClose={() => setPackagingOpen(false)}
        currentDeviceMode={deviceMode}
      />
    </div>
  );
}
