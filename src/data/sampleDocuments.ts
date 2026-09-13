import {
  DocumentItem,
  ExcelCell,
  ExcelDocumentData,
  ExcelGridData,
  ExcelSheet,
  PowerPointDocumentData,
  WordDocumentData,
} from '../types';
import { computeAllCells } from '../utils/excelFormula';

// Sample Word Document Data
export const sampleWordData: WordDocumentData = {
  htmlContent: `
    <h1 style="color: #1e3a8a; font-size: 26pt; margin-bottom: 8px;">Product Strategy & Architecture Roadmap 2025</h1>
    <p style="color: #64748b; font-size: 13pt; margin-top: 0; margin-bottom: 24px;">Prepared by: Engineering & Product Architecture Team &bull; Status: Approved &bull; Version 2.4</p>
    
    <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 14px 18px; margin-bottom: 24px; border-radius: 4px;">
      <strong style="color: #0369a1; font-size: 11pt;">EXECUTIVE SUMMARY</strong>
      <p style="color: #334155; margin-top: 6px; margin-bottom: 0; font-size: 10.5pt; line-height: 1.6;">
        This document details the technological migration and roadmap for the next generation high-performance cloud document suite. Our primary goals encompass 99.99% availability, zero-latency client-side document processing for Word (.docx), Excel (.xlsx), PowerPoint (.pptx), and PDF files, with enterprise-grade data privacy.
      </p>
    </div>

    <h2 style="color: #0f172a; font-size: 16pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">1. Core Objectives & Milestones</h2>
    <p style="color: #334155; line-height: 1.7; font-size: 11pt;">
      During the preceding fiscal quarters, enterprise demands for hybrid cloud document collaboration have evolved. We are delivering a consolidated single-pane workspace that provides:
    </p>
    <ul style="color: #334155; line-height: 1.8; font-size: 11pt; padding-left: 24px;">
      <li><strong>Native Word Processing:</strong> High-fidelity rich text formatting, typography control, table editors, and direct export.</li>
      <li><strong>Dynamic Excel Calculation Engine:</strong> Real-time formula computation (SUM, AVERAGE, MIN, MAX, financial formulas), multi-sheet workbooks.</li>
      <li><strong>Modern PowerPoint Slide Deck Studio:</strong> Visual presentations, custom geometry, presenter carousel, and presentation mode.</li>
      <li><strong>PDF Markup & Annotation Suite:</strong> High-resolution vector viewing, page thumbnails, text highlights, and digital signature stamps.</li>
    </ul>

    <h2 style="color: #0f172a; font-size: 16pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 28px;">2. Implementation Schedule & Resource Allocation</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 14px; margin-bottom: 24px; font-size: 10.5pt;">
      <thead>
        <tr style="background-color: #1e293b; color: #ffffff;">
          <th style="padding: 10px 14px; text-align: left; border: 1px solid #334155;">Quarter / Phase</th>
          <th style="padding: 10px 14px; text-align: left; border: 1px solid #334155;">Core Deliverables</th>
          <th style="padding: 10px 14px; text-align: left; border: 1px solid #334155;">Lead Tech Stack</th>
          <th style="padding: 10px 14px; text-align: center; border: 1px solid #334155;">Target Date</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background-color: #ffffff;">
          <td style="padding: 9px 14px; border: 1px solid #cbd5e1; font-weight: 600;">Phase 1: Foundation</td>
          <td style="padding: 9px 14px; border: 1px solid #cbd5e1;">Universal parser, Mammoth DOCX engine, SheetJS grid</td>
          <td style="padding: 9px 14px; border: 1px solid #cbd5e1;">TypeScript / React 19</td>
          <td style="padding: 9px 14px; border: 1px solid #cbd5e1; text-align: center; color: #16a34a; font-weight: 600;">Completed</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 9px 14px; border: 1px solid #cbd5e1; font-weight: 600;">Phase 2: PDF & Deck</td>
          <td style="padding: 9px 14px; border: 1px solid #cbd5e1;">Vector PDF rendering, slide layout builder, presenter mode</td>
          <td style="padding: 9px 14px; border: 1px solid #cbd5e1;">PDF.js / Canvas / SVG</td>
          <td style="padding: 9px 14px; border: 1px solid #cbd5e1; text-align: center; color: #0284c7; font-weight: 600;">Active</td>
        </tr>
        <tr style="background-color: #ffffff;">
          <td style="padding: 9px 14px; border: 1px solid #cbd5e1; font-weight: 600;">Phase 3: Hardening</td>
          <td style="padding: 9px 14px; border: 1px solid #cbd5e1;">Multi-file drag-drop, local caching, formula expander</td>
          <td style="padding: 9px 14px; border: 1px solid #cbd5e1;">Web Storage / Service Workers</td>
          <td style="padding: 9px 14px; border: 1px solid #cbd5e1; text-align: center; color: #64748b;">Q4 2025</td>
        </tr>
      </tbody>
    </table>

    <h2 style="color: #0f172a; font-size: 16pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 28px;">3. Sign-Off & Approvals</h2>
    <p style="color: #334155; line-height: 1.6; font-size: 10.5pt;">
      By signing below, the principal stakeholders approve the technical architecture and budget provisions outlined herein.
    </p>
    <div style="display: flex; justify-content: space-between; margin-top: 30px; padding: 10px 0;">
      <div style="border-top: 2px solid #94a3b8; width: 44%; padding-top: 8px;">
        <p style="margin: 0; font-weight: bold; color: #0f172a;">Elena Rostova</p>
        <p style="margin: 0; color: #64748b; font-size: 9.5pt;">Chief Technology Officer</p>
      </div>
      <div style="border-top: 2px solid #94a3b8; width: 44%; padding-top: 8px;">
        <p style="margin: 0; font-weight: bold; color: #0f172a;">David K. Chen</p>
        <p style="margin: 0; color: #64748b; font-size: 9.5pt;">VP of Product Experience</p>
      </div>
    </div>
  `,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '15px',
  pageOrientation: 'portrait',
  pageSize: 'a4',
  lineSpacing: '1.15',
};

