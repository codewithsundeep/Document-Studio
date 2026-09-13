import React, { useState, useRef } from 'react';
import {
  FileText,
  Sheet,
  Presentation,
  FileCode,
  Plus,
  Upload,
  FolderOpen,
  LayoutGrid,
  Check,
  Edit2,
  X,
  Eye,
  Edit3,
  ChevronDown,
  Sparkles,
  Smartphone,
  Share2,
  RefreshCw,
  CloudOff,
  Save,
  HardDrive,
} from 'lucide-react';
import { DocumentItem, DocumentType } from '../../types';

interface HeaderProps {
  documents: DocumentItem[];
  activeDocumentId: string;
  onSelectDocument: (id: string) => void;
  onCloseDocument: (id: string) => void;
  onRenameDocument: (id: string, newName: string) => void;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenGallery: () => void;
  onNewDocument: (type: DocumentType) => void;
  isReadOnly: boolean;
  onToggleReadOnly: () => void;
  onOpenAndroidGuide: () => void;
  onOpenShare: () => void;
  autoSaveStatus: 'saved' | 'saving' | 'error' | 'disabled';
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
  onManualSave: () => void;
  lastSavedAt: number | null;
}

export const Header: React.FC<HeaderProps> = ({
  documents,
  activeDocumentId,
  onSelectDocument,
  onCloseDocument,
  onRenameDocument,
  onUploadFile,
  onOpenGallery,
  onNewDocument,
  isReadOnly,
  onToggleReadOnly,
  onOpenAndroidGuide,
  onOpenShare,
  autoSaveStatus,
  autoSaveEnabled,
  onToggleAutoSave,
  onManualSave,
  lastSavedAt,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editedTitle, setEditedTitle] = useState<string>('');
  const [showNewMenu, setShowNewMenu] = useState<boolean>(false);
  const [showAutoSaveMenu, setShowAutoSaveMenu] = useState<boolean>(false);

  const activeDoc = documents.find((d) => d.id === activeDocumentId) || documents[0];

  const handleStartRename = () => {
    if (!activeDoc) return;
    setEditedTitle(activeDoc.name);
    setIsEditingTitle(true);
  };

  const handleSaveRename = () => {
    if (activeDoc && editedTitle.trim()) {
      onRenameDocument(activeDoc.id, editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const getDocIcon = (type: DocumentType, className = 'w-4 h-4') => {
    switch (type) {
      case 'word':
        return <FileText className={`${className} text-blue-600`} />;
      case 'excel':
        return <Sheet className={`${className} text-emerald-600`} />;
      case 'powerpoint':
        return <Presentation className={`${className} text-orange-600`} />;
      case 'pdf':
        return <FileCode className={`${className} text-red-600`} />;
    }
  };

  const getTypeBadge = (type: DocumentType) => {
    switch (type) {
      case 'word':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">WORD</span>;
      case 'excel':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">EXCEL</span>;
      case 'powerpoint':
        return <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-1.5 py-0.5 rounded">POWERPOINT</span>;
      case 'pdf':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.5 rounded">PDF</span>;
    }
  };

  return (
    <header id="main-app-header" className="bg-white border-b border-slate-200 select-none">
      {/* Upper Navigation & Brand Tier */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100 gap-4">
        {/* Logo & App Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 via-emerald-600 to-orange-500 flex items-center justify-center text-white shadow-xs">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm tracking-tight">Document Studio</span>
              <span className="text-[10px] uppercase font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                Universal Suite
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Word &bull; Excel &bull; PowerPoint &bull; PDF</p>
          </div>
        </div>

        {/* Active Document Title Editor and AutoSave status */}
        {activeDoc && (
          <div className="flex items-center gap-2 max-w-md mx-auto">
            {getTypeBadge(activeDoc.type)}
            {isEditingTitle ? (
              <div className="flex items-center gap-1">
                <input
                  id="rename-document-input"
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  autoFocus
                  className="px-2 py-0.5 text-xs font-semibold bg-slate-50 border border-blue-400 rounded focus:outline-hidden text-slate-800"
                />
                <button
                  onClick={handleSaveRename}
                  className="p-1 hover:bg-emerald-50 text-emerald-600 rounded"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="p-1 hover:bg-red-50 text-red-600 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={handleStartRename}
                className="group flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-100 cursor-pointer transition-colors"
                title="Click to rename document"
              >
                <span className="text-xs font-semibold text-slate-800 truncate max-w-[160px] sm:max-w-[200px]">
                  {activeDoc.name}
                </span>
                <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}

            {/* AutoSave Status Badge with Dropdown Settings */}
            <div className="relative">
              <button
                id="header-autosave-indicator-btn"
                onClick={() => setShowAutoSaveMenu(!showAutoSaveMenu)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all border ${
                  autoSaveStatus === 'saving'
                    ? 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse'
                    : !autoSaveEnabled || autoSaveStatus === 'disabled'
                    ? 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                    : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-800 hover:bg-emerald-100'
                }`}
                title="Auto-save status & settings"
              >
                {autoSaveStatus === 'saving' ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                    <span className="hidden md:inline text-[11px]">Saving...</span>
                  </>
                ) : !autoSaveEnabled || autoSaveStatus === 'disabled' ? (
                  <>
                    <CloudOff className="w-3 h-3 text-slate-400" />
                    <span className="hidden md:inline text-[11px]">Auto-save Off</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                    <span className="hidden md:inline text-[11px]">Saved</span>
                  </>
                )}
                <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-0.5" />
              </button>

              {showAutoSaveMenu && (
                <div
                  id="autosave-settings-popover"
                  className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-800"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Auto-Save Protection</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        autoSaveEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {autoSaveEnabled ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                    Edits automatically sync locally to your device storage in real-time.
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="text-xs font-medium text-slate-700">Auto-Save edits</span>
                      <button
                        id="autosave-toggle-switch"
                        onClick={onToggleAutoSave}
                        className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                          autoSaveEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <div className="bg-white w-4 h-4 rounded-full shadow-xs" />
                      </button>
                    </div>

                    <button
                      id="autosave-manual-save-btn"
                      onClick={() => {
                        onManualSave();
                        setShowAutoSaveMenu(false);
                      }}
                      className="w-full py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-between transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <Save className="w-3.5 h-3.5 text-slate-300" />
                        <span>Save Now</span>
                      </div>
                      <kbd className="text-[10px] bg-slate-700 text-slate-300 px-1 py-0.5 rounded font-mono">
                        Ctrl+S
                      </kbd>
                    </button>
                  </div>

                  {lastSavedAt && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Last saved:</span>
                      <span className="font-mono text-slate-600">{new Date(lastSavedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* Hidden File Input for Uploading */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.doc,.xlsx,.xls,.csv,.tsv,.pptx,.ppt,.pdf,.txt,.md,.html"
            onChange={onUploadFile}
            className="hidden"
          />

          {/* Share Document Button */}
          <button
            id="header-share-doc-btn"
            onClick={onOpenShare}
            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-200 shadow-2xs"
            title="Share document to WhatsApp, Gmail, Drive, or Nearby Apps"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Android App & Default Viewer Guide */}
          <button
            id="header-android-app-btn"
            onClick={onOpenAndroidGuide}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-200 shadow-2xs"
            title="Install Android App & Set as Default Document Opener"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Android App</span>
          </button>

          {/* Open / Upload Button */}
          <button
            id="header-open-file-btn"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Upload any Word, Excel, PowerPoint, or PDF file"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Open File</span>
          </button>

          {/* Sample Templates Gallery Button */}
          <button
            id="header-sample-gallery-btn"
            onClick={onOpenGallery}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Open Sample Documents & Templates"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Templates</span>
          </button>

          {/* New Document Dropdown */}
          <div className="relative">
            <button
              id="header-new-doc-btn"
              onClick={() => setShowNewMenu(!showNewMenu)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium flex items-center gap-1 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
            </button>
            {showNewMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 w-52 z-40">
                <button
                  onClick={() => {
                    onNewDocument('word');
                    setShowNewMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-blue-50 flex items-center gap-2.5 text-slate-700 font-medium"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Word Document (.docx)</span>
                </button>
                <button
                  onClick={() => {
                    onNewDocument('excel');
                    setShowNewMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-emerald-50 flex items-center gap-2.5 text-slate-700 font-medium"
                >
                  <Sheet className="w-4 h-4 text-emerald-600" />
                  <span>Excel Spreadsheet (.xlsx)</span>
                </button>
                <button
                  onClick={() => {
                    onNewDocument('powerpoint');
                    setShowNewMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-orange-50 flex items-center gap-2.5 text-slate-700 font-medium"
                >
                  <Presentation className="w-4 h-4 text-orange-600" />
                  <span>PowerPoint Slides (.pptx)</span>
                </button>
                <button
                  onClick={() => {
                    onNewDocument('pdf');
                    setShowNewMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-red-50 flex items-center gap-2.5 text-slate-700 font-medium"
                >
                  <FileCode className="w-4 h-4 text-red-600" />
                  <span>PDF Document (.pdf)</span>
                </button>
              </div>
            )}
          </div>

          {/* Mode Toggle: Viewing vs Editing */}
          <button
            id="header-toggle-mode-btn"
            onClick={onToggleReadOnly}
            className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${
              isReadOnly ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title={isReadOnly ? 'Switch to Edit Mode' : 'Switch to Read-Only Viewer'}
          >
            {isReadOnly ? <Eye className="w-4 h-4 text-amber-700" /> : <Edit3 className="w-4 h-4 text-slate-700" />}
            <span className="hidden md:inline text-[11px] font-semibold">{isReadOnly ? 'Viewing' : 'Editing'}</span>
          </button>
        </div>
      </div>

      {/* Document Tabs Bar */}
      <div id="document-tabs-bar" className="flex items-center px-4 bg-slate-50 border-b border-slate-200 overflow-x-auto select-none">
        <div className="flex items-center gap-1 py-1">
          {documents.map((doc) => {
            const isActive = doc.id === activeDocumentId;
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc.id)}
                className={`group px-3 py-1.5 rounded-t-md text-xs flex items-center gap-2 cursor-pointer border transition-all ${
                  isActive
                    ? 'bg-white border-slate-300 border-b-white text-slate-900 font-semibold shadow-2xs -mb-px z-10'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/80'
                }`}
              >
                {getDocIcon(doc.type)}
                <span className="truncate max-w-[140px]">{doc.name}</span>
                {documents.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseDocument(doc.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-opacity"
                    title="Close tab"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
};
