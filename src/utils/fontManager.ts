import { CustomFontItem } from '../types';
import {
  saveCustomFontToDb,
  loadCustomFontsFromDb,
  deleteCustomFontFromDb,
} from './indexedDbStorage';
import { formatFileSize } from './fileHelpers';

// Built-in standard fonts
export interface StandardFont {
  name: string;
  family: string;
  category: 'sans' | 'serif' | 'mono' | 'display';
}

export const STANDARD_FONTS: StandardFont[] = [
  { name: 'Modern Sans (Inter)', family: 'Inter, system-ui, sans-serif', category: 'sans' },
  { name: 'Calibri', family: 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif', category: 'sans' },
  { name: 'Arial', family: 'Arial, Helvetica, sans-serif', category: 'sans' },
  { name: 'Helvetica', family: '"Helvetica Neue", Helvetica, Arial, sans-serif', category: 'sans' },
  { name: 'Segoe UI', family: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', category: 'sans' },
  { name: 'Trebuchet MS', family: '"Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", sans-serif', category: 'sans' },
  { name: 'Verdana', family: 'Verdana, Geneva, sans-serif', category: 'sans' },
  { name: 'Times New Roman', family: '"Times New Roman", Times, Georgia, serif', category: 'serif' },
  { name: 'Georgia', family: 'Georgia, Cambria, serif', category: 'serif' },
  { name: 'Garamond', family: 'Garamond, Baskerville, "Baskerville Old Face", serif', category: 'serif' },
  { name: 'Courier New', family: '"Courier New", Courier, monospace', category: 'mono' },
];

// Curated 1-click popular web fonts
export interface CuratedWebFont {
  name: string;
  category: string;
  description: string;
  googleFontsUrl: string;
  sample: string;
}

export const CURATED_WEB_FONTS: CuratedWebFont[] = [
  {
    name: 'Playfair Display',
    category: 'Serif Luxury',
    description: 'High-contrast editorial serif ideal for titles & certificates',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap',
    sample: 'Executive Master Summary & Legal Review',
  },
  {
    name: 'Poppins',
    category: 'Geometric Sans',
    description: 'Crisp, contemporary geometric sans for decks & modern documents',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap',
    sample: 'Next-Gen Analytics & Financial Projections',
  },
  {
    name: 'Montserrat',
    category: 'Clean Sans',
    description: 'Urban modernist signage font with superb weight clarity',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap',
    sample: 'STRATEGIC ENTERPRISE PERFORMANCE 2026',
  },
  {
    name: 'Fira Code',
    category: 'Developer Monospace',
    description: 'Monospace font crafted with programming ligatures & clean grids',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=swap',
    sample: 'const formula = SUM(A1:D14) * 1.18;',
  },
  {
    name: 'Dancing Script',
    category: 'Cursive / Script',
    description: 'Lively cursive handwriting font for invitations & signatures',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&display=swap',
    sample: 'Authorized Executive Signature & Endorsement',
  },
  {
    name: 'Oswald',
    category: 'Condensed Sans',
    description: 'Condensed gothic typeface for high-impact presentation slides',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap',
    sample: 'Q4 REVENUE SURGE: 142% TARGET ACHIEVED',
  },
  {
    name: 'Cinzel',
    category: 'Classic Roman',
    description: 'Inspired by first century Roman inscriptions with imperial elegance',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&display=swap',
    sample: 'MEMORANDUM OF UNDERSTANDING',
  },
  {
    name: 'Caveat',
    category: 'Casual Handwritten',
    description: 'Warm, personal notes and collaborative markup annotations',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap',
    sample: 'Great job on this section! Please verify revenue numbers.',
  },
  {
    name: 'Lora',
    category: 'Calligraphic Serif',
    description: 'Well-balanced contemporary serif with roots in calligraphy',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&display=swap',
    sample: 'The fundamental law of commerce is mutual benefit.',
  },
  {
    name: 'Bebas Neue',
    category: 'Display Headline',
    description: 'Tall, bold capital typography for pitch decks and posters',
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
    sample: 'ANNUAL SHAREHOLDER GENERAL ASSEMBLY',
  },
];

// In-memory registry of active custom fonts
const loadedFontsMap = new Map<string, CustomFontItem>();

/**
 * Register and inject a font dynamically into the document.
 */
export async function applyFontToDocument(font: CustomFontItem): Promise<boolean> {
  try {
    // 1. If font is loaded from URL (Google Fonts or external CSS)
    if (font.source === 'url' && font.url) {
      const linkId = `custom-font-link-${font.id}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = font.url;
        document.head.appendChild(link);
      }
      loadedFontsMap.set(font.id, font);
      return true;
    }

    // 2. If font is loaded from an uploaded File (ArrayBuffer or data URL)
    if (font.source === 'file' && font.fontDataBuffer) {
      // Use native FontFace API if supported
      if (typeof window !== 'undefined' && 'FontFace' in window) {
        try {
          const fontFace = new FontFace(font.name, font.fontDataBuffer as ArrayBuffer);
          const loadedFace = await fontFace.load();
          document.fonts.add(loadedFace);
          loadedFontsMap.set(font.id, font);
          return true;
        } catch (fontErr) {
          console.warn('FontFace buffer load warning, creating blob stylesheet fallback:', fontErr);
        }
      }

      // Fallback: Blob URL + @font-face style element
      const blob = new Blob([font.fontDataBuffer as ArrayBuffer], {
        type:
          font.format === 'woff2'
            ? 'font/woff2'
            : font.format === 'woff'
            ? 'font/woff'
            : font.format === 'opentype'
            ? 'font/otf'
            : 'font/ttf',
      });
      const blobUrl = URL.createObjectURL(blob);
      const styleId = `custom-font-style-${font.id}`;
      let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = `
        @font-face {
          font-family: "${font.name}";
          src: url("${blobUrl}") format("${font.format || 'truetype'}");
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
      loadedFontsMap.set(font.id, font);
      return true;
    }

    return false;
  } catch (err) {
    console.error(`Failed to apply font ${font.name}:`, err);
    return false;
  }
}

/**
 * Load all installed fonts from IndexedDB on startup and register them in document.
 */
export async function initializeInstalledFonts(): Promise<CustomFontItem[]> {
  try {
    const fonts = await loadCustomFontsFromDb();
    for (const font of fonts) {
      await applyFontToDocument(font);
    }
    return fonts;
  } catch (err) {
    console.warn('Could not initialize installed fonts:', err);
    return [];
  }
}

/**
 * Install a custom font from a web URL (e.g. Google Fonts or direct css/woff2) and persist to IndexedDB.
 */
export async function installFontFromUrl(
  urlInput: string,
  customName?: string
): Promise<CustomFontItem> {
  const trimmedUrl = urlInput.trim();
  if (!trimmedUrl) {
    throw new Error('Please enter a valid font URL');
  }

  let finalUrl = trimmedUrl;
  let fontName = customName?.trim() || '';

  // Handle Google Fonts specimen link, e.g. "https://fonts.google.com/specimen/Poppins"
  if (finalUrl.includes('fonts.google.com/specimen/')) {
    const familySlug = finalUrl.split('fonts.google.com/specimen/')[1]?.split('?')[0]?.replace(/\+/g, ' ');
    if (!fontName && familySlug) {
      fontName = decodeURIComponent(familySlug);
    }
    finalUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(familySlug).replace(/%20/g, '+')}:wght@300;400;500;600;700&display=swap`;
  }

  // Handle Google Fonts css2 URL, extract family name if not specified
  if (!fontName && finalUrl.includes('family=')) {
    const match = finalUrl.match(/family=([^&:]+)/);
    if (match && match[1]) {
      fontName = decodeURIComponent(match[1].replace(/\+/g, ' '));
    }
  }

  if (!fontName) {
    fontName = 'Custom Web Font';
  }

  const newFont: CustomFontItem = {
    id: `font-url-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: fontName,
    source: 'url',
    url: finalUrl,
    format: 'css',
    createdAt: Date.now(),
    fileSize: 'Web Hosted',
  };

  await applyFontToDocument(newFont);
  await saveCustomFontToDb(newFont);
  return newFont;
}

/**
 * Install a custom font by uploading a local font file (.ttf, .otf, .woff, .woff2).
 */
export async function installFontFromFile(file: File, customName?: string): Promise<CustomFontItem> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const validExts = ['ttf', 'otf', 'woff', 'woff2'];

  if (!ext || !validExts.includes(ext)) {
    throw new Error(`Unsupported font format ".${ext}". Please upload .ttf, .otf, .woff, or .woff2 files.`);
  }

  const format: 'truetype' | 'opentype' | 'woff' | 'woff2' =
    ext === 'ttf' ? 'truetype' : ext === 'otf' ? 'opentype' : (ext as any);

  let fontName = customName?.trim();
  if (!fontName) {
    // Strip extension and clean dashes/underscores
    fontName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const arrayBuffer = await file.arrayBuffer();

  const newFont: CustomFontItem = {
    id: `font-file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: fontName,
    source: 'file',
    format,
    fontDataBuffer: arrayBuffer,
    fileSize: formatFileSize(file.size),
    createdAt: Date.now(),
  };

  await applyFontToDocument(newFont);
  await saveCustomFontToDb(newFont);
  return newFont;
}

/**
 * Remove an installed font from document and IndexedDB.
 */
export async function uninstallCustomFont(fontId: string): Promise<void> {
  await deleteCustomFontFromDb(fontId);
  loadedFontsMap.delete(fontId);

  // Remove injected links or styles
  const link = document.getElementById(`custom-font-link-${fontId}`);
  if (link) link.remove();

  const style = document.getElementById(`custom-font-style-${fontId}`);
  if (style) style.remove();
}