// Sample Excel Document Data
function createSampleExcelData(): ExcelDocumentData {
  // Sheet 1: Financial Budget 2025
  const sheet1Data: ExcelGridData = {};
  const setCell = (k: string, raw: string, opts: Partial<ExcelCell> = {}) => {
    sheet1Data[k] = { raw, ...opts };
  };

  // Title
  setCell('A1', 'GLOBAL ENTERPRISE OPERATING BUDGET (2025)', {
    bold: true,
    bg: '#1e3a8a',
    color: '#ffffff',
    align: 'left',
  });
  setCell('B1', '', { bg: '#1e3a8a' });
  setCell('C1', '', { bg: '#1e3a8a' });
  setCell('D1', '', { bg: '#1e3a8a' });
  setCell('E1', '', { bg: '#1e3a8a' });
  setCell('F1', '', { bg: '#1e3a8a' });

  // Column Headers
  const headers = ['Category', 'Q1 Actual', 'Q2 Actual', 'Q3 Forecast', 'Q4 Forecast', 'Total Annual'];
  headers.forEach((h, i) => {
    const col = String.fromCharCode(65 + i);
    setCell(`${col}3`, h, { bold: true, bg: '#f1f5f9', align: i === 0 ? 'left' : 'right' });
  });

  // Operating Expenses
  const rows = [
    { cat: 'Cloud Infrastructure & Servers', q1: '124000', q2: '138000', q3: '145000', q4: '160000' },
    { cat: 'Software Licenses & SaaS', q1: '45000', q2: '48000', q3: '52000', q4: '55000' },
    { cat: 'Engineering Personnel & R&D', q1: '420000', q2: '445000', q3: '470000', q4: '495000' },
    { cat: 'Product Design & User Testing', q1: '32000', q2: '35000', q3: '38000', q4: '40000' },
    { cat: 'Cybersecurity & Compliance', q1: '28000', q2: '30000', q3: '35000', q4: '42000' },
    { cat: 'Marketing & Client Acquisition', q1: '85000', q2: '92000', q3: '110000', q4: '125000' },
  ];

  rows.forEach((r, idx) => {
    const rowNum = idx + 4;
    setCell(`A${rowNum}`, r.cat, { align: 'left' });
    setCell(`B${rowNum}`, r.q1, { align: 'right', format: 'currency' });
    setCell(`C${rowNum}`, r.q2, { align: 'right', format: 'currency' });
    setCell(`D${rowNum}`, r.q3, { align: 'right', format: 'currency' });
    setCell(`E${rowNum}`, r.q4, { align: 'right', format: 'currency' });
    setCell(`F${rowNum}`, `=SUM(B${rowNum}:E${rowNum})`, { align: 'right', format: 'currency', bold: true });
  });

  // Total Summary Row
  setCell('A10', 'TOTAL EXPENDITURES', { bold: true, bg: '#e2e8f0' });
  setCell('B10', '=SUM(B4:B9)', { bold: true, bg: '#e2e8f0', align: 'right', format: 'currency' });
  setCell('C10', '=SUM(C4:C9)', { bold: true, bg: '#e2e8f0', align: 'right', format: 'currency' });
  setCell('D10', '=SUM(D4:D9)', { bold: true, bg: '#e2e8f0', align: 'right', format: 'currency' });
  setCell('E10', '=SUM(E4:E9)', { bold: true, bg: '#e2e8f0', align: 'right', format: 'currency' });
  setCell('F10', '=SUM(F4:F9)', { bold: true, bg: '#cbd5e1', align: 'right', format: 'currency' });

  // Average Row
  setCell('A11', 'Quarterly Average', { italic: true, bg: '#f8fafc' });
  setCell('B11', '=AVERAGE(B4:B9)', { italic: true, bg: '#f8fafc', align: 'right', format: 'currency' });
  setCell('C11', '=AVERAGE(C4:C9)', { italic: true, bg: '#f8fafc', align: 'right', format: 'currency' });
  setCell('D11', '=AVERAGE(D4:D9)', { italic: true, bg: '#f8fafc', align: 'right', format: 'currency' });
  setCell('E11', '=AVERAGE(E4:E9)', { italic: true, bg: '#f8fafc', align: 'right', format: 'currency' });
  setCell('F11', '=AVERAGE(F4:F9)', { italic: true, bg: '#f8fafc', align: 'right', format: 'currency' });

  // Sheet 2: Revenue Projections
  const sheet2Data: ExcelGridData = {};
  const setS2 = (k: string, raw: string, opts: Partial<ExcelCell> = {}) => {
    sheet2Data[k] = { raw, ...opts };
  };

  setS2('A1', 'REVENUE STREAM & MARGIN ANALYSIS', { bold: true, bg: '#15803d', color: '#ffffff' });
  setS2('A3', 'Revenue Stream', { bold: true, bg: '#f1f5f9' });
  setS2('B3', 'Customers', { bold: true, bg: '#f1f5f9', align: 'right' });
  setS2('C3', 'ARPU ($)', { bold: true, bg: '#f1f5f9', align: 'right' });
  setS2('D3', 'Gross Revenue ($)', { bold: true, bg: '#f1f5f9', align: 'right' });

  const revRows = [
    { name: 'Enterprise Cloud Suite', cust: '450', arpu: '2400', rev: '1080000' },
    { name: 'Professional Tier', cust: '2800', arpu: '480', rev: '1344000' },
    { name: 'Developer & API Tier', cust: '12000', arpu: '75', rev: '900000' },
    { name: 'Custom Implementation Services', cust: '35', arpu: '18000', rev: '630000' },
  ];

  revRows.forEach((r, idx) => {
    const rowNum = idx + 4;
    setS2(`A${rowNum}`, r.name, { align: 'left' });
    setS2(`B${rowNum}`, r.cust, { align: 'right', format: 'number' });
    setS2(`C${rowNum}`, r.arpu, { align: 'right', format: 'currency' });
    setS2(`D${rowNum}`, `=B${rowNum}*C${rowNum}`, { align: 'right', format: 'currency', bold: true });
  });

  setS2('A8', 'TOTAL PROJECTED REVENUE', { bold: true, bg: '#dcfce7' });
  setS2('B8', '=SUM(B4:B7)', { bold: true, bg: '#dcfce7', align: 'right', format: 'number' });
  setS2('D8', '=SUM(D4:D7)', { bold: true, bg: '#bbf7d0', align: 'right', format: 'currency' });

  const sheet1: ExcelSheet = {
    id: 'sheet-budget-1',
    name: 'Operating Budget',
    data: computeAllCells(sheet1Data),
    rowCount: 25,
    colCount: 10,
  };

  const sheet2: ExcelSheet = {
    id: 'sheet-revenue-2',
    name: 'Revenue Projections',
    data: computeAllCells(sheet2Data),
    rowCount: 20,
    colCount: 8,
  };

  return {
    sheets: [sheet1, sheet2],
    activeSheetIndex: 0,
  };
}

