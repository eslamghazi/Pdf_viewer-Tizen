/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocumentMetadata } from '../types/tizen';

/**
 * Generates a valid multi-page PDF 1.4 binary array in pure TypeScript.
 * This guarantees that pdfjs-dist can load, parse, render, and extract text
 * from built-in manuals without relying on external network requests!
 */
export function generateValidPdfBytes(
  title: string,
  pagesContent: { header: string; sections: { title: string; lines: string[] }[] }[]
): Uint8Array {
  const objects: string[] = [];
  const objOffsets: number[] = [];

  // Helper to add an indirect object and return its object number (1-based)
  function addObject(content: string): number {
    const objNum = objects.length + 1;
    objects.push(`${objNum} 0 obj\n${content}\nendobj\n`);
    return objNum;
  }

  // Escape special PDF characters
  function sanitizePdfText(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  // Pre-allocate Catalog (obj 1) and Font (obj 2)
  // We will build Pages object and Page objects dynamically
  const fontObjNum = 2;

  const pageObjNums: number[] = [];

  // Generate content streams and Page objects
  for (let i = 0; i < pagesContent.length; i++) {
    const pageData = pagesContent[i];
    const pageNum = i + 1;

    // Build PDF content stream
    let streamOps = 'q\n';
    
    // Header decorative bar
    streamOps += '0.08 0.12 0.20 rg\n';
    streamOps += '0 750 595 92 re f\n';

    // Accent line (Cyan/Samsung Blue)
    streamOps += '0.0 0.65 0.95 rg\n';
    streamOps += '0 746 595 4 re f\n';

    // Header Title
    streamOps += 'BT\n';
    streamOps += '/F1 18 Tf\n';
    streamOps += '1 1 1 rg\n';
    streamOps += `40 790 Td (${sanitizePdfText(title)}) Tj\n`;

    // Subtitle / Page indicator
    streamOps += '/F1 10 Tf\n';
    streamOps += '0.7 0.8 0.9 rg\n';
    streamOps += `40 765 Td (${sanitizePdfText(pageData.header)}  |  Page ${pageNum} of ${pagesContent.length}) Tj\n`;
    streamOps += 'ET\n';

    // Content body
    let currentY = 700;

    for (const section of pageData.sections) {
      if (currentY < 120) break;

      // Section title
      streamOps += 'BT\n';
      streamOps += '/F1 13 Tf\n';
      streamOps += '0.05 0.45 0.75 rg\n';
      streamOps += `40 ${currentY} Td (${sanitizePdfText(section.title)}) Tj\n`;
      streamOps += 'ET\n';
      currentY -= 20;

      // Section lines
      streamOps += 'BT\n';
      streamOps += '/F1 9.5 Tf\n';
      streamOps += '0.2 0.25 0.3 rg\n';

      for (const line of section.lines) {
        if (currentY < 90) break;
        streamOps += `40 ${currentY} Td (${sanitizePdfText(line)}) Tj\n`;
        currentY -= 15;
      }
      streamOps += 'ET\n';
      currentY -= 12; // Gap between sections
    }

    // Footer divider and text
    streamOps += '0.85 0.88 0.92 rg\n';
    streamOps += '40 55 515 1 re f\n';

    streamOps += 'BT\n';
    streamOps += '/F1 8.5 Tf\n';
    streamOps += '0.5 0.55 0.6 rg\n';
    streamOps += `40 38 Td (Tizen OS Enterprise Document Engine  *  Samsung Electronics Specification) Tj\n`;
    streamOps += `480 38 Td (Page ${pageNum} of ${pagesContent.length}) Tj\n`;
    streamOps += 'ET\n';
    streamOps += 'Q\n';

    // Create stream object
    const streamLen = streamOps.length;
    const streamContent = `<< /Length ${streamLen} >>\nstream\n${streamOps}\nendstream`;
    const streamObjNum = addObject(streamContent);

    // Page object will be registered later once we know the pages root obj
    pageObjNums.push(streamObjNum);
  }

  // Create Font object (Obj 2)
  const fontContent = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  // Insert font as object 2 if not yet present
  // Let's create an ordered list of all objects
  const finalObjects: string[] = [];
  
  // Object 1: Catalog
  // Object 2: Font
  // Object 3: Pages
  // Object 4..N: Content streams and Page objects
  
  const catalogObjNum = 1;
  const pagesObjNum = 3;

  const actualPageObjs: number[] = [];

  let nextObjNum = 4;
  const contentStreamObjs: number[] = [];
  for (let i = 0; i < pagesContent.length; i++) {
    contentStreamObjs.push(nextObjNum++);
    actualPageObjs.push(nextObjNum++);
  }

  // Object 1: Catalog
  finalObjects[0] = `1 0 obj\n<< /Type /Catalog /Pages ${pagesObjNum} 0 R >>\nendobj\n`;

  // Object 2: Font
  finalObjects[1] = `2 0 obj\n${fontContent}\nendobj\n`;

  // Object 3: Pages
  const kidsStr = actualPageObjs.map((num) => `${num} 0 R`).join(' ');
  finalObjects[2] = `3 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${actualPageObjs.length} >>\nendobj\n`;

  // Generate each Page and its Stream
  let objIndex = 3;
  for (let i = 0; i < pagesContent.length; i++) {
    const streamObjId = contentStreamObjs[i];
    const pageObjId = actualPageObjs[i];
    const pageData = pagesContent[i];
    const pageNum = i + 1;

    // Content stream text
    let streamOps = 'q\n';
    // Header decorative bar
    streamOps += '0.08 0.12 0.20 rg\n';
    streamOps += '0 750 595 92 re f\n';
    // Accent line (Cyan/Samsung Blue)
    streamOps += '0.0 0.65 0.95 rg\n';
    streamOps += '0 746 595 4 re f\n';

    // Header Title
    streamOps += 'BT\n/F1 18 Tf\n1 1 1 rg\n';
    streamOps += `40 785 Td (${sanitizePdfText(title)}) Tj\nET\n`;

    // Subtitle / Page indicator
    streamOps += 'BT\n/F1 10 Tf\n0.7 0.85 0.95 rg\n';
    streamOps += `40 762 Td (${sanitizePdfText(pageData.header)}  *  Document Page ${pageNum} of ${pagesContent.length}) Tj\nET\n`;

    let currentY = 705;
    for (const section of pageData.sections) {
      if (currentY < 120) break;

      streamOps += 'BT\n/F1 12.5 Tf\n0.05 0.42 0.72 rg\n';
      streamOps += `40 ${currentY} Td (${sanitizePdfText(section.title)}) Tj\nET\n`;
      currentY -= 18;

      streamOps += 'BT\n/F1 9 Tf\n0.2 0.22 0.26 rg\n';
      for (const line of section.lines) {
        if (currentY < 80) break;
        streamOps += `40 ${currentY} Td (${sanitizePdfText(line)}) Tj\n`;
        currentY -= 14;
      }
      streamOps += 'ET\n';
      currentY -= 10;
    }

    // Footer divider and text
    streamOps += '0.85 0.88 0.92 rg\n';
    streamOps += '40 50 515 1 re f\n';
    streamOps += 'BT\n/F1 8.5 Tf\n0.5 0.55 0.6 rg\n';
    streamOps += `40 35 Td (Samsung Tizen OS Engine  *  Official Developer Reference) Tj\n`;
    streamOps += `480 35 Td (Page ${pageNum} / ${pagesContent.length}) Tj\nET\n`;
    streamOps += 'Q\n';

    // Add Stream Object
    finalObjects[objIndex++] = `${streamObjId} 0 obj\n<< /Length ${streamOps.length} >>\nstream\n${streamOps}\nendstream\nendobj\n`;

    // Add Page Object
    finalObjects[objIndex++] = `${pageObjId} 0 obj\n<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 595 842] /Contents ${streamObjId} 0 R /Resources << /Font << /F1 2 0 R >> >> >>\nendobj\n`;
  }

  // Construct final PDF binary string
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets: number[] = [];

  for (let i = 0; i < finalObjects.length; i++) {
    offsets.push(pdf.length);
    pdf += finalObjects[i];
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${finalObjects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${finalObjects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  // Convert to Uint8Array
  const uint8 = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) {
    uint8[i] = pdf.charCodeAt(i) & 0xff;
  }
  return uint8;
}

export const SAMPLE_DOCUMENTS: DocumentMetadata[] = [
  {
    id: 'tizen-tv-guide',
    title: 'Samsung Tizen Smart TV OS - PDF Reader & Navigation Manual',
    filename: 'Tizen_Smart_TV_Master_Guide.pdf',
    totalPages: 6,
    author: 'Samsung Electronics Visual Display Division',
    category: 'Smart TV / 10-Foot UI',
    fileSize: '42.8 KB',
    description: 'Complete user & developer manual for D-Pad spatial navigation, Tizen Remote keycodes, 4K rendering, and TV inputs.',
    rawBytes: generateValidPdfBytes('Samsung Tizen Smart TV OS - Manual', [
      {
        header: 'Chapter 1: 10-Foot Spatial UI & Remote Architecture',
        sections: [
          {
            title: '1.1 Spatial D-Pad Navigation Philosophy',
            lines: [
              'The 10-foot user experience requires comfortable navigation from a 3-meter living room distance.',
              'All interactive PDF controls must provide immediate visual focus rings and snap between elements.',
              'Arrow keys (Up, Down, Left, Right) navigate across pages, bookmarks, and control toolbars without requiring a mouse pointer.',
              'The Center OK/Enter button executes actions or toggles between page inspection and thumbnail browser.',
            ],
          },
          {
            title: '1.2 Samsung Smart Remote Physical Key Mappings',
            lines: [
              'Key 10009 (KEY_RETURN): Triggers instant backward navigation or closes open modals and sidebars.',
              'Key 427 / 428 (CHANNEL_UP / CHANNEL_DOWN): Dedicated zoom in (+15%) and zoom out (-15%) commands.',
              'Key 415 / 19 (MEDIA_PLAY / MEDIA_PAUSE): Controls Text-To-Speech (TTS) continuous reading.',
              'Key 10252 (MEDIA_PLAY_PAUSE): Toggles active presentation slideshow playback mode.',
            ],
          },
          {
            title: '1.3 Four Dedicated Color Quick-Action Keys',
            lines: [
              'RED KEY (Keycode 403): Instant Bookmarks drawer open/close and page bookmarking.',
              'GREEN KEY (Keycode 404): High-Contrast OLED Night Mode toggle for low-light living rooms.',
              'YELLOW KEY (Keycode 405): Text-to-Speech audio reader with page text extraction.',
              'BLUE KEY (Keycode 406): Fullscreen / Presentation Mode with clean borderless canvas.',
            ],
          },
        ],
      },
      {
        header: 'Chapter 2: TV Input Device Registration & Tizen Web Runtime',
        sections: [
          {
            title: '2.1 Registering Custom Keys via Tizen TV Input Device API',
            lines: [
              'By default, Tizen OS intercepts Media and Color keys unless registered by the web application.',
              'Code pattern: tizen.tvinputdevice.registerKey("MediaPlay"); tizen.tvinputdevice.registerKey("ColorF0Red");',
              'This application auto-registers all color keys and media buttons upon initialization.',
              'When running inside standard web browsers, synthetic fallback key listeners intercept KeyboardEvent keys.',
            ],
          },
          {
            title: '2.2 Ultra-Sharp 4K UHD Canvas Rendering',
            lines: [
              'Samsung Smart TVs feature 3840x2160 native panel resolutions.',
              'This PDF engine detects window.devicePixelRatio (2.0x to 3.0x on 4K/8K displays) to avoid blurry text.',
              'Canvas backbuffers are allocated at exact hardware backing scale with CSS downsampling.',
              'Vector text and embedded font glyphs remain laser-sharp even at 300% magnification.',
            ],
          },
          {
            title: '2.3 Two-Page Spread & Fit-to-Height Optimization',
            lines: [
              'Widescreen 16:9 displays excel at Two-Page Spread view mode, displaying facing pages side-by-side.',
              'Fit-to-Height mode eliminates vertical scrolling during document reviews and presentation decks.',
              'Seamless page caching pre-renders neighboring pages for instant stutter-free turning.',
            ],
          },
        ],
      },
      {
        header: 'Chapter 3: Night Mode & Display Health Standards',
        sections: [
          {
            title: '3.1 OLED Black & Low-Blue-Light Color Profiles',
            lines: [
              'Tizen OLED screens feature self-lit pixels that consume near-zero power when rendering pure blacks (#000000).',
              'The Dark OLED theme turns page backgrounds to deep obsidian while preserving crisp inverted typography.',
              'Sepia Warm mode filters harsh blue spectral peaks for comfortable evening reading.',
              'Amber High-Contrast mode provides WCAG AAA contrast for users with low vision.',
            ],
          },
          {
            title: '3.2 Audio & Speech Synthesis (TTS)',
            lines: [
              'The built-in Web Speech API reads PDF page contents through TV soundbars or eARC receiver systems.',
              'Controls include rate adjustment (0.8x to 1.5x) and automatic page advance when speech finishes.',
              'Highlighting synchronizes with active speech paragraphs for effortless following.',
            ],
          },
        ],
      },
      {
        header: 'Chapter 4: Local Storage & Bookmarking Architecture',
        sections: [
          {
            title: '4.1 Persistent Bookmarks & Last-Read Position',
            lines: [
              'Document reading progress is automatically saved to Tizen local storage under doc-progress keys.',
              'When returning to any document, the reader instantly restores the exact page and zoom level.',
              'Users can tag specific pages with custom labels using the Red button or on-screen bookmark dialog.',
              'Exportable bookmarks allow synchronizing reading lists across Samsung family displays.',
            ],
          },
          {
            title: '4.2 Search Engine with Real-Time Highlighting',
            lines: [
              'In-document search extracts text streams across all document pages asynchronously.',
              'Results display live snippet previews, matching page indices, and instant jump targets.',
              'TV D-Pad allows cycling through matching search results with Left/Right remote buttons.',
            ],
          },
        ],
      },
      {
        header: 'Chapter 5: Samsung Smart Hub Integration',
        sections: [
          {
            title: '5.1 Preview Tiles & Recent Documents',
            lines: [
              'Tizen Smart Hub preview tiles can surface recently read PDF files directly on the TV home ribbon.',
              'Deep linking support: launching app with query parameter ?doc=tizen-tv-guide opens target page immediately.',
              'Supports multi-user profiles for family members reading different documents.',
            ],
          },
          {
            title: '5.2 USB Drive & DLNA Network Storage Support',
            lines: [
              'Tizen filesystem privileges allow reading PDF documents from connected USB flash drives.',
              'Supports drag-and-drop on PC simulator and direct file picker on TV web browsers.',
            ],
          },
        ],
      },
      {
        header: 'Chapter 6: Troubleshooting & Diagnostics',
        sections: [
          {
            title: '6.1 Remote Control Response Diagnostics',
            lines: [
              'If remote keys do not respond, verify that focus is not trapped in an external iFrame.',
              'Use the on-screen Virtual Samsung Smart Remote to verify key dispatch and active event monitoring.',
              'Ensure Tizen privilege "http://tizen.org/privilege/tv.inputdevice" is declared in config.xml.',
            ],
          },
          {
            title: '6.2 Performance Optimization Tips',
            lines: [
              'Keep continuous scroll pages within reasonable cache boundaries (3 visible pages).',
              'Use Fit-to-Width mode on 55-inch and 65-inch panels for standard A4 letter document aspect ratios.',
              'Enjoy reading with Samsung Tizen OS!',
            ],
          },
        ],
      },
    ]),
  },
  {
    id: 'galaxy-watch-guide',
    title: 'Samsung Galaxy Watch - Circular OS & Rotary Detent Whitepaper',
    filename: 'Galaxy_Watch_Rotary_OS.pdf',
    totalPages: 5,
    author: 'Samsung Electronics Mobile eXperience (MX)',
    category: 'Wearable / Circular UI',
    fileSize: '36.2 KB',
    description: 'Wearable PDF rendering guidelines, rotary bezel detent mechanics, circular viewport clipping, and battery saving.',
    rawBytes: generateValidPdfBytes('Galaxy Watch Circular OS Guide', [
      {
        header: 'Chapter 1: Circular Display Ergonomics',
        sections: [
          {
            title: '1.1 Circular Viewport Geometry (360x360 & 450x450)',
            lines: [
              'Galaxy Watch screens are perfect circles with no physical corners.',
              'Content at the top and bottom edges must account for circular cut-offs using curved headers.',
              'The central 70% of the display is the primary legible reading zone.',
              'Tap-to-zoom enables panning through multi-column PDF layouts comfortably on a 1.4-inch AMOLED dial.',
            ],
          },
          {
            title: '1.2 Physical & Virtual Rotary Bezel Detents',
            lines: [
              'The rotating physical bezel on Galaxy Watch Classic produces tactile haptic clicks called detents.',
              'Web Runtime dispatches the custom "rotarydetent" DOM event to window and document.',
              'Event payload: event.detail.direction === "CW" (Clockwise) advances to next page or scrolls down.',
              'Event payload: event.detail.direction === "CCW" (Counter-Clockwise) returns to previous page or scrolls up.',
            ],
          },
        ],
      },
      {
        header: 'Chapter 2: Wearable PDF Reading Flow',
        sections: [
          {
            title: '2.1 Smart Paging & Edge Indicators',
            lines: [
              'A circular radial progress indicator follows the outer circumference of the watch face.',
              'Displays current page ratio (e.g. 240 degrees for Page 4 of 6).',
              'Quick swipe left/right transitions between pages with momentum physics.',
              'Double-tap zooms into dense chart regions and resets back to full page overview.',
            ],
          },
          {
            title: '2.2 Ambient Always-On Display (AOD) Mode',
            lines: [
              'When the user lowers their wrist, Tizen transitions the screen to low-power Ambient AOD mode.',
              'Color luminance drops under 15% on-pixel ratio to preserve battery during prolonged reading sessions.',
              'High-contrast inverted black backgrounds maximize power savings on AMOLED panels.',
            ],
          },
        ],
      },
      {
        header: 'Chapter 3: Rotary Detent Web API Code Patterns',
        sections: [
          {
            title: '3.1 JavaScript Rotary Event Handler',
            lines: [
              'document.addEventListener("rotarydetent", function(ev) {',
              '  if (ev.detail.direction === "CW") { pdfViewer.nextPage(); }',
              '  else if (ev.detail.direction === "CCW") { pdfViewer.prevPage(); }',
              '});',
              'On desktop or touch screens, mouse wheel and touch bezel ring drag simulate rotary detents.',
            ],
          },
          {
            title: '3.2 Tactile Vibration Feedback',
            lines: [
              'When navigator.vibrate is available, a 15ms haptic pulse accompanies each page turn detent.',
              'Provides satisfying mechanical feel matching physical book pagination.',
            ],
          },
        ],
      },
      {
        header: 'Chapter 4: Offline Document Storage on Wearables',
        sections: [
          {
            title: '4.1 Standalone Reading Without Phone Tethering',
            lines: [
              'Important flight boarding passes, conference tickets, and cheat sheets can be cached locally.',
              'IndexedDB and localStorage store document binary buffers for 100% offline access during flights.',
              'Bluetooth auto-sync transfers documents directly from Galaxy smartphones via Samsung Wearable app.',
            ],
          },
          {
            title: '4.2 Audio Read-Out via Galaxy Buds',
            lines: [
              'Connect Bluetooth earbuds directly to watch for private audio reading while running or commuting.',
            ],
          },
        ],
      },
      {
        header: 'Chapter 5: Packaging for Galaxy Store',
        sections: [
          {
            title: '5.1 Tizen Wearable Feature Requirements',
            lines: [
              'Specify feature: http://tizen.org/feature/screen.size.all and input.rotary in config.xml.',
              'Target Tizen Wearable profile 5.5 or higher for maximum compatibility across Galaxy Watch models.',
            ],
          },
        ],
      },
    ]),
  },
  {
    id: 'tizen-wgt-packaging-guide',
    title: 'Tizen Web Application Architecture & Packaging Specification (.WGT)',
    filename: 'Tizen_Web_App_Dev_Specification.pdf',
    totalPages: 5,
    author: 'Tizen Technical Steering Group (TSG)',
    category: 'Developer / WGT Packaging',
    fileSize: '39.4 KB',
    description: 'Technical specification for Tizen .wgt widget packages, config.xml elements, security privileges, and SDB deployment.',
    rawBytes: generateValidPdfBytes('Tizen Web App Packaging Specification', [
      {
        header: 'Chapter 1: Widget Archive (.WGT) Structure',
        sections: [
          {
            title: '1.1 W3C Widget Packaging Standards',
            lines: [
              'A Tizen Web application is distributed as a ZIP archive with the .wgt file extension.',
              'Root directory MUST contain config.xml (the application manifest) and icon.png.',
              'Entry point HTML file is defined in the exec attribute of <tizen:application>.',
              'All JavaScript, CSS, images, and fonts are self-contained for offline execution on Tizen devices.',
            ],
          },
          {
            title: '1.2 Directory Layout of a Production .WGT',
            lines: [
              'Archive Root:',
              '  - config.xml          [Tizen Application Manifest & Permissions]',
              '  - icon.png            [117x117 for TV / 128x128 for Wearable]',
              '  - index.html          [Application entry point]',
              '  - assets/             [Bundled PDF documents, fonts, stylesheets]',
              '  - author-signature.xml [Optional developer cryptographic signature]',
            ],
          },
        ],
      },
      {
        header: 'Chapter 2: Config.xml Manifest Schema',
        sections: [
          {
            title: '2.1 Essential XML Elements and Namespaces',
            lines: [
              '<widget xmlns="http://www.w3.org/ns/widgets" xmlns:tizen="http://tizen.org/ns/widgets"',
              '  id="http://yourdomain/TizenPDFReader" version="1.0.0" viewmodes="maximized">',
              '  <tizen:application id="a1b2c3d4e5.TizenPDFReader" exec="index.html" screen-orientation="landscape"/>',
              '  <name>Tizen PDF Reader</name>',
              '  <icon src="icon.png"/>',
              '</widget>',
            ],
          },
          {
            title: '2.2 Declaring Security Privileges',
            lines: [
              'http://tizen.org/privilege/filesystem.read : Read local PDF files and storage',
              'http://tizen.org/privilege/tv.inputdevice : Intercept Samsung Smart Remote color and media keys',
              'http://tizen.org/privilege/display : Prevent TV screen saver during reading sessions',
              'http://tizen.org/privilege/download : Save exported notes and signed documents',
            ],
          },
        ],
      },
      {
        header: 'Chapter 3: Tizen Smart Device Bridge (SDB) Commands',
        sections: [
          {
            title: '3.1 Connecting to a Samsung Smart TV over Wi-Fi',
            lines: [
              'Step 1: Enable Developer Mode in TV Apps panel by typing 1-2-3-4-5 on the remote.',
              'Step 2: Enter host development machine IP address in the Developer dialog.',
              'Step 3: Connect via SDB command line: sdb connect <tv-ip-address>:26101',
              'Step 4: Verify connection status: sdb devices',
            ],
          },
          {
            title: '3.2 Installing and Launching the .WGT Package',
            lines: [
              'Install package: tizen install -n TizenPDFReader_v1.0.0.wgt -t <device-id>',
              'Launch application: tizen run -p a1b2c3d4e5.TizenPDFReader -t <device-id>',
              'View live debug logs: sdb dlog TizenPDFReader',
              'Uninstall package: tizen uninstall -p a1b2c3d4e5.TizenPDFReader',
            ],
          },
        ],
      },
      {
        header: 'Chapter 4: Web Runtime Performance Tuning',
        sections: [
          {
            title: '4.1 Hardware Accelerated Canvas Rendering',
            lines: [
              'Tizen Chromium-based Web Runtime leverages Mali / Adreno GPUs for canvas 2D contexts.',
              'Using CSS transforms for zooming avoids costly full-canvas re-renders during animations.',
              'Double-buffered rendering eliminates tearing during rapid page turning.',
            ],
          },
        ],
      },
      {
        header: 'Chapter 5: Distribution & Samsung Smart TV App Store',
        sections: [
          {
            title: '5.1 Samsung Apps TV Seller Office Certification',
            lines: [
              'Register at seller.samsungapps.com and submit the signed .wgt package.',
              'Pass functional verification including remote key handling and return key exit conformance.',
              'Deploy to millions of Samsung Smart TVs worldwide.',
            ],
          },
        ],
      },
    ]),
  },
];
