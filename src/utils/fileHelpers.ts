import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import {
  DocumentItem,
  DocumentType,
  ExcelCell,
  ExcelDocumentData,
  ExcelGridData,
  ExcelSheet,
  WordDocumentData,
} from '../types';
import { colIndexToLabel, computeAllCells } from './excelFormula';

// Detect document type from file name or extension
export function detectDocumentType(fileName: string): DocumentType | null {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'docx':
    case 'doc':
    case 'txt':
    case 'rtf':
    case 'md':
    case 'html':
      return 'word';
    case 'xlsx':
    case 'xls':
    case 'csv':
    case 'tsv':
      return 'excel';
    case 'pptx':
    case 'ppt':
      return 'powerpoint';
    case 'pdf':
      return 'pdf';
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

// Parse uploaded Word or text document (.docx, .doc, .txt, .md, .html)
export async function parseWordFile(file: File): Promise<WordDocumentData> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return {
      htmlContent: result.value || '<p>Empty document</p>',
      fontFamily: 'system-ui',
      fontSize: '16px',
      pageOrientation: 'portrait',
      pageSize: 'a4',
      lineSpacing: '1.15',
    };
  }

  // If text, markdown, or html
  const text = await file.text();
  let html = text;
  if (ext === 'txt') {
    html = text
      .split('\n\n')
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
  } else if (ext === 'md') {
    // Basic markdown to html
    html = text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/\n\n/gim, '</p><p>');
    html = `<p>${html}</p>`;
  }

  return {
    htmlContent: html,
    fontFamily: 'system-ui',
    fontSize: '16px',
    pageOrientation: 'portrait',
    pageSize: 'a4',
    lineSpacing: '1.15',
  };
}

// Parse uploaded Excel / CSV spreadsheet (.xlsx, .xls, .csv)
export async function parseExcelFile(file: File): Promise<ExcelDocumentData> {
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
    sheets: sheets.length > 0 ? sheets : [
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

