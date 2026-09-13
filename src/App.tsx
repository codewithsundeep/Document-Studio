/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentItem,
  DocumentType,
  WordDocItem,
  ExcelDocItem,
  PowerPointDocItem,
  PDFDocItem,
  CustomFontItem,
} from './types';
import { getInitialDocuments } from './data/sampleDocuments';
import { Header } from './components/common/Header';
import { DocumentGalleryModal } from './components/common/DocumentGalleryModal';
import { AndroidDefaultViewerModal } from './components/common/AndroidDefaultViewerModal';
import { ShareModal } from './components/common/ShareModal';
import { FontManagerModal } from './components/common/FontManagerModal';
import { WordEditor } from './components/word/WordEditor';
import { ExcelEditor } from './components/excel/ExcelEditor';
import { PowerPointEditor } from './components/powerpoint/PowerPointEditor';
import { PdfViewer } from './components/pdf/PdfViewer';
import {
  detectDocumentType,
  formatFileSize,
  parseExcelFile,
  parseWordFile,
  parsePowerPointFile,
} from './utils/fileHelpers';
import { loadDocumentsFromDb, saveDocumentsToDb, loadSettingFromDb, saveSettingToDb } from './utils/indexedDbStorage';
import { initializeInstalledFonts, installFontFromFile } from './utils/fontManager';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Upload, FileText, Smartphone, Download, Check, Sparkles, WifiOff, X } from 'lucide-react';

const STORAGE_KEY = 'universal_document_studio_docs';

