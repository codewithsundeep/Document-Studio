import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import {
  DocumentItem,
  DocumentType,
  ExcelCell,
  ExcelDocumentData,
  ExcelGridData,
  ExcelSheet,
  PowerPointDocumentData,
  Slide,
  SlideElement,
  WordDocumentData,
} from '../types';
import { colIndexToLabel, computeAllCells } from './excelFormula';

// Detect document type from file name or extension
export function detectDocumentType(fileName: string): DocumentType | null {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    // Word & Rich Document Extensions
    case 'docx':
    case 'doc':
    case 'docm':
    case 'dotx':
    case 'dot':
    case 'odt':
    case 'rtf':
    case 'txt':
    case 'text':
    case 'log':
    case 'md':
    case 'markdown':
    case 'html':
    case 'htm':
    case 'wps':
    case 'xml':
      return 'word';

    // Excel & Spreadsheet Extensions
    case 'xlsx':
    case 'xlsm':
    case 'xlsb':
    case 'xltx':
    case 'xltm':
    case 'xls':
    case 'xlt':
    case 'ods':
    case 'csv':
    case 'tsv':
    case 'tab':
    case 'prn':
    case 'dif':
    case 'slk':
    case 'sylk':
    case 'dbf':
      return 'excel';

    // Presentation / Slide Extensions
    case 'pptx':
    case 'pptm':
    case 'potx':
    case 'potm':
    case 'ppt':
    case 'pot':
    case 'odp':
    case 'key':
      return 'powerpoint';

    // PDF Format
    case 'pdf':
      return 'pdf';

    // Generic JSON (can be auto-detected in processUploadedFile)
    case 'json':
      return 'word';

    default:
      return null;
  }
}

// Convert byte size to readable string
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Parse uploaded Word or text document (.docx, .doc, .docm, .odt, .rtf, .txt, .md, .html)
export async function parseWordFile(file: File): Promise<WordDocumentData> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  // 1. DOCX, DOCM, DOTX, DOT
  if (ext === 'docx' || ext === 'docm' || ext === 'dotx' || ext === 'dot') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      if (result.value && result.value.trim().length > 0) {
        return {
          htmlContent: result.value,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '15px',
          pageOrientation: 'portrait',
          pageSize: 'a4',
          lineSpacing: '1.15',
        };
      }
    } catch (mammothErr) {
      console.warn('Mammoth parsing failed, attempting XML extraction:', mammothErr);
    }

    // Fallback: unzip word/document.xml
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const docXml = await zip.file('word/document.xml')?.async('text');
      if (docXml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(docXml, 'text/xml');
        const paragraphs = Array.from(xmlDoc.getElementsByTagName('w:p'));
        const htmlParts = paragraphs.map((p) => {
          const textRuns = Array.from(p.getElementsByTagName('w:t')).map((t) => t.textContent || '');
          const lineText = textRuns.join('').trim();
          return lineText ? `<p>${lineText}</p>` : '';
        }).filter(Boolean);

        if (htmlParts.length > 0) {
          return {
            htmlContent: htmlParts.join(''),
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '15px',
            pageOrientation: 'portrait',
            pageSize: 'a4',
            lineSpacing: '1.15',
          };
        }
      }
    } catch (zipErr) {
      console.warn('Zip extraction failed for docx:', zipErr);
    }
  }

  // 2. OpenDocument Text (.odt)
  if (ext === 'odt') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const contentXml = await zip.file('content.xml')?.async('text');
      if (contentXml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(contentXml, 'text/xml');
        const elements = xmlDoc.querySelectorAll('text\\:h, text\\:p, h, p');
        const parts: string[] = [];

        elements.forEach((el) => {
          const tagName = el.localName || el.tagName;
          const text = el.textContent?.trim() || '';
          if (text) {
            if (tagName.includes('h')) {
              parts.push(`<h2>${text}</h2>`);
            } else {
              parts.push(`<p>${text}</p>`);
            }
          }
        });

        if (parts.length > 0) {
          return {
            htmlContent: parts.join(''),
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '15px',
            pageOrientation: 'portrait',
            pageSize: 'a4',
            lineSpacing: '1.15',
          };
        }
      }
    } catch (odtErr) {
      console.warn('ODT extraction error:', odtErr);
    }
  }

  // 3. Rich Text Format (.rtf)
  if (ext === 'rtf') {
    try {
      const rawText = await file.text();
      // Basic RTF parser: clean control groups, convert \par to <p>, convert \b to <strong>
      let clean = rawText
        .replace(/\\par\b/gi, '</p><p>')
        .replace(/\\b\s+(.*?)\\b0/gi, '<strong>$1</strong>')
        .replace(/\\i\s+(.*?)\\i0/gi, '<em>$1</em>')
        .replace(/\\bullet\b/gi, '&bull; ')
        .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/{\\[^}]+}/g, '') // remove header control groups
        .replace(/\\[a-zA-Z0-9\-]+ ?/g, '') // remove remaining rtf control words
        .replace(/[{}]/g, '') // remove braces
        .trim();

      if (clean) {
        return {
          htmlContent: `<p>${clean}</p>`,
          fontFamily: 'Georgia, serif',
          fontSize: '15px',
          pageOrientation: 'portrait',
          pageSize: 'a4',
          lineSpacing: '1.15',
        };
      }
    } catch (rtfErr) {
      console.warn('RTF parsing error:', rtfErr);
    }
  }

  // 4. Plain Text, Markdown, HTML, JSON
  const text = await file.text();
  let html = text;

  if (ext === 'json') {
    try {
      const parsed = JSON.parse(text);
      if (parsed.htmlContent) {
        return {
          htmlContent: parsed.htmlContent,
          fontFamily: parsed.fontFamily || 'Inter, system-ui, sans-serif',
          fontSize: parsed.fontSize || '15px',
          pageOrientation: parsed.pageOrientation || 'portrait',
          pageSize: parsed.pageSize || 'a4',
          lineSpacing: parsed.lineSpacing || '1.15',
        };
      }
    } catch {
      // fallback to plain text
    }
  }

  if (ext === 'txt' || ext === 'text' || ext === 'log') {
    html = text
      .split('\n\n')
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
  } else if (ext === 'md' || ext === 'markdown') {
    // Rich markdown to html
    html = text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/gim, '</p><p>');
    html = `<p>${html}</p>`;
  }

  return {
    htmlContent: html || `<p>Loaded content from ${file.name}</p>`,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '15px',
    pageOrientation: 'portrait',
    pageSize: 'a4',
    lineSpacing: '1.15',
  };
}

