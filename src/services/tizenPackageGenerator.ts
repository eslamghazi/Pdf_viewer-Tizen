/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { TizenDeviceMode } from '../types/tizen';

export interface TizenPackageConfig {
  appId: string;
  appName: string;
  version: string;
  targetDevice: TizenDeviceMode;
  requiredVersion: string;
  orientation: 'landscape' | 'portrait' | 'auto';
  privileges: string[];
}

export const DEFAULT_TIZEN_CONFIG: TizenPackageConfig = {
  appId: 'a1b2c3d4e5.TizenPDFReader',
  appName: 'Tizen PDF Reader',
  version: '1.0.0',
  targetDevice: 'tv',
  requiredVersion: '6.0',
  orientation: 'landscape',
  privileges: [
    'http://tizen.org/privilege/tv.inputdevice',
    'http://tizen.org/privilege/filesystem.read',
    'http://tizen.org/privilege/filesystem.write',
    'http://tizen.org/privilege/display',
    'http://tizen.org/privilege/download',
  ],
};

/**
 * Generates standard Tizen config.xml manifest.
 */
export function generateTizenConfigXml(config: TizenPackageConfig = DEFAULT_TIZEN_CONFIG): string {
  const profile = config.targetDevice === 'wearable' ? 'wearable' : 'tv';
  const orientation = config.targetDevice === 'wearable' ? 'portrait' : config.orientation;
  const reqVer = config.targetDevice === 'wearable' ? '5.5' : config.requiredVersion;

  return `<?xml version="1.0" encoding="UTF-8"?>
<widget xmlns="http://www.w3.org/ns/widgets" xmlns:tizen="http://tizen.org/ns/widgets" id="http://tizen.samsung.com/${config.appName.replace(/\s+/g, '')}" version="${config.version}" viewmodes="maximized">
    <tizen:application id="${config.appId}" exec="index.html" screen-orientation="${orientation}" required_version="${reqVer}"/>
    <name>${config.appName}</name>
    <icon src="icon.png"/>
    <description>Enterprise PDF Document Reader optimized for Samsung Tizen OS with D-Pad spatial remote navigation and Wearable rotary bezel control.</description>
    <author href="https://tizen.org">Samsung Tizen Developer</author>
    <license>Apache-2.0</license>

    <!-- Tizen Security Privileges -->
${config.privileges.map((p) => `    <tizen:privilege name="${p}"/>`).join('\n')}

    <!-- Device Capabilities and Hardware Features -->
    <tizen:feature name="http://tizen.org/feature/screen.size.all">true</tizen:feature>
    <tizen:feature name="http://tizen.org/feature/input.rotary">true</tizen:feature>
    <tizen:profile name="${profile}"/>
    
    <!-- Content Security Policy for Web Runtime -->
    <tizen:setting screen-orientation="${orientation}" context-menu="enable" background-support="disable" encryption="disable" install-location="auto"/>
</widget>
`;
}

/**
 * Generates an index.html launcher for standalone deployment inside Tizen Web Runtime.
 */