// Sample PowerPoint Presentation Data
export const samplePowerPointData: PowerPointDocumentData = {
  aspectRatio: '16:9',
  activeSlideIndex: 0,
  slides: [
    {
      id: 'slide-1',
      title: 'Title Slide',
      bgColor: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      textColor: '#ffffff',
      notes: 'Welcome investors and team. Today we present the next chapter in browser document productivity.',
      elements: [
        {
          id: 'el-1',
          type: 'shape',
          x: 8,
          y: 12,
          width: 24,
          height: 6,
          content: 'CONFIDENTIAL PITCH DECK 2025',
          fontSize: 11,
          fontColor: '#38bdf8',
          bgColor: 'rgba(56, 189, 248, 0.15)',
          fontWeight: 'bold',
          align: 'center',
          shapeType: 'pill',
        },
        {
          id: 'el-2',
          type: 'title',
          x: 8,
          y: 24,
          width: 84,
          height: 22,
          content: 'HyperDoc: The Universal Document Operating System',
          fontSize: 34,
          fontWeight: 'bold',
          fontColor: '#ffffff',
          align: 'left',
        },
        {
          id: 'el-3',
          type: 'text',
          x: 8,
          y: 50,
          width: 80,
          height: 14,
          content:
            'A unified web canvas seamlessly opening, editing, and exporting Word documents, Excel spreadsheets, PowerPoint decks, and PDF contracts with zero install friction.',
          fontSize: 16,
          fontColor: '#94a3b8',
          align: 'left',
        },
        {
          id: 'el-4',
          type: 'metric',
          x: 8,
          y: 72,
          width: 26,
          height: 18,
          content: '$48 Billion',
          subtitle: 'Global Document Software TAM',
          fontSize: 22,
          fontColor: '#38bdf8',
          bgColor: 'rgba(30, 41, 59, 0.8)',
        },
        {
          id: 'el-5',
          type: 'metric',
          x: 37,
          y: 72,
          width: 26,
          height: 18,
          content: '100% Client-Side',
          subtitle: 'Zero Data Leakage Risk',
          fontSize: 22,
          fontColor: '#4ade80',
          bgColor: 'rgba(30, 41, 59, 0.8)',
        },
        {
          id: 'el-6',
          type: 'metric',
          x: 66,
          y: 72,
          width: 26,
          height: 18,
          content: '4-in-1 Suite',
          subtitle: 'Word + Excel + PPT + PDF',
          fontSize: 22,
          fontColor: '#f43f5e',
          bgColor: 'rgba(30, 41, 59, 0.8)',
        },
      ],
    },
    {
      id: 'slide-2',
      title: 'The Problem & Market Pain',
      bgColor: '#ffffff',
      textColor: '#0f172a',
      notes: 'Highlight how modern teams struggle with fragmented software silos and expensive license fees.',
      elements: [
        {
          id: 'el-20',
          type: 'title',
          x: 8,
          y: 10,
          width: 84,
          height: 14,
          content: 'The Problem: Fragmented Tools & Expensive Silos',
          fontSize: 28,
          fontWeight: 'bold',
          fontColor: '#0f172a',
          align: 'left',
        },
        {
          id: 'el-21',
          type: 'text',
          x: 8,
          y: 26,
          width: 84,
          height: 10,
          content: 'Today knowledge workers toggle between 6+ heavy desktop apps just to review documents:',
          fontSize: 15,
          fontColor: '#475569',
          align: 'left',
        },
        {
          id: 'el-22',
          type: 'shape',
          x: 8,
          y: 40,
          width: 26,
          height: 48,
          content: 'Fragmented Licenses\n\nEnterprises pay $36+/user/month for overlapping Office 365, Adobe Acrobat, and standalone presentation tools that take minutes to load.',
          fontSize: 13,
          fontColor: '#1e293b',
          bgColor: '#f8fafc',
          align: 'left',
          shapeType: 'rounded',
        },
        {
          id: 'el-23',
          type: 'shape',
          x: 37,
          y: 40,
          width: 26,
          height: 48,
          content: 'Privacy Violations\n\nConverting documents with free online web converters uploads sensitive financial reports and customer contracts to unknown 3rd-party servers.',
          fontSize: 13,
          fontColor: '#1e293b',
          bgColor: '#fef2f2',
          align: 'left',
          shapeType: 'rounded',
        },
        {
          id: 'el-24',
          type: 'shape',
          x: 66,
          y: 40,
          width: 26,
          height: 48,
          content: 'Format Incompatibility\n\nOpening Excel spreadsheets on tablets or mobile web regularly breaks formulas and formatting, frustrating executives and mobile teams.',
          fontSize: 13,
          fontColor: '#1e293b',
          bgColor: '#f0fdf4',
          align: 'left',
          shapeType: 'rounded',
        },
      ],
    },
    {
      id: 'slide-3',
      title: 'Our Solution',
      bgColor: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      textColor: '#ffffff',
      notes: 'Detail our client-first universal engine and immediate zero-friction browser experience.',
      elements: [
        {
          id: 'el-30',
          type: 'shape',
          x: 8,
          y: 12,
          width: 18,
          height: 6,
          content: 'THE INNOVATION',
          fontSize: 10,
          fontColor: '#a5b4fc',
          bgColor: 'rgba(165, 180, 252, 0.15)',
          fontWeight: 'bold',
          align: 'center',
          shapeType: 'pill',
        },
        {
          id: 'el-31',
          type: 'title',
          x: 8,
          y: 22,
          width: 84,
          height: 14,
          content: 'Universal Document Engine in Any Web Browser',
          fontSize: 28,
          fontWeight: 'bold',
          fontColor: '#ffffff',
          align: 'left',
        },
        {
          id: 'el-32',
          type: 'bullet',
          x: 8,
          y: 40,
          width: 42,
          height: 48,
          content:
            'âœ“ Instant drag & drop support for .docx, .xlsx, .pptx, .pdf\nâœ“ 100% offline & client-side parsing using WebAssembly & JS\nâœ“ Full WYSIWYG rich text editor with pagination and Word styling\nâœ“ Built-in formula calculations (=SUM, =AVG) for spreadsheets\nâœ“ Interactive slide show presenter view with keyboard arrows\nâœ“ Multi-layer PDF markup, highlighters, and electronic signatures',
          fontSize: 14,
          fontColor: '#e0e7ff',
          align: 'left',
        },
        {
          id: 'el-33',
          type: 'shape',
          x: 54,
          y: 40,
          width: 38,
          height: 48,
          content: 'Zero Install Required\n\nWorks instantly on Windows, Mac, Linux, iPad, and Chromebooks without installing desktop software or plugins.',
          fontSize: 14,
          fontColor: '#ffffff',
          bgColor: 'rgba(255, 255, 255, 0.08)',
          align: 'center',
          shapeType: 'rounded',
        },
      ],
    },
    {
      id: 'slide-4',
      title: 'Traction & Market Growth',
      bgColor: '#ffffff',
      textColor: '#0f172a',
      notes: 'Summarize adoption milestones and customer satisfaction metrics.',
      elements: [
        {
          id: 'el-40',
          type: 'title',
          x: 8,
          y: 12,
          width: 84,
          height: 12,
          content: 'Enterprise Growth & Adoption Metrics',
          fontSize: 28,
          fontWeight: 'bold',
          fontColor: '#0f172a',
          align: 'left',
        },
        {
          id: 'el-41',
          type: 'metric',
          x: 8,
          y: 32,
          width: 26,
          height: 24,
          content: '2.4 Million',
          subtitle: 'Active Monthly Documents Processed',
          fontSize: 26,
          fontColor: '#2563eb',
          bgColor: '#eff6ff',
        },
        {
          id: 'el-42',
          type: 'metric',
          x: 37,
          y: 32,
          width: 26,
          height: 24,
          content: '99.4%',
          subtitle: 'Conversion & Rendering Fidelity',
          fontSize: 26,
          fontColor: '#16a34a',
          bgColor: '#f0fdf4',
        },
        {
          id: 'el-43',
          type: 'metric',
          x: 66,
          y: 32,
          width: 26,
          height: 24,
          content: '< 120 ms',
          subtitle: 'Average Client-Side Render Speed',
          fontSize: 26,
          fontColor: '#ea580c',
          bgColor: '#fff7ed',
        },
        {
          id: 'el-44',
          type: 'text',
          x: 8,
          y: 64,
          width: 84,
          height: 20,
          content:
            '"HyperDoc allowed our entire legal and finance organization to review and edit complex Word reports and financial Excel models straight from our private secure browser environments without downloading any software." â€” Chief Information Officer, Fortune 500 Financial',
          fontSize: 13,
          fontColor: '#475569',
          align: 'left',
        },
      ],
    },
  ],
};