export default function App() {
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not load cached documents from localStorage:', err);
    }
    return getInitialDocuments();
  });

  const [activeDocumentId, setActiveDocumentId] = useState<string>(() => {
    return documents[0]?.id || 'doc-word-sample';
  });

  const [customFonts, setCustomFonts] = useState<CustomFontItem[]>([]);
  const [isFontManagerOpen, setIsFontManagerOpen] = useState<boolean>(false);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [showMobileBanner, setShowMobileBanner] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Auto-Save Management State
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('universal_docs_autosave_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | 'disabled'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(Date.now());
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Load from IndexedDB (High Storage) and initialize fonts on startup
  useEffect(() => {
    const initStorageAndFonts = async () => {
      try {
        const dbDocs = await loadDocumentsFromDb();
        if (dbDocs && dbDocs.length > 0) {
          setDocuments(dbDocs);
          if (!dbDocs.some((d) => d.id === activeDocumentId)) {
            setActiveDocumentId(dbDocs[0].id);
          }
        } else {
          // Seed database with initial documents
          await saveDocumentsToDb(getInitialDocuments());
        }

        const savedAutoSave = await loadSettingFromDb<boolean>('autosave_enabled', true);
        if (savedAutoSave !== undefined && savedAutoSave !== null) {
          setAutoSaveEnabled(savedAutoSave);
        }
      } catch (err) {
        console.warn('IndexedDB initialization notice:', err);
      }

      try {
        const loadedFonts = await initializeInstalledFonts();
        setCustomFonts(loadedFonts);
      } catch (err) {
        console.warn('Custom font load notice:', err);
      }
    };

    initStorageAndFonts();
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save documents logic: writes to IndexedDB for high-capacity local storage
  const saveDocumentsToStorage = useCallback(async (docsToSave: DocumentItem[]) => {
    try {
      setAutoSaveStatus('saving');
      // Save all documents, images, and binary attachments in high-capacity IndexedDB
      await saveDocumentsToDb(docsToSave);

      // Best-effort lightweight sync to localStorage
      try {
        const serializableDocs = docsToSave.map((doc) => {
          if (doc.type === 'pdf') {
            return {
              ...doc,
              data: {
                ...doc.data,
                pdfDataBuffer: undefined,
              },
            };
          }
          return doc;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableDocs));
      } catch {
        // Expected if local storage quota exceeded
      }

      setAutoSaveStatus('saved');
      setLastSavedAt(Date.now());
    } catch (err) {
      console.warn('Could not save documents to IndexedDB:', err);
      setAutoSaveStatus('error');
    }
  }, []);

  // Debounced auto-save triggered when documents change
  useEffect(() => {
    if (!autoSaveEnabled) {
      setAutoSaveStatus('disabled');
      return;
    }

    setAutoSaveStatus('saving');
    const timer = setTimeout(() => {
      saveDocumentsToStorage(documents);
    }, 600);

    return () => clearTimeout(timer);
  }, [documents, autoSaveEnabled, saveDocumentsToStorage]);

  // Toggle Auto-save handler
  const handleToggleAutoSave = async () => {
    const nextVal = !autoSaveEnabled;
    setAutoSaveEnabled(nextVal);
    await saveSettingToDb('autosave_enabled', nextVal);
    try {
      localStorage.setItem('universal_docs_autosave_enabled', JSON.stringify(nextVal));
    } catch (err) {
      console.warn(err);
    }
    if (!nextVal) {
      setAutoSaveStatus('disabled');
    } else {
      saveDocumentsToStorage(documents);
    }
  };

  // Manual save handler (Save Now / Ctrl+S)
  const handleManualSave = useCallback(() => {
    saveDocumentsToStorage(documents);
    setSaveToast('All changes saved to IndexedDB storage!');
    setTimeout(() => setSaveToast(null), 3000);
  }, [documents, saveDocumentsToStorage]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave]);

  const activeDocument = documents.find((d) => d.id === activeDocumentId) || documents[0];

  // Update a document in the state
  const handleUpdateDocument = (updatedDoc: DocumentItem) => {
    setDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
  };

  // Close a document tab
  const handleCloseDocument = (id: string) => {
    if (documents.length <= 1) return;
    const nextDocs = documents.filter((d) => d.id !== id);
    setDocuments(nextDocs);
    if (activeDocumentId === id) {
      setActiveDocumentId(nextDocs[0].id);
    }
  };

  // Rename a document
  const handleRenameDocument = (id: string, newName: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name: newName, lastModified: Date.now() } : d))
    );
  };

  // Create a new blank document
  const handleNewDocument = (type: DocumentType) => {
    const id = `doc-${type}-${Date.now()}`;
    let newDoc: DocumentItem;

    switch (type) {
      case 'word':
        newDoc = {
          id,
          name: `Untitled_Document_${documents.length + 1}.docx`,
          type: 'word',
          lastModified: Date.now(),
          fileSize: '12 KB',
          data: {
            htmlContent: '<h1>Untitled Document</h1><p>Start writing your document here...</p>',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '15px',
            pageOrientation: 'portrait',
            pageSize: 'a4',
            lineSpacing: '1.15',
          },
        };
        break;

      case 'excel':
        newDoc = {
          id,
          name: `Untitled_Spreadsheet_${documents.length + 1}.xlsx`,
          type: 'excel',
          lastModified: Date.now(),
          fileSize: '16 KB',
          data: {
            sheets: [
              {
                id: `sheet-${Date.now()}`,
                name: 'Sheet1',
                data: {
                  A1: { raw: 'Item', bold: true, bg: '#f1f5f9' },
                  B1: { raw: 'Quantity', bold: true, bg: '#f1f5f9', align: 'right' },
                  C1: { raw: 'Price', bold: true, bg: '#f1f5f9', align: 'right' },
                  D1: { raw: 'Total', bold: true, bg: '#f1f5f9', align: 'right' },
                  A2: { raw: 'Standard Unit' },
                  B2: { raw: '10', align: 'right', format: 'number' },
                  C2: { raw: '25.50', align: 'right', format: 'currency' },
                  D2: { raw: '=B2*C2', align: 'right', format: 'currency', bold: true },
                },
                rowCount: 25,
                colCount: 12,
              },
            ],
            activeSheetIndex: 0,
          },
        };
        break;

      case 'powerpoint':
        newDoc = {
          id,
          name: `Untitled_Presentation_${documents.length + 1}.pptx`,
          type: 'powerpoint',
          lastModified: Date.now(),
          fileSize: '24 KB',
          data: {
            aspectRatio: '16:9',
            activeSlideIndex: 0,
            slides: [
              {
                id: `slide-${Date.now()}`,
                title: 'Title Slide',
                bgColor: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                textColor: '#ffffff',
                notes: 'Welcome and introduction',
                elements: [
                  {
                    id: `el-title-${Date.now()}`,
                    type: 'title',
                    x: 8,
                    y: 25,
                    width: 84,
                    height: 20,
                    content: 'New Presentation Deck',
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
                    content: 'Presented by Your Organization &bull; 2025',
                    fontSize: 16,
                    fontColor: '#94a3b8',
                    align: 'left',
                  },
                ],
              },
            ],
          },
        };
        break;

      case 'pdf':
        newDoc = {
          id,
          name: `Untitled_Document_${documents.length + 1}.pdf`,
          type: 'pdf',
          lastModified: Date.now(),
          fileSize: '84 KB',
          data: {
            fileName: `Untitled_Document_${documents.length + 1}.pdf`,
            pageCount: 2,
            currentPage: 1,
            scale: 1.0,
            rotation: 0,
            annotations: [],
          },
        };
        break;
    }

    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocumentId(newDoc.id);
  };

  // Handle uploaded files (also called when phone opens file via Android launch queue)
  const processUploadedFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    // 1. Direct font installation if user uploads a font file (.ttf, .otf, .woff, .woff2)
    if (['ttf', 'otf', 'woff', 'woff2'].includes(ext || '')) {
      try {
        const newFont = await installFontFromFile(file);
        setCustomFonts((prev) => [...prev.filter((f) => f.id !== newFont.id), newFont]);
        setIsFontManagerOpen(true);
        setSaveToast(`Font "${newFont.name}" installed locally to IndexedDB!`);
        setTimeout(() => setSaveToast(null), 4000);
        return;
      } catch (err: any) {
        alert(err.message || `Failed to install font "${file.name}"`);
        return;
      }
    }

    const docType = detectDocumentType(file.name);
    if (!docType) {
      alert(`Unsupported file format for "${file.name}". Supported formats include .docx, .doc, .odt, .rtf, .xlsx, .xls, .ods, .csv, .tsv, .pptx, .ppt, .odp, .pdf, and fonts (.ttf, .otf, .woff, .woff2).`);
      return;
    }

    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const sizeStr = formatFileSize(file.size);

    try {
      if (docType === 'word') {
        const wordData = await parseWordFile(file);
        const newDoc: WordDocItem = {
          id,
          name: file.name,
          type: 'word',
          lastModified: Date.now(),
          fileSize: sizeStr,
          data: wordData,
        };
        setDocuments((prev) => [newDoc, ...prev]);
        setActiveDocumentId(id);
      } else if (docType === 'excel') {
        const excelData = await parseExcelFile(file);
        const newDoc: ExcelDocItem = {
          id,
          name: file.name,
          type: 'excel',
          lastModified: Date.now(),
          fileSize: sizeStr,
          data: excelData,
        };
        setDocuments((prev) => [newDoc, ...prev]);
        setActiveDocumentId(id);
      } else if (docType === 'pdf') {
        const buffer = await file.arrayBuffer();
        const newDoc: PDFDocItem = {
          id,
          name: file.name,
          type: 'pdf',
          lastModified: Date.now(),
          fileSize: sizeStr,
          data: {
            fileName: file.name,
            pageCount: 1,
            currentPage: 1,
            scale: 1.0,
            rotation: 0,
            annotations: [],
            pdfDataBuffer: new Uint8Array(buffer),
          },
        };
        setDocuments((prev) => [newDoc, ...prev]);
        setActiveDocumentId(id);
      } else if (docType === 'powerpoint') {
        const pptData = await parsePowerPointFile(file);
        const newDoc: PowerPointDocItem = {
          id,
          name: file.name,
          type: 'powerpoint',
          lastModified: Date.now(),
          fileSize: sizeStr,
          data: pptData,
        };
        setDocuments((prev) => [newDoc, ...prev]);
        setActiveDocumentId(id);
      }
      setSaveToast(`Opened "${file.name}" & saved to IndexedDB`);
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err) {
      console.error('Failed to parse document:', err);
      alert(`Could not parse ${file.name}. Please ensure it is a valid document.`);
    }
  }, []);

  // Quick font application to the currently active document
  const handleApplyFontToActiveDoc = (fontFamily: string) => {
    if (!activeDocument) return;
    if (activeDocument.type === 'word') {
      const updated = {
        ...activeDocument,
        data: {
          ...activeDocument.data,
          fontFamily,
        },
      } as WordDocItem;
      handleUpdateDocument(updated);
    } else if (activeDocument.type === 'excel') {
      const activeIdx = activeDocument.data.activeSheetIndex || 0;
      const sheet = activeDocument.data.sheets[activeIdx];
      if (sheet) {
        const updatedCells = { ...sheet.data };
        Object.keys(updatedCells).forEach((k) => {
          updatedCells[k] = { ...updatedCells[k], fontFamily };
        });
        const updatedSheets = [...activeDocument.data.sheets];
        updatedSheets[activeIdx] = { ...sheet, data: updatedCells };
        handleUpdateDocument({
          ...activeDocument,
          data: { ...activeDocument.data, sheets: updatedSheets },
        } as ExcelDocItem);
      }
    } else if (activeDocument.type === 'powerpoint') {
      const activeIdx = activeDocument.data.activeSlideIndex || 0;
      const slide = activeDocument.data.slides[activeIdx];
      if (slide) {
        const updatedElements = slide.elements.map((el) => ({ ...el, fontFamily }));
        const updatedSlides = [...activeDocument.data.slides];
        updatedSlides[activeIdx] = { ...slide, elements: updatedElements };
        handleUpdateDocument({
          ...activeDocument,
          data: { ...activeDocument.data, slides: updatedSlides },
        } as PowerPointDocItem);
      }
    }
    setSaveToast(`Applied font "${fontFamily}" to active document`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // PWA Install and Android Launch Queue integration
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall(processUploadedFile);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processUploadedFile(files[0]);
    }
    e.target.value = '';
  };

  // Drag & drop handlers on full window
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      id="app-root-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900"
    >
      {/* Mobile / Android Setup Notification Banner */}
      {!isInstalled && showMobileBanner && (
        <div
          id="android-pwa-mobile-banner"
          className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between gap-2 border-b border-slate-800 shrink-0"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Smartphone className="w-3 h-3" />
            </div>
            <span className="truncate">
              <strong>Android Document App:</strong> Install on your phone &amp; make default opener for Word, Excel, PPT &amp; PDF!
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isInstallable ? (
              <button
                onClick={install}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] flex items-center gap-1 transition-colors shadow-xs"
              >
                <Download className="w-3 h-3" />
                <span>Install</span>
              </button>
            ) : null}
            <button
              onClick={() => setIsAndroidModalOpen(true)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded text-[11px] border border-slate-700 transition-colors"
            >
              Default Setup Guide
            </button>
            <button
              onClick={() => setShowMobileBanner(false)}
              className="text-slate-400 hover:text-white p-0.5"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* App Header & Navigation */}
      <Header
        documents={documents}
        activeDocumentId={activeDocumentId}
        onSelectDocument={(id) => setActiveDocumentId(id)}
        onCloseDocument={handleCloseDocument}
        onRenameDocument={handleRenameDocument}
        onUploadFile={handleFileInputChange}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onNewDocument={handleNewDocument}
        isReadOnly={isReadOnly}
        onToggleReadOnly={() => setIsReadOnly(!isReadOnly)}
        onOpenAndroidGuide={() => setIsAndroidModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenFontManager={() => setIsFontManagerOpen(true)}
        customFontsCount={customFonts.length}
        autoSaveStatus={autoSaveStatus}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={handleToggleAutoSave}
        onManualSave={handleManualSave}
        lastSavedAt={lastSavedAt}
      />

      {/* Main Specialized Document Viewport */}
      <main id="main-editor-area" className="flex-1 overflow-hidden relative">
        {activeDocument ? (
          <>
            {activeDocument.type === 'word' && (
              <WordEditor
                key={activeDocument.id}
                document={activeDocument as WordDocItem}
                onChange={handleUpdateDocument}
                isReadOnly={isReadOnly}
                customFonts={customFonts}
                onOpenFontManager={() => setIsFontManagerOpen(true)}
              />
            )}

            {activeDocument.type === 'excel' && (
              <ExcelEditor
                key={activeDocument.id}
                document={activeDocument as ExcelDocItem}
                onChange={handleUpdateDocument}
                isReadOnly={isReadOnly}
                customFonts={customFonts}
                onOpenFontManager={() => setIsFontManagerOpen(true)}
              />
            )}

            {activeDocument.type === 'powerpoint' && (
              <PowerPointEditor
                key={activeDocument.id}
                document={activeDocument as PowerPointDocItem}
                onChange={handleUpdateDocument}
                isReadOnly={isReadOnly}
                customFonts={customFonts}
                onOpenFontManager={() => setIsFontManagerOpen(true)}
              />
            )}

            {activeDocument.type === 'pdf' && (
              <PdfViewer
                key={activeDocument.id}
                document={activeDocument as PDFDocItem}
                onChange={handleUpdateDocument}
                isReadOnly={isReadOnly}
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <FileText className="w-12 h-12 stroke-1" />
            <p className="text-sm font-medium">No document selected</p>
            <button
              onClick={() => setIsGalleryOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
            >
              Open Documents Hub
            </button>
          </div>
        )}
      </main>

      {/* Offline Indicator Toast */}
      {!isOnline && (
        <div
          id="offline-indicator-toast"
          className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg animate-pulse"
        >
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode — All documents process locally in your phone&apos;s memory.</span>
        </div>
      )}

      {/* Universal Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div
          id="drag-drop-overlay"
          className="fixed inset-0 z-50 bg-blue-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white border-4 border-dashed border-blue-300 pointer-events-none"
        >
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4 animate-bounce">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Drop Document to Open</h2>
          <p className="text-sm text-blue-200 mt-2 max-w-sm text-center">
            Instantly opens Word (.docx), Excel (.xlsx, .csv), PowerPoint (.pptx), or PDF (.pdf) files in your browser.
          </p>
        </div>
      )}

      {/* Documents and Templates Gallery Modal */}
      <DocumentGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onOpenDocument={(doc) => {
          if (!documents.some((d) => d.id === doc.id)) {
            setDocuments((prev) => [doc, ...prev]);
          }
          setActiveDocumentId(doc.id);
        }}
        onNewDocument={handleNewDocument}
        onUploadFile={handleFileInputChange}
      />

      {/* Android Default Document Viewer & Installation Modal */}
      <AndroidDefaultViewerModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onInstall={install}
      />

      {/* Document Sharing Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        document={activeDocument}
      />

      {/* Font Manager & Local Storage Modal */}
      <FontManagerModal
        isOpen={isFontManagerOpen}
        onClose={() => setIsFontManagerOpen(false)}
        customFonts={customFonts}
        onFontsUpdated={(updated) => setCustomFonts(updated)}
        onSelectFontForActiveDoc={(fontFamily) => handleApplyFontToActiveDoc(fontFamily)}
      />

      {/* Manual Save Notification Toast */}
      {saveToast && (
        <div
          id="save-success-toast"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900/95 backdrop-blur-xs border border-slate-700 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-3 h-3 stroke-[2.5]" />
          </div>
          <span>{saveToast}</span>
        </div>
      )}
    </div>
  );
}