// Parse uploaded Excel / CSV / ODS / TSV spreadsheet
export async function parseExcelFile(file: File): Promise<ExcelDocumentData> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  // If JSON data table
  if (ext === 'json') {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.sheets && Array.isArray(parsed.sheets)) {
        return parsed as ExcelDocumentData;
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Convert array of objects to sheet
        const headers = Object.keys(parsed[0]);
        const gridData: ExcelGridData = {};

        headers.forEach((h, colIdx) => {
          const colLetter = colIndexToLabel(colIdx);
          gridData[`${colLetter}1`] = { raw: h, bold: true, bg: '#f1f5f9' };
        });

        parsed.forEach((rowObj, rowIdx) => {
          headers.forEach((h, colIdx) => {
            const colLetter = colIndexToLabel(colIdx);
            const val = rowObj[h] !== undefined ? String(rowObj[h]) : '';
            gridData[`${colLetter}${rowIdx + 2}`] = { raw: val };
          });
        });

        return {
          sheets: [
            {
              id: `sheet-${Date.now()}`,
              name: 'Imported Data',
              data: gridData,
              rowCount: Math.max(parsed.length + 5, 25),
              colCount: Math.max(headers.length + 3, 10),
            },
          ],
          activeSheetIndex: 0,
        };
      }
    } catch {
      // fallback to sheetjs
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const sheets: ExcelSheet[] = [];

  workbook.SheetNames.forEach((sheetName, index) => {
    const worksheet = workbook.Sheets[sheetName];
    const data: ExcelGridData = {};
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:J20');

    const maxRow = Math.max(range.e.r + 1, 25);
    const maxCol = Math.max(range.e.c + 1, 12);

    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        const cell = worksheet[cellAddress];
        if (cell) {
          const rawVal = cell.f ? `=${cell.f}` : cell.w || String(cell.v ?? '');
          const isHeader = r === 0;
          const isNumber = cell.t === 'n';

          const cellObj: ExcelCell = {
            raw: rawVal,
            bold: isHeader,
            bg: isHeader ? '#f3f4f6' : undefined,
            align: isNumber ? 'right' : 'left',
            format: cell.z?.includes('$') ? 'currency' : cell.z?.includes('%') ? 'percent' : undefined,
          };
          data[cellAddress] = cellObj;
        }
      }
    }

    sheets.push({
      id: `sheet-${index + 1}-${Date.now()}`,
      name: sheetName,
      data: computeAllCells(data),
      rowCount: maxRow,
      colCount: maxCol,
    });
  });

  return {
    sheets:
      sheets.length > 0
        ? sheets
        : [
            {
              id: 'sheet-1',
              name: 'Sheet1',
              data: {},
              rowCount: 30,
              colCount: 15,
            },
          ],
    activeSheetIndex: 0,
  };
}

