import React, { useRef } from 'react';
import {
  FileText,
  Sheet,
  Presentation,
  FileCode,
  Upload,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DocumentItem, DocumentType } from '../../types';
import { getInitialDocuments } from '../../data/sampleDocuments';

interface DocumentGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDocument: (doc: DocumentItem) => void;
  onNewDocument: (type: DocumentType) => void;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DocumentGalleryModal: React.FC<DocumentGalleryModalProps> = ({
  isOpen,
  onClose,
  onOpenDocument,
  onNewDocument,
  onUploadFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sampleDocs = getInitialDocuments();

  if (!isOpen) return null;

  return (
    <div id="gallery-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="gallery-modal-content"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Document Workspace Hub</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Open sample files, create fresh templates, or import your local files.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Universal Drag & Drop Upload Bar */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.doc,.xlsx,.xls,.csv,.tsv,.pptx,.ppt,.pdf,.txt,.md,.html"
            onChange={(e) => {
              onUploadFile(e);
              onClose();
            }}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 rounded-xl p-6 text-center cursor-pointer transition-colors group"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Drag &amp; Drop or Browse Files from Your Computer
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Supports Microsoft Word (.docx), Excel (.xlsx, .csv), PowerPoint (.pptx), PDF (.pdf), and Rich Text.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">.DOCX</span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">.XLSX</span>
              <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">.PPTX</span>
              <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">.PDF</span>
              <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">.CSV</span>
            </div>
          </div>

          {/* Quick Create New Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Create Fresh Blank Document
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => {
                  onNewDocument('word');
                  onClose();
                }}
                className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 flex flex-col items-center text-center gap-2 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Word Doc</div>
                  <div className="text-[10px] text-slate-500">Document Editor</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onNewDocument('excel');
                  onClose();
                }}
                className="p-3 rounded-lg border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/50 flex flex-col items-center text-center gap-2 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Excel Sheet</div>
                  <div className="text-[10px] text-slate-500">Spreadsheet Grid</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onNewDocument('powerpoint');
                  onClose();
                }}
                className="p-3 rounded-lg border border-slate-200 hover:border-orange-400 bg-white hover:bg-orange-50/50 flex flex-col items-center text-center gap-2 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Presentation className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">PowerPoint</div>
                  <div className="text-[10px] text-slate-500">Slide Deck Studio</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onNewDocument('pdf');
                  onClose();
                }}
                className="p-3 rounded-lg border border-slate-200 hover:border-red-400 bg-white hover:bg-red-50/50 flex flex-col items-center text-center gap-2 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">PDF Reader</div>
                  <div className="text-[10px] text-slate-500">Markup &amp; Signer</div>
                </div>
              </button>
            </div>
          </div>

          {/* Sample Documents Pre-loaded Gallery */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Explore Pre-Built Enterprise Samples
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sampleDocs.map((sample) => {
                let badgeColor = 'bg-blue-100 text-blue-800';
                let Icon = FileText;
                let desc = 'Executive roadmap with headings, tables, and approvals.';

                if (sample.type === 'excel') {
                  badgeColor = 'bg-emerald-100 text-emerald-800';
                  Icon = Sheet;
                  desc = 'Operating budget with live =SUM, =AVG formulas and revenue models.';
                } else if (sample.type === 'powerpoint') {
                  badgeColor = 'bg-orange-100 text-orange-800';
                  Icon = Presentation;
                  desc = 'Interactive 6-slide deck with metrics, themes, and presenter view.';
                } else if (sample.type === 'pdf') {
                  badgeColor = 'bg-red-100 text-red-800';
                  Icon = FileCode;
                  desc = '2-page confidential Master Services Agreement with highlights and sign block.';
                }

                return (
                  <div
                    key={sample.id}
                    onClick={() => {
                      onOpenDocument(sample);
                      onClose();
                    }}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-white cursor-pointer transition-all flex items-start gap-3 shadow-2xs group"
                  >
                    <div className="p-2 rounded-lg bg-white border border-slate-200 group-hover:scale-105 transition-transform shadow-xs">
                      <Icon className="w-6 h-6 text-slate-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${badgeColor}`}>
                          {sample.type}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">{sample.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors ml-auto self-center" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Private &amp; Secure &bull; All processing executes locally in your browser</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
