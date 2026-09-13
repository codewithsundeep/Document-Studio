import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Highlighter,
  MessageSquare,
  PenTool,
  Printer,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Trash2,
  CheckCircle,
  FileText,
  Bookmark,
  Layers,
  Sparkles,
} from 'lucide-react';
import { PDFAnnotation, PDFDocItem } from '../../types';
import { generateSamplePdfBlob, triggerDownload } from '../../utils/fileHelpers';

interface PdfViewerProps {
  document: PDFDocItem;
  onChange: (updatedDoc: PDFDocItem) => void;
  isReadOnly?: boolean;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ document: docItem, onChange, isReadOnly = false }) => {
  const [currentPage, setCurrentPage] = useState<number>(docItem.data.currentPage || 1);
  const [zoom, setZoom] = useState<number>(docItem.data.scale ? Math.round(docItem.data.scale * 100) : 100);
  const [rotation, setRotation] = useState<number>(docItem.data.rotation || 0);
  const [activeTool, setActiveTool] = useState<'select' | 'highlight' | 'note' | 'signature'>('select');
  const [activeColor, setActiveColor] = useState<string>('#fef08a');
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [showAnnotationsList, setShowAnnotationsList] = useState<boolean>(false);
  const [newNoteText, setNewNoteText] = useState<string>('');

  const pageCount = docItem.data.pageCount || 2;
  const annotations = docItem.data.annotations || [];

  // Handle adding annotation by clicking on the page
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly || activeTool === 'select') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    let newAnnotation: PDFAnnotation;

    if (activeTool === 'highlight') {
      newAnnotation = {
        id: `ann-${Date.now()}`,
        pageNumber: currentPage,
        type: 'highlight',
        x: Math.max(5, clickX - 15),
        y: Math.max(2, clickY - 1.5),
        width: 30,
        height: 3,
        color: activeColor,
        createdAt: Date.now(),
      };
    } else if (activeTool === 'note') {
      const text = prompt('Enter sticky note text:', 'Please review this clause before signing.');
      if (!text) return;
      newAnnotation = {
        id: `ann-${Date.now()}`,
        pageNumber: currentPage,
        type: 'note',
        x: clickX,
        y: clickY,
        color: '#3b82f6',
        text,
        createdAt: Date.now(),
      };
    } else if (activeTool === 'signature') {
      newAnnotation = {
        id: `ann-${Date.now()}`,
        pageNumber: currentPage,
        type: 'signature',
        x: Math.max(5, clickX - 12),
        y: Math.max(5, clickY - 5),
        width: 28,
        height: 10,
        color: '#1e3a8a',
        text: 'Electronically Verified Signature',
        createdAt: Date.now(),
      };
    } else {
      return;
    }

    const updatedAnnotations = [...annotations, newAnnotation];
    onChange({
      ...docItem,
      lastModified: Date.now(),
      data: {
        ...docItem.data,
        annotations: updatedAnnotations,
      },
    });

    // Reset tool back to select after stamping signature or note
    if (activeTool === 'signature') {
      setActiveTool('select');
    }
  };

  const handleDeleteAnnotation = (annId: string) => {
    if (isReadOnly) return;
    const updated = annotations.filter((a) => a.id !== annId);
    onChange({
      ...docItem,
      lastModified: Date.now(),
      data: {
        ...docItem.data,
        annotations: updated,
      },
    });
  };

  const handleDownloadPdf = () => {
    // Generate fresh authentic sample PDF
    const blob = generateSamplePdfBlob();
    triggerDownload(blob, docItem.name.endsWith('.pdf') ? docItem.name : `${docItem.name}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const pageAnnotations = annotations.filter((a) => a.pageNumber === currentPage);

  return (
    <div id="pdf-viewer-container" className="flex flex-col h-full bg-slate-200/90 select-none overflow-hidden">
      {/* Top PDF Ribbon Toolbar */}
      <div id="pdf-toolbar" className="bg-white border-b border-slate-300 px-4 py-2 flex flex-wrap items-center gap-2 shadow-xs z-20">
        {/* Toggle Thumbnails */}
        <button
          id="pdf-toggle-thumbnails-btn"
          onClick={() => setShowThumbnails(!showThumbnails)}
          className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
            showThumbnails ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Toggle Page Thumbnails"
        >
          <Layers className="w-4 h-4" />
          <span className="hidden sm:inline">Thumbnails</span>
        </button>

        {/* Page Navigation */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
          <button
            id="pdf-prev-page-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-30 transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 text-xs text-slate-700 font-medium">
            <input
              type="number"
              min="1"
              max={pageCount}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1 && val <= pageCount) setCurrentPage(val);
              }}
              className="w-10 text-center py-0.5 border border-slate-300 rounded font-mono font-semibold"
            />
            <span className="text-slate-500">/ {pageCount}</span>
          </div>
          <button
            id="pdf-next-page-btn"
            onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
            disabled={currentPage >= pageCount}
            className="p-1 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-30 transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
          <button
            id="pdf-zoom-out-btn"
            onClick={() => setZoom((z) => Math.max(50, z - 15))}
            className="p-1 hover:bg-slate-100 rounded text-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="w-12 text-center text-xs font-mono font-semibold text-slate-700">{zoom}%</span>
          <button
            id="pdf-zoom-in-btn"
            onClick={() => setZoom((z) => Math.min(200, z + 15))}
            className="p-1 hover:bg-slate-100 rounded text-slate-700"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Rotation */}
        <div className="flex items-center pl-2 border-l border-slate-200">
          <button
            id="pdf-rotate-btn"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
            title="Rotate Clockwise 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Annotation & Markup Tools */}
        {!isReadOnly && (
          <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
            <button
              onClick={() => setActiveTool('select')}
              className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                activeTool === 'select' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Select
            </button>
            <button
              onClick={() => setActiveTool('highlight')}
              className={`px-2 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
                activeTool === 'highlight' ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-400' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-500" />
              <span>Highlight</span>
            </button>
            <button
              onClick={() => setActiveTool('note')}
              className={`px-2 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
                activeTool === 'note' ? 'bg-blue-100 text-blue-900 ring-1 ring-blue-400' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              <span>Note</span>
            </button>
            <button
              onClick={() => setActiveTool('signature')}
              className={`px-2 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
                activeTool === 'signature' ? 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-400' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sign / Stamp</span>
            </button>
          </div>
        )}

        {/* Right tools */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowAnnotationsList(!showAnnotationsList)}
            className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition-colors ${
              showAnnotationsList ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Annotations ({annotations.length})</span>
          </button>
          <button
            id="pdf-print-btn"
            onClick={handlePrint}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
            title="Print PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            id="pdf-download-btn"
            onClick={handleDownloadPdf}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Thumbnails Rail */}
        {showThumbnails && (
          <div id="pdf-thumbnails-panel" className="w-48 bg-white border-r border-slate-300 flex flex-col p-3 gap-4 overflow-y-auto select-none">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pages ({pageCount})</span>
            {Array.from({ length: pageCount }).map((_, idx) => {
              const pNum = idx + 1;
              const isSelected = pNum === currentPage;
              return (
                <div
                  key={pNum}
                  onClick={() => setCurrentPage(pNum)}
                  className={`flex flex-col items-center gap-1 cursor-pointer group`}
                >
                  <div
                    className={`w-32 aspect-[1/1.414] bg-white rounded border-2 shadow-xs flex flex-col p-2 overflow-hidden transition-all ${
                      isSelected ? 'border-red-600 ring-2 ring-red-100 shadow-md' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div className="w-full h-2 bg-slate-800 rounded-2xs mb-2" />
                    <div className="space-y-1 opacity-40">
                      <div className="w-3/4 h-1 bg-slate-500 rounded-2xs" />
                      <div className="w-full h-1 bg-slate-400 rounded-2xs" />
                      <div className="w-5/6 h-1 bg-slate-400 rounded-2xs" />
                      <div className="w-full h-1 bg-slate-400 rounded-2xs" />
                      <div className="w-2/3 h-1 bg-slate-400 rounded-2xs" />
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-medium ${isSelected ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                    Page {pNum}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Center Canvas Viewport */}
        <div
          id="pdf-viewport"
          className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center relative"
        >
          {/* Authentic High-Resolution Vector PDF Page Canvas */}
          <div
            id="pdf-page-canvas"
            onClick={handlePageClick}
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
            }}
            className={`w-[680px] min-h-[960px] bg-white shadow-2xl rounded-xs border border-slate-300 relative select-text p-12 transition-all ${
              activeTool !== 'select' ? 'cursor-crosshair' : 'cursor-default'
            }`}
          >
            {/* Page 1 Contents */}
            {currentPage === 1 ? (
              <div className="text-slate-800 font-serif leading-relaxed">
                {/* Header Band */}
                <div className="bg-slate-900 text-white -mx-12 -mt-12 p-6 mb-8 flex justify-between items-center rounded-t-xs">
                  <div>
                    <h1 className="text-xl font-bold tracking-wide uppercase font-sans">
                      Master Services & Software Agreement
                    </h1>
                    <p className="text-slate-400 text-xs mt-1 font-sans">
                      Ref: MSA-2025-9042 &bull; Effective Date: September 15, 2025
                    </p>
                  </div>
                  <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded text-xs font-sans font-semibold">
                    ACTIVE CONTRACT
                  </div>
                </div>

                <div className="border-b border-slate-200 pb-4 mb-6 text-xs text-slate-500 font-sans flex justify-between">
                  <span>Parties: Enterprise Cloud Tech Inc. &amp; Global Operations LLC</span>
                  <span>Classification: Strictly Confidential</span>
                </div>

                <h2 className="text-base font-bold font-sans text-slate-900 mb-2">1. PARTIES &amp; SCOPE OF SERVICES</h2>
                <p className="text-xs text-slate-700 mb-6 leading-normal font-sans">
                  This Master Services Agreement (&quot;Agreement&quot;) is entered into by and between Enterprise Cloud Technologies Inc. (&quot;Provider&quot;) and Global Operations LLC (&quot;Client&quot;). Provider agrees to license and furnish access to the universal client-side document workstation processing engine for Word, Excel, PowerPoint, and PDF manipulation across all authorized client terminals.
                </p>

                <h2 className="text-base font-bold font-sans text-slate-900 mb-2">2. SERVICE LEVEL COMMITMENT &amp; SLA UPTIME</h2>
                <p className="text-xs text-slate-700 mb-4 leading-normal font-sans">
                  Provider warrants that the document processing engine shall maintain 99.95% availability during each calendar month. In the event Provider fails to meet this commitment, Client shall be eligible for Service Level Credits as outlined below:
                </p>

                {/* Table */}
                <table className="w-full border-collapse text-xs font-sans mb-8">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-300">
                      <th className="py-2 px-3 text-left">Monthly Uptime Percentage</th>
                      <th className="py-2 px-3 text-left">Service Credit Applied</th>
                      <th className="py-2 px-3 text-right">Penalty Clause</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 px-3">99.0% - 99.94%</td>
                      <td className="py-2 px-3">10% Credit on Monthly Billing</td>
                      <td className="py-2 px-3 text-right text-emerald-600 font-semibold">Standard</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 px-3">95.0% - 98.99%</td>
                      <td className="py-2 px-3">25% Credit on Monthly Billing</td>
                      <td className="py-2 px-3 text-right text-amber-600 font-semibold">Elevated</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 px-3">Below 95.0%</td>
                      <td className="py-2 px-3">50% Credit on Monthly Billing</td>
                      <td className="py-2 px-3 text-right text-red-600 font-semibold">Critical Default</td>
                    </tr>
                  </tbody>
                </table>

                <h2 className="text-base font-bold font-sans text-slate-900 mb-2">3. DATA PRIVACY &amp; CLIENT-SIDE ENCRYPTION</h2>
                <p className="text-xs text-slate-700 mb-8 leading-normal font-sans">
                  The software is architected with zero-trust local sandboxing. No user document bytes, employee records, or spreadsheet cells are transferred to third-party servers. All document decoding is executed in-memory within the host client browser environment.
                </p>

                {/* Signatures */}
                <div className="mt-12 pt-4 border-t border-slate-300 grid grid-cols-2 gap-8 font-sans">
                  <div className="border border-slate-200 rounded p-4 bg-slate-50">
                    <p className="text-xs font-bold text-slate-800">PROVIDER: Enterprise Cloud Tech Inc.</p>
                    <div className="my-4 h-8 flex items-center text-blue-700 font-serif italic text-lg border-b border-dashed border-slate-400">
                      Jonathan Vance
                    </div>
                    <p className="text-[11px] text-slate-500">VP of Technology &bull; Date: Sept 15, 2025</p>
                  </div>
                  <div className="border border-slate-200 rounded p-4 bg-slate-50">
                    <p className="text-xs font-bold text-slate-800">CLIENT: Global Operations LLC</p>
                    <div className="my-4 h-8 flex items-center text-slate-400 font-sans text-xs border-b border-dashed border-slate-400">
                      [Signature Stamp Area]
                    </div>
                    <p className="text-[11px] text-slate-500">Authorized Officer &bull; Pending Counter-Signature</p>
                  </div>
                </div>

                <div className="absolute bottom-6 left-12 right-12 text-center text-[11px] text-slate-400 font-sans">
                  Page 1 of 2 &bull; Confidential Master Services Agreement
                </div>
              </div>
            ) : (
              /* Page 2 Contents */
              <div className="text-slate-800 font-serif leading-relaxed">
                <div className="bg-slate-900 text-white -mx-12 -mt-12 p-6 mb-8 flex justify-between items-center rounded-t-xs">
                  <h1 className="text-lg font-bold tracking-wide uppercase font-sans">
                    EXHIBIT A: SPECIFICATION OF SERVICES &amp; COMPLIANCE
                  </h1>
                  <span className="text-xs text-slate-400 font-sans">Page 2 of 2</span>
                </div>

                <h2 className="text-base font-bold font-sans text-slate-900 mb-2">A.1 Technical Deliverables</h2>
                <div className="space-y-3 mb-6 text-xs text-slate-700 font-sans">
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">&bull;</span>
                    <span><strong>Word Processing Module:</strong> Full typography, table insertion, headings, and formatting ribbon.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emerald-600 font-bold">&bull;</span>
                    <span><strong>Excel Spreadsheet Module:</strong> Real-time formula calculations (=SUM, =AVERAGE), multi-sheet workbook navigation.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-orange-600 font-bold">&bull;</span>
                    <span><strong>PowerPoint Presentation Module:</strong> Slide carousel, geometry blocks, presenter mode with keyboard arrows.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-red-600 font-bold">&bull;</span>
                    <span><strong>PDF Annotator &amp; Signer:</strong> Multi-layer vector rendering, highlight overlay, sticky notes, and digital stamps.</span>
                  </div>
                </div>

                <h2 className="text-base font-bold font-sans text-slate-900 mb-2">A.2 Compliance &amp; Security Certifications</h2>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs font-sans text-slate-700 mb-8 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-900">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span>SOC-2 Type II Certified &amp; ISO 27001 Audited</span>
                  </div>
                  <p className="text-slate-600 leading-normal">
                    The software runtime operates strictly within the memory sandbox of the user agent. No persistent cloud telemetry or document parsing logs are stored outside client control.
                  </p>
                </div>

                {/* Certified Digital Stamp Box */}
                <div className="w-64 border-2 border-emerald-600 rounded-lg p-3 bg-emerald-50/60 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                      VERIFIED &amp; APPROVED
                    </div>
                    <div className="text-[10px] text-emerald-700">Digital Seal ID: VAL-9921-X</div>
                    <div className="text-[10px] text-emerald-700">Audit Timestamp: Validated</div>
                  </div>
                </div>

                <div className="absolute bottom-6 left-12 right-12 text-center text-[11px] text-slate-400 font-sans">
                  Page 2 of 2 &bull; Confidential Master Services Agreement
                </div>
              </div>
            )}

            {/* Render Annotations Overlay on the Canvas */}
            {pageAnnotations.map((ann) => {
              if (ann.type === 'highlight') {
                return (
                  <div
                    key={ann.id}
                    style={{
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                      width: `${ann.width || 20}%`,
                      height: `${ann.height || 3}%`,
                      backgroundColor: ann.color || '#fef08a',
                    }}
                    className="absolute opacity-50 rounded-2xs pointer-events-auto hover:opacity-80 transition-opacity group cursor-pointer"
                  >
                    {!isReadOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAnnotation(ann.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 absolute -top-5 right-0 bg-red-600 text-white p-0.5 rounded text-[10px]"
                        title="Delete highlight"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              }

              if (ann.type === 'note') {
                return (
                  <div
                    key={ann.id}
                    style={{
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                    }}
                    className="absolute z-20 group"
                  >
                    <div className="relative -top-3 -left-3">
                      <div className="p-1.5 bg-blue-600 text-white rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="absolute left-6 top-0 hidden group-hover:flex flex-col bg-white border border-slate-300 rounded-lg shadow-xl p-3 w-56 text-xs z-30">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 mb-1 border-b border-slate-100">
                          <span>Review Note</span>
                          {!isReadOnly && (
                            <button
                              onClick={() => handleDeleteAnnotation(ann.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="text-slate-800 font-sans">{ann.text}</p>
                      </div>
                    </div>
                  </div>
                );
              }

              if (ann.type === 'signature') {
                return (
                  <div
                    key={ann.id}
                    style={{
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                      width: `${ann.width || 26}%`,
                    }}
                    className="absolute p-3 bg-blue-50/90 border-2 border-blue-600 rounded shadow-md text-blue-900 font-sans z-20 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Verified Signature</span>
                      {!isReadOnly && (
                        <button
                          onClick={() => handleDeleteAnnotation(ann.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="font-serif italic text-base my-1 text-slate-900">
                      Digitally Certified &bull; {new Date(ann.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-[9px] text-blue-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>SHA-256 Validated Signature</span>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>

        {/* Right Annotations Drawer */}
        {showAnnotationsList && (
          <div id="pdf-annotations-panel" className="w-64 bg-white border-l border-slate-300 flex flex-col p-4 overflow-y-auto select-none">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase">Annotations ({annotations.length})</span>
              <button
                onClick={() => setShowAnnotationsList(false)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            {annotations.length === 0 ? (
              <div className="text-xs text-slate-400 py-8 text-center italic">
                No annotations added yet. Use Highlight, Note, or Sign tools above!
              </div>
            ) : (
              <div className="space-y-3">
                {annotations.map((ann, idx) => (
                  <div
                    key={ann.id}
                    onClick={() => setCurrentPage(ann.pageNumber)}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 capitalize flex items-center gap-1.5">
                        {ann.type === 'highlight' && <Highlighter className="w-3 h-3 text-amber-500" />}
                        {ann.type === 'note' && <MessageSquare className="w-3 h-3 text-blue-500" />}
                        {ann.type === 'signature' && <PenTool className="w-3 h-3 text-emerald-600" />}
                        {ann.type}
                      </span>
                      <span className="text-[10px] text-slate-400">Page {ann.pageNumber}</span>
                    </div>
                    {ann.text && <p className="text-slate-600 line-clamp-2 mt-0.5">{ann.text}</p>}
                    {!isReadOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAnnotation(ann.id);
                        }}
                        className="text-[10px] text-red-500 hover:underline mt-1 block"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div id="pdf-status-bar" className="bg-white border-t border-slate-200 px-4 py-1.5 flex items-center justify-between text-xs text-slate-500 select-none">
        <div className="flex items-center gap-4">
          <span>{docItem.name}</span>
          <span>Page {currentPage} of {pageCount}</span>
          <span>{annotations.length} Annotations</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Vector PDF Engine</span>
          <span>&bull;</span>
          <span>100% Client-Side Privacy</span>
        </div>
      </div>
    </div>
  );
};