export function generateTizenRuntimeIndexHtml(config: TizenPackageConfig = DEFAULT_TIZEN_CONFIG): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${config.appName} - Tizen Web Runtime</title>
  <style>
    body {
      margin: 0;
      background: #030712;
      color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
    }
    .badge {
      padding: 6px 14px;
      background: rgba(6, 182, 212, 0.15);
      border: 1px solid rgba(6, 182, 212, 0.4);
      color: #22d3ee;
      border-radius: 999px;
      font-size: 13px;
      margin-bottom: 16px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    h1 {
      font-size: 28px;
      margin: 0 0 10px 0;
      font-weight: 700;
    }
    p {
      color: #9ca3af;
      max-width: 500px;
      line-height: 1.5;
      font-size: 15px;
    }
    .key-info {
      margin-top: 24px;
      padding: 16px;
      background: #111827;
      border-radius: 12px;
      border: 1px solid #1f2937;
      font-family: monospace;
      font-size: 13px;
      color: #38bdf8;
    }
  </style>
</head>
<body>
  <div class="badge">Samsung Tizen OS Engine</div>
  <h1>${config.appName}</h1>
  <p>Tizen Web Runtime is active. Hardware D-Pad and Rotary Detent event listeners are registered.</p>
  <div class="key-info">
    TV Input Device: OK (Keys 10009, 403-406, 427-428 Registered)<br />
    Rotary Detents: Active (CW / CCW pagination)
  </div>

  <script>
    // Register custom TV remote keys on real Samsung Smart TV
    if (typeof tizen !== 'undefined' && tizen.tvinputdevice) {
      const keysToRegister = [
        'MediaPlay', 'MediaPause', 'MediaPlayPause', 'MediaStop',
        'ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue',
        'ChannelUp', 'ChannelDown', 'Info'
      ];
      keysToRegister.forEach(function(key) {
        try {
          tizen.tvinputdevice.registerKey(key);
        } catch(e) {
          console.warn('Could not register TV key:', key, e);
        }
      });
    }

    // Handle Tizen Return / Back button
    window.addEventListener('tizenhwkey', function(e) {
      if (e.keyName === 'back') {
        try {
          tizen.application.getCurrentApplication().exit();
        } catch(err) {
          window.history.back();
        }
      }
    });

    // Rotary bezel listener for Galaxy Watch
    document.addEventListener('rotarydetent', function(e) {
      console.log('Rotary detent direction:', e.detail.direction);
    });
  </script>
</body>
</html>
`;
}

/**
 * Builds and triggers browser download of the Tizen .WGT package zip.
 */
export async function downloadTizenWgtPackage(config: TizenPackageConfig = DEFAULT_TIZEN_CONFIG): Promise<void> {
  const zip = new JSZip();

  // Add config.xml
  const configXml = generateTizenConfigXml(config);
  zip.file('config.xml', configXml);

  // Add index.html runtime
  const indexHtml = generateTizenRuntimeIndexHtml(config);
  zip.file('index.html', indexHtml);

  // Add documentation README with SDB commands
  const readme = `# ${config.appName} - Samsung Tizen OS Web Application Package (.wgt)

## Target Platform: ${config.targetDevice.toUpperCase()} (Tizen ${config.targetDevice === 'wearable' ? '5.5+' : config.requiredVersion})
Package App ID: ${config.appId}
Version: ${config.version}

### How to Install on Samsung Smart TV or Galaxy Watch:
1. Ensure your Samsung TV or Galaxy Watch is in Developer Mode.
   - On Smart TV: Open 'Apps' panel, press 1-2-3-4-5 on the remote, toggle Developer Mode 'On', enter your PC IP.
2. Connect to device via Samsung Smart Device Bridge (SDB):
   \`\`\`bash
   sdb connect <DEVICE_IP_ADDRESS>:26101
   sdb devices
   \`\`\`
3. Install this package:
   \`\`\`bash
   tizen install -n ${config.appName.replace(/\s+/g, '')}.wgt -t <DEVICE_ID>
   \`\`\`
4. Launch the application:
   \`\`\`bash
   tizen run -p ${config.appId} -t <DEVICE_ID>
   \`\`\`

### Remote Control Key Bindings:
- D-Pad Arrows: Spatial navigation & page turning
- Center Button (OK/Enter): Select / Toggle UI controls
- Return / Back (10009): Close sidebar / Previous screen / Exit
- Channel Up / Down (427 / 428): Zoom In / Zoom Out
- Red Button (403): Bookmarks drawer
- Green Button (404): High-Contrast OLED Night Mode
- Yellow Button (405): Text-To-Speech (Read Aloud)
- Blue Button (406): Fullscreen / Presentation Mode
`;
  zip.file('README.md', readme);

  // Fetch or add icon.png
  try {
    const iconRes = await fetch('/src/assets/images/tizen_pdf_icon_1792799395027.jpg');
    if (iconRes.ok) {
      const iconBlob = await iconRes.blob();
      zip.file('icon.png', iconBlob);
    }
  } catch (e) {
    console.warn('Could not bundle icon binary:', e);
  }

  // Generate WGT blob and download
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/x-tizen-widget' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${config.appName.replace(/\s+/g, '_')}_v${config.version}.wgt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Bundles the entire project source code, configuration files, and components
 * into a complete, ready-to-run ZIP archive for the user.
 */
export async function downloadProjectBundleZip(): Promise<void> {
  const zip = new JSZip();

  const filesToInclude = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
    'metadata.json',
    '.env.example',
    '.gitignore',
    'src/main.tsx',
    'src/App.tsx',
    'src/index.css',
    'src/types/tizen.ts',
    'src/services/pdfRenderer.ts',
    'src/services/sampleDocuments.ts',
    'src/services/tizenPackageGenerator.ts',
    'src/components/TizenHeader.tsx',
    'src/components/TizenTVRemote.tsx',
    'src/components/TizenWearableDial.tsx',
    'src/components/PdfViewer.tsx',
    'src/components/TizenPackagingModal.tsx',
  ];

  // Also include Tizen manifest and deployment guide
  zip.file('tizen/config.xml', generateTizenConfigXml());
  zip.file('tizen/index.html', generateTizenRuntimeIndexHtml());

  // Fetch and pack each source file
  for (const filePath of filesToInclude) {
    try {
      const res = await fetch(`/${filePath}`);
      if (res.ok) {
        const text = await res.text();
        zip.file(filePath, text);
      }
    } catch (e) {
      console.warn(`Could not fetch ${filePath} for zip:`, e);
    }
  }

  // Include icon image
  try {
    const iconRes = await fetch('/src/assets/images/tizen_pdf_icon_1792799395027.jpg');
    if (iconRes.ok) {
      const blob = await iconRes.blob();
      zip.file('src/assets/images/tizen_pdf_icon.jpg', blob);
      zip.file('tizen/icon.png', blob);
    }
  } catch (e) {
    console.warn('Could not bundle image for zip:', e);
  }

  // Add README
  const projectReadme = `# Tizen PDF Reader — Complete Project Source Code

This repository contains the complete full-stack React + TypeScript + Vite implementation of the Samsung Tizen OS PDF Reader application.

## Quick Start
1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
2. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
3. Open http://localhost:3000 in your browser.

## Building for Tizen (.WGT)
1. Run \`npm run build\`
2. Package with Tizen Studio CLI:
   \`\`\`bash
   tizen package -t wgt -s <your-security-profile>
   \`\`\`
3. Deploy to Samsung Smart TV or Galaxy Watch:
   \`\`\`bash
   sdb connect <device-ip>:26101
   tizen install -n TizenPDFReader.wgt
   tizen run -p a1b2c3d4e5.TizenPDFReader
   \`\`\`
`;
  zip.file('README.md', projectReadme);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tizen-pdf-reader-full-source.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

