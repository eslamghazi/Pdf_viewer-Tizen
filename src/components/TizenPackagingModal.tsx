/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Copy, Check, Download, Terminal, Layers, ShieldCheck, MonitorCheck } from 'lucide-react';
import {
  TizenPackageConfig,
  DEFAULT_TIZEN_CONFIG,
  generateTizenConfigXml,
  downloadTizenWgtPackage,
  downloadProjectBundleZip,
} from '../services/tizenPackageGenerator';
import { TizenDeviceMode } from '../types/tizen';

interface TizenPackagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDeviceMode: TizenDeviceMode;
}

export const TizenPackagingModal: React.FC<TizenPackagingModalProps> = ({
  isOpen,
  onClose,
  currentDeviceMode,
}) => {
  const [config, setConfig] = useState<TizenPackageConfig>({
    ...DEFAULT_TIZEN_CONFIG,
    targetDevice: currentDeviceMode,
  });
  const [copied, setCopied] = useState(false);
  const [copiedSdb, setCopiedSdb] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingSource, setIsExportingSource] = useState(false);

  if (!isOpen) return null;

  const xmlContent = generateTizenConfigXml(config);

  const handleCopyXml = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sdbCommands = `# 1. Enable Developer Mode on TV/Watch and connect via SDB:
sdb connect 192.168.1.100:26101
sdb devices

# 2. Install the downloaded WGT package:
tizen install -n ${config.appName.replace(/\s+/g, '')}.wgt

# 3. Launch application on target display:
tizen run -p ${config.appId}

# 4. View live system debug logs:
sdb dlog ${config.appName.replace(/\s+/g, '')}`;

  const handleCopySdb = () => {
    navigator.clipboard.writeText(sdbCommands);
    setCopiedSdb(true);
    setTimeout(() => setCopiedSdb(false), 2000);
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      await downloadTizenWgtPackage(config);
    } catch (err) {
      console.error('Packaging error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSource = async () => {
    setIsExportingSource(true);
    try {
      await downloadProjectBundleZip();
    } catch (err) {
      console.error('Source bundle export error:', err);
    } finally {
      setIsExportingSource(false);
    }
  };

  const togglePrivilege = (priv: string) => {
    if (config.privileges.includes(priv)) {
      setConfig({
        ...config,
        privileges: config.privileges.filter((p) => p !== priv),
      });
    } else {
      setConfig({
        ...config,
        privileges: [...config.privileges, priv],
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Tizen Web App (.WGT) Package Studio
              </h2>
              <p className="text-xs text-slate-400">
                Generate production manifest, security privileges, and deployable widget package
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Architecture & Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Profile</label>
              <select
                value={config.targetDevice}
                onChange={(e) =>
                  setConfig({ ...config, targetDevice: e.target.value as TizenDeviceMode })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="tv">Samsung Smart TV (profile: tv)</option>
                <option value="wearable">Galaxy Watch (profile: wearable)</option>
                <option value="tablet">Smart Signage / Display (profile: tv)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Package App ID</label>
              <input
                type="text"
                value={config.appId}
                onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Version</label>
              <input
                type="text"
                value={config.version}
                onChange={(e) => setConfig({ ...config, version: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Privileges checklist */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Tizen Security Privileges & Permissions</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                {
                  id: 'http://tizen.org/privilege/tv.inputdevice',
                  label: 'tv.inputdevice (Samsung Smart Remote Color/Media keys)',
                },
                {
                  id: 'http://tizen.org/privilege/filesystem.read',
                  label: 'filesystem.read (Local PDF files & USB storage)',
                },
                {
                  id: 'http://tizen.org/privilege/filesystem.write',
                  label: 'filesystem.write (Save bookmarks & annotations)',
                },
                {
                  id: 'http://tizen.org/privilege/display',
                  label: 'display (Keep TV screen active while reading)',
                },
                {
                  id: 'http://tizen.org/privilege/download',
                  label: 'download (Export & cache remote documents)',
                },
              ].map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={config.privileges.includes(item.id)}
                    onChange={() => togglePrivilege(item.id)}
                    className="accent-cyan-400 rounded"
                  />
                  <span className="text-slate-300 font-mono text-[11px]">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* config.xml Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Generated Manifest: <span className="font-mono text-cyan-400">config.xml</span>
              </span>
              <button
                onClick={handleCopyXml}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy XML'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
              {xmlContent}
            </pre>
          </div>

          {/* SDB Terminal Commands Guide */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Deployment Guide (Smart Device Bridge / SDB)</span>
              </div>
              <button
                onClick={handleCopySdb}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {copiedSdb ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSdb ? 'Copied CLI' : 'Copy Commands'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-36 leading-relaxed">
              {sdbCommands}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <MonitorCheck className="w-4 h-4 text-cyan-400" />
            <span>Ready for Tizen Studio, CLI, or SDB direct installation.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownloadSource}
              disabled={isExportingSource}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-cyan-300 bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 rounded-lg transition-all active:scale-95 disabled:opacity-50"
              title="Download entire React + TypeScript project repository (.ZIP)"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isExportingSource ? 'Zipping Project...' : 'Download Full Project (.ZIP)'}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm shadow-cyan-400/20 transition-all active:scale-95 disabled:opacity-50"
              title="Download installable Tizen package (.WGT)"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating .WGT...' : 'Download .WGT Package'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