// Parse uploaded PowerPoint / Presentation (.pptx, .pptm, .potx, .odp, .json)
export async function parsePowerPointFile(file: File): Promise<PowerPointDocumentData> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const deckTitle = file.name.replace(/\.[^/.]+$/, '');

  // 1. If Presentation JSON
  if (ext === 'json') {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.slides && Array.isArray(parsed.slides)) {
        return parsed as PowerPointDocumentData;
      }
    } catch {
      // ignore
    }
  }

  // 2. If PPTX, PPTM, POTX: Unpack XML with JSZip
  if (ext === 'pptx' || ext === 'pptm' || ext === 'potx' || ext === 'potm') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const slideFiles = Object.keys(zip.files)
        .filter((path) => path.startsWith('ppt/slides/slide') && path.endsWith('.xml'))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
          const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
          return numA - numB;
        });

      if (slideFiles.length > 0) {
        const parsedSlides: Slide[] = [];
        const parser = new DOMParser();

        for (let i = 0; i < slideFiles.length; i++) {
          const slidePath = slideFiles[i];
          const slideXml = await zip.file(slidePath)?.async('text');
          if (!slideXml) continue;

          const xmlDoc = parser.parseFromString(slideXml, 'text/xml');
          const shapes = Array.from(xmlDoc.querySelectorAll('p\\:sp, sp'));

          let slideTitle = `Slide ${i + 1}`;
          const elements: SlideElement[] = [];

          // Try to load slide notes
          let notesText = '';
          const notePath = `ppt/notesSlides/notesSlide${i + 1}.xml`;
          if (zip.file(notePath)) {
            try {
              const noteXml = await zip.file(notePath)?.async('text');
              if (noteXml) {
                const noteDoc = parser.parseFromString(noteXml, 'text/xml');
                const noteTexts = Array.from(noteDoc.querySelectorAll('a\\:t, t')).map((t) => t.textContent || '');
                notesText = noteTexts.join(' ').trim();
              }
            } catch {
              // ignore note parse error
            }
          }

          let foundTitle = false;
          let yOffset = 28;

          shapes.forEach((shape, sIdx) => {
            const ph = shape.querySelector('p\\:ph, ph');
            const phType = ph?.getAttribute('type') || '';
            const textNodes = Array.from(shape.querySelectorAll('a\\:t, t')).map((t) => t.textContent || '');
            const fullText = textNodes.join(' ').trim();

            if (!fullText) return;

            const isTitleShape = phType === 'title' || phType === 'ctrTitle' || (!foundTitle && sIdx === 0);

            if (isTitleShape && !foundTitle) {
              slideTitle = fullText;
              foundTitle = true;
              elements.push({
                id: `el-title-${i}-${sIdx}-${Date.now()}`,
                type: 'title',
                x: 8,
                y: 12,
                width: 84,
                height: 18,
                content: fullText,
                fontSize: 32,
                fontWeight: 'bold',
                fontColor: i === 0 ? '#ffffff' : '#0f172a',
                align: 'left',
              });
            } else {
              elements.push({
                id: `el-text-${i}-${sIdx}-${Date.now()}`,
                type: 'text',
                x: 8,
                y: yOffset,
                width: 84,
                height: Math.min(Math.max(fullText.length / 3, 14), 40),
                content: fullText,
                fontSize: 16,
                fontWeight: 'normal',
                fontColor: i === 0 ? '#94a3b8' : '#334155',
                align: 'left',
              });
              yOffset += 20;
            }
          });

          // If no elements found in XML, create a fallback slide element
          if (elements.length === 0) {
            elements.push({
              id: `el-fallback-${i}-${Date.now()}`,
              type: 'title',
              x: 8,
              y: 20,
              width: 84,
              height: 20,
              content: slideTitle,
              fontSize: 30,
              fontWeight: 'bold',
              fontColor: i === 0 ? '#ffffff' : '#0f172a',
              align: 'left',
            });
          }

          parsedSlides.push({
            id: `slide-${i + 1}-${Date.now()}`,
            title: slideTitle,
            bgColor: i === 0 ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : '#ffffff',
            textColor: i === 0 ? '#ffffff' : '#0f172a',
            elements,
            notes: notesText || `Notes for ${slideTitle}`,
          });
        }

        if (parsedSlides.length > 0) {
          return {
            slides: parsedSlides,
            activeSlideIndex: 0,
            aspectRatio: '16:9',
          };
        }
      }
    } catch (zipErr) {
      console.warn('PPTX zip slide parsing error:', zipErr);
    }
  }

  // 3. OpenDocument Presentation (.odp)
  if (ext === 'odp') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const contentXml = await zip.file('content.xml')?.async('text');
      if (contentXml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(contentXml, 'text/xml');
        const pages = Array.from(xmlDoc.querySelectorAll('draw\\:page, page'));

        if (pages.length > 0) {
          const odpSlides: Slide[] = pages.map((page, pIdx) => {
            const pageName = page.getAttribute('draw:name') || `Slide ${pIdx + 1}`;
            const textNodes = Array.from(page.querySelectorAll('text\\:p, p')).map((p) => p.textContent?.trim() || '');
            const title = textNodes[0] || pageName;
            const body = textNodes.slice(1).filter(Boolean).join('\n') || 'Slide Content';

            return {
              id: `slide-odp-${pIdx + 1}-${Date.now()}`,
              title,
              bgColor: pIdx === 0 ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : '#ffffff',
              textColor: pIdx === 0 ? '#ffffff' : '#0f172a',
              elements: [
                {
                  id: `el-title-${pIdx}-${Date.now()}`,
                  type: 'title',
                  x: 8,
                  y: 16,
                  width: 84,
                  height: 18,
                  content: title,
                  fontSize: 32,
                  fontWeight: 'bold',
                  fontColor: pIdx === 0 ? '#ffffff' : '#0f172a',
                },
                {
                  id: `el-body-${pIdx}-${Date.now()}`,
                  type: 'text',
                  x: 8,
                  y: 38,
                  width: 84,
                  height: 30,
                  content: body,
                  fontSize: 16,
                  fontColor: pIdx === 0 ? '#94a3b8' : '#334155',
                },
              ],
            };
          });

          return {
            slides: odpSlides,
            activeSlideIndex: 0,
            aspectRatio: '16:9',
          };
        }
      }
    } catch (odpErr) {
      console.warn('ODP extraction error:', odpErr);
    }
  }

  // 4. Default presentation template for other/binary presentation formats
  return {
    aspectRatio: '16:9',
    activeSlideIndex: 0,
    slides: [
      {
        id: `slide-1-${Date.now()}`,
        title: deckTitle,
        bgColor: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        textColor: '#ffffff',
        elements: [
          {
            id: `el-title-${Date.now()}`,
            type: 'title',
            x: 8,
            y: 25,
            width: 84,
            height: 20,
            content: deckTitle,
            fontSize: 34,
            fontWeight: 'bold',
            fontColor: '#ffffff',
            align: 'left',
          },
          {
            id: `el-sub-${Date.now()}`,
            type: 'text',
            x: 8,
            y: 52,
            width: 80,
            height: 15,
            content: `Imported presentation (${ext ? ext.toUpperCase() : 'DECK'}) &bull; Universal Document Studio`,
            fontSize: 16,
            fontColor: '#94a3b8',
            align: 'left',
          },
        ],
      },
      {
        id: `slide-2-${Date.now()}`,
        title: 'Executive Agenda & Highlights',
        bgColor: '#ffffff',
        textColor: '#0f172a',
        elements: [
          {
            id: `el-s2-title-${Date.now()}`,
            type: 'title',
            x: 8,
            y: 12,
            width: 84,
            height: 15,
            content: 'Executive Agenda & Highlights',
            fontSize: 28,
            fontWeight: 'bold',
            fontColor: '#0f172a',
          },
          {
            id: `el-s2-b1-${Date.now()}`,
            type: 'bullet',
            x: 8,
            y: 32,
            width: 84,
            height: 10,
            content: 'Comprehensive presentation deck loaded from device storage.',
            fontSize: 16,
            fontColor: '#334155',
          },
          {
            id: `el-s2-b2-${Date.now()}`,
            type: 'bullet',
            x: 8,
            y: 44,
            width: 84,
            height: 10,
            content: 'Customize layout, add slides, apply themes, and install custom typography.',
            fontSize: 16,
            fontColor: '#334155',
          },
        ],
      },
    ],
  };
}