// Initial Sample Document Set
export function getInitialDocuments(): DocumentItem[] {
  return [
    {
      id: 'doc-word-sample',
      name: 'Product_Strategy_Roadmap_2025.docx',
      type: 'word',
      lastModified: Date.now() - 3600 * 1000 * 4,
      fileSize: '42.8 KB',
      isSample: true,
      data: sampleWordData,
    },
    {
      id: 'doc-excel-sample',
      name: 'Enterprise_Operating_Budget_2025.xlsx',
      type: 'excel',
      lastModified: Date.now() - 3600 * 1000 * 12,
      fileSize: '86.4 KB',
      isSample: true,
      data: createSampleExcelData(),
    },
    {
      id: 'doc-ppt-sample',
      name: 'Universal_Docs_PitchDeck_2025.pptx',
      type: 'powerpoint',
      lastModified: Date.now() - 3600 * 1000 * 24,
      fileSize: '1.2 MB',
      isSample: true,
      data: samplePowerPointData,
    },
    {
      id: 'doc-pdf-sample',
      name: 'Enterprise_Master_Services_Agreement.pdf',
      type: 'pdf',
      lastModified: Date.now() - 3600 * 1000 * 48,
      fileSize: '154 KB',
      isSample: true,
      data: {
        fileName: 'Enterprise_Master_Services_Agreement.pdf',
        pageCount: 2,
        currentPage: 1,
        scale: 1.0,
        rotation: 0,
        annotations: [
          {
            id: 'ann-1',
            pageNumber: 1,
            type: 'highlight',
            x: 7,
            y: 36,
            width: 86,
            height: 3,
            color: '#fef08a', // Yellow highlight
            createdAt: Date.now(),
          },
          {
            id: 'ann-2',
            pageNumber: 1,
            type: 'note',
            x: 82,
            y: 27,
            color: '#3b82f6',
            text: 'Legal team: Uptime SLA confirmed at 99.95% tier.',
            createdAt: Date.now(),
          },
        ],
      },
    },
  ];
}