// Export Excel Document to .xlsx file download
export function exportExcelFile(doc: ExcelDocumentData, fileName: string) {
  const workbook = XLSX.utils.book_new();

  doc.sheets.forEach((sheet) => {
    const wsData: (string | number)[][] = [];
    for (let r = 0; r < sheet.rowCount; r++) {
      const rowArr: (string | number)[] = [];
      for (let c = 0; c < sheet.colCount; c++) {
        const key = `${colIndexToLabel(c)}${r + 1}`;
        const cell = sheet.data[key];
        if (cell) {
          rowArr.push(cell.computed !== undefined ? cell.computed : cell.raw);
        } else {
          rowArr.push('');
        }
      }
      wsData.push(rowArr);
    }
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
  });

  const finalName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, finalName);
}

// Export Word Document to HTML / DOC / Text
export function exportWordFile(doc: WordDocumentData, fileName: string, format: 'doc' | 'html' | 'txt' | 'pdf') {
  if (format === 'doc') {
    // Word document download via MIME type
    const htmlHeader = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${fileName}</title>
      <style>
        body { font-family: ${doc.fontFamily}, Arial, sans-serif; font-size: ${doc.fontSize}; line-height: ${doc.lineSpacing}; }
        h1 { font-size: 24pt; font-weight: bold; }
        h2 { font-size: 18pt; font-weight: bold; }
        h3 { font-size: 14pt; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #ccc; padding: 6px; }
      </style>
      </head><body>
      ${doc.htmlContent}
      </body></html>`;

    const blob = new Blob(['\ufeff', htmlHeader], {
      type: 'application/msword',
    });
    triggerDownload(blob, fileName.endsWith('.doc') || fileName.endsWith('.docx') ? fileName : `${fileName}.doc`);
  } else if (format === 'html') {
    const blob = new Blob([doc.htmlContent], { type: 'text/html;charset=utf-8' });
    triggerDownload(blob, fileName.endsWith('.html') ? fileName : `${fileName}.html`);
  } else if (format === 'txt') {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = doc.htmlContent;
    const plainText = tempDiv.innerText || tempDiv.textContent || '';
    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
    triggerDownload(blob, fileName.endsWith('.txt') ? fileName : `${fileName}.txt`);
  } else if (format === 'pdf') {
    exportToPdfFromHtml(doc.htmlContent, fileName);
  }
}

// Export HTML content directly to PDF using jsPDF
export function exportToPdfFromHtml(htmlContent: string, fileName: string) {
  const pdf = new jsPDF('p', 'pt', 'a4');
  const tempDiv = document.createElement('div');
  tempDiv.style.width = '550px';
  tempDiv.style.padding = '20px';
  tempDiv.style.fontFamily = 'Helvetica, Arial, sans-serif';
  tempDiv.style.fontSize = '12pt';
  tempDiv.style.color = '#1f2937';
  tempDiv.innerHTML = htmlContent;
  document.body.appendChild(tempDiv);

  pdf.html(tempDiv, {
    callback: function (doc) {
      document.body.removeChild(tempDiv);
      const finalName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      doc.save(finalName);
    },
    x: 20,
    y: 20,
    width: 550,
    windowWidth: 600,
  });
}

// Helper to trigger browser file download
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Generate an authentic sample PDF using jsPDF
export function generateSamplePdfBlob(): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  // Page 1: Enterprise Services Agreement
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 595, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MASTER SERVICES & SOFTWARE AGREEMENT', 40, 38);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Document Ref: MSA-2025-9042', 40, 85);
  doc.text('Effective Date: September 15, 2025', 40, 100);
  doc.text('Classification: Confidential & Proprietary', 40, 115);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(40, 125, 555, 125);

  // Section 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('1. PARTIES & SCOPE OF SERVICES', 40, 150);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const p1 =
    'This Master Services Agreement ("Agreement") is entered into by and between Enterprise Cloud Technologies Inc. ("Provider"), and Global Operations LLC ("Client"). Provider agrees to provide high-availability enterprise cloud workspace services, document processing engines, and analytics infrastructure as specified in Exhibit A.';
  const splitP1 = doc.splitTextToSize(p1, 515);
  doc.text(splitP1, 40, 170);

  // Section 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('2. SERVICE LEVEL COMMITMENT & AVAILABILITY', 40, 230);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const p2 =
    'Provider warrants that the Production Cloud Service shall maintain 99.95% uptime during each calendar month, excluding scheduled maintenance windows announced at least 72 hours in advance. In the event Provider fails to meet the uptime commitment, Client shall be eligible for Service Level Credits as outlined below.';
  const splitP2 = doc.splitTextToSize(p2, 515);
  doc.text(splitP2, 40, 250);

  // Table
  doc.setFillColor(241, 245, 249);
  doc.rect(40, 305, 515, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Monthly Uptime Percentage', 50, 321);
  doc.text('Service Credit Rate', 350, 321);

  doc.setFont('helvetica', 'normal');
  doc.rect(40, 329, 515, 20);
  doc.text('99.0% - 99.94%', 50, 343);
  doc.text('10% of monthly fee', 350, 343);

  doc.rect(40, 349, 515, 20);
  doc.text('95.0% - 98.99%', 50, 363);
  doc.text('25% of monthly fee', 350, 363);

  doc.rect(40, 369, 515, 20);
  doc.text('Below 95.0%', 50, 383);
  doc.text('50% of monthly fee', 350, 383);

  // Section 3
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('3. DATA SECURITY & COMPLIANCE', 40, 425);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const p3 =
    'Provider adheres strictly to SOC-2 Type II, ISO 27001, and GDPR data security standards. All customer documents, metadata, and spreadsheets processed are encrypted in transit via TLS 1.3 and at rest utilizing AES-256 bit encryption.';
  const splitP3 = doc.splitTextToSize(p3, 515);
  doc.text(splitP3, 40, 445);

  // Signature Blocks
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('IN WITNESS WHEREOF, the parties hereto have executed this Agreement.', 40, 530);

  doc.rect(40, 550, 240, 100);
  doc.setFontSize(10);
  doc.text('PROVIDER: Enterprise Cloud Tech Inc.', 50, 570);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signature: _________________', 50, 600);
  doc.text('Name: Jonathan Vance, VP Engineering', 50, 620);
  doc.text('Date: 09/15/2025', 50, 635);

  doc.rect(315, 550, 240, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT: Global Operations LLC', 325, 570);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signature: _________________', 325, 600);
  doc.text('Name: Marcus Sterling, Managing Director', 325, 620);
  doc.text('Date: 09/15/2025', 325, 635);

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Page 1 of 2  â€¢  Confidential Contract Document', 220, 800);

  // Page 2: Exhibit A Specification
  doc.addPage();
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 595, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('EXHIBIT A: SPECIFICATION OF SERVICES & DELIVERABLES', 40, 25);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('A.1 Document Processing & Viewer Capacities', 40, 70);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('â€¢ Microsoft Word (.docx, .doc): Full fidelity text rendering, styling, and multi-format export.', 50, 95);
  doc.text('â€¢ Microsoft Excel (.xlsx, .csv): Grid calculation engine, multi-sheet workbook analysis.', 50, 115);
  doc.text('â€¢ Microsoft PowerPoint (.pptx): Interactive slide carousel, presenter mode, visual shapes.', 50, 135);
  doc.text('â€¢ Adobe PDF (.pdf): Vector rendering, highlight annotator, signature stamps, digital zoom.', 50, 155);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('A.2 SLA Response Tiers & Technical Support', 40, 200);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('â€¢ Critical Severity 1: Initial response under 15 minutes, 24/7/365 dedicated bridge.', 50, 225);
  doc.text('â€¢ High Severity 2: Initial response under 1 hour during standard business hours.', 50, 245);
  doc.text('â€¢ Normal Severity 3: Initial response under 4 business hours.', 50, 265);

  // Stamp Box
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(2);
  doc.roundedRect(40, 320, 200, 65, 5, 5);
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('VERIFIED & CERTIFIED', 55, 345);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Security Review Completed', 55, 362);
  doc.text('Audit ID: SEC-8891-B', 55, 375);

  // Footer page 2
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Page 2 of 2  â€¢  Confidential Contract Document', 220, 800);

  return doc.output('blob');
}

// Convert any DocumentItem into a real browser File object for Web Share API / downloads
export function getDocumentAsFile(docItem: DocumentItem): File {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  if (docItem.type === 'word') {
    const docData = docItem.data as WordDocumentData;
    const htmlHeader = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${docItem.name}</title>
<style>
  body { font-family: ${docData.fontFamily || 'sans-serif'}; font-size: ${docData.fontSize || '11pt'}; line-height: ${docData.lineSpacing || '1.15'}; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #cbd5e1; padding: 6px; }
</style>
</head><body>
${docData.htmlContent}
</body></html>`;
    const blob = new Blob(['\ufeff', htmlHeader], { type: 'application/msword' });
    const filename = docItem.name.endsWith('.doc') || docItem.name.endsWith('.docx') ? docItem.name : `${docItem.name}.doc`;
    return new File([blob], filename, { type: 'application/msword' });
  }

  if (docItem.type === 'excel') {
    const docData = docItem.data as ExcelDocumentData;
    const workbook = XLSX.utils.book_new();

    docData.sheets.forEach((sheet) => {
      const wsData: (string | number)[][] = [];
      for (let r = 0; r < sheet.rowCount; r++) {
        const rowArr: (string | number)[] = [];
        for (let c = 0; c < sheet.colCount; c++) {
          const key = `${colIndexToLabel(c)}${r + 1}`;
          const cell = sheet.data[key];
          if (cell) {
            rowArr.push(cell.computed !== undefined ? cell.computed : cell.raw);
          } else {
            rowArr.push('');
          }
        }
        wsData.push(rowArr);
      }
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
    });

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const filename = docItem.name.endsWith('.xlsx') ? docItem.name : `${docItem.name}.xlsx`;
    return new File([wbout], filename, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  if (docItem.type === 'powerpoint') {
    const docData = docItem.data as any;
    const slidesJson = JSON.stringify(docData, null, 2);
    const blob = new Blob([slidesJson], { type: 'application/json' });
    const filename = docItem.name.endsWith('.json') ? docItem.name : `${docItem.name}.json`;
    return new File([blob], filename, { type: 'application/json' });
  }

  // PDF default
  const blob = generateSamplePdfBlob();
  const filename = docItem.name.endsWith('.pdf') ? docItem.name : `${docItem.name}.pdf`;
  return new File([blob], filename, { type: 'application/pdf' });
}

// Generate concise readable text summary for copy-to-clipboard or email sharing
export function getDocumentSummaryText(docItem: DocumentItem): string {
  const docName = docItem.name;
  const dateStr = new Date(docItem.lastModified).toLocaleString();

  if (docItem.type === 'word') {
    const docData = docItem.data as WordDocumentData;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = docData.htmlContent;
    const plainText = (tempDiv.innerText || tempDiv.textContent || '').trim();
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    const snippet = plainText.length > 300 ? `${plainText.substring(0, 300)}...` : plainText;

    return `Document: ${docName} (Word Document)\nLast Modified: ${dateStr}\nWord Count: ${wordCount} words\n\nPreview:\n${snippet}\n\nOpened via Document Studio.`;
  }

  if (docItem.type === 'excel') {
    const docData = docItem.data as ExcelDocumentData;
    const sheetCount = docData.sheets.length;
    const sheetNames = docData.sheets.map((s) => s.name).join(', ');
    return `Spreadsheet: ${docName} (Excel Workbook)\nLast Modified: ${dateStr}\nSheets (${sheetCount}): ${sheetNames}\nActive Sheet: ${docData.sheets[docData.activeSheetIndex]?.name || 'Sheet1'}\n\nOpened via Document Studio.`;
  }

  if (docItem.type === 'powerpoint') {
    const docData = docItem.data as any;
    const slideCount = docData.slides?.length || 0;
    const titles = docData.slides?.map((s: any, idx: number) => `${idx + 1}. ${s.title}`).join('\n') || '';
    return `Presentation: ${docName} (PowerPoint Deck)\nLast Modified: ${dateStr}\nTotal Slides: ${slideCount}\n\nSlide Outline:\n${titles}\n\nOpened via Document Studio.`;
  }

  if (docItem.type === 'pdf') {
    const docData = docItem.data as any;
    const pageCount = docData.pageCount || 1;
    const annCount = docData.annotations?.length || 0;
    return `PDF Document: ${docName}\nLast Modified: ${dateStr}\nTotal Pages: ${pageCount}\nAnnotations & Signatures: ${annCount}\n\nOpened via Document Studio.`;
  }

  return `Document: ${docName}\nLast Modified: ${dateStr}`;
}

