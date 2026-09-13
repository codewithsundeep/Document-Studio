import React, { useState, useEffect } from 'react';
import {
  Type,
  Upload,
  Globe,
  Trash2,
  Check,
  Plus,
  HardDrive,
  Database,
  Sparkles,
  ExternalLink,
  X,
  AlertCircle,
  FileCode,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { CustomFontItem, StorageUsageInfo } from '../../types';
import {
  CURATED_WEB_FONTS,
  STANDARD_FONTS,
  installFontFromUrl,
  installFontFromFile,
  uninstallCustomFont,
  applyFontToDocument,
} from '../../utils/fontManager';
import { getStorageUsageEstimate } from '../../utils/indexedDbStorage';

interface FontManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customFonts: CustomFontItem[];
  onFontsUpdated: (fonts: CustomFontItem[]) => void;
  onSelectFontForActiveDoc?: (fontFamily: string) => void;
}

export const FontManagerModal: React.FC<FontManagerModalProps> = ({
  isOpen,
  onClose,
  customFonts,
  onFontsUpdated,
  onSelectFontForActiveDoc,
}) => {
  const [activeTab, setActiveTab] = useState<'installed' | 'url' | 'upload' | 'storage'>('installed');
  const [urlInput, setUrlInput] = useState('');
  const [urlFontName, setUrlFontName] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [installSuccess, setInstallSuccess] = useState<string | null>(null);

  // Upload state
  const [dragActive, setDragActive] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadedFontName, setUploadedFontName] = useState('');

  // Live preview tester string
  const [samplePreviewText, setSamplePreviewText] = useState(
    'The quick brown fox jumps over the lazy dog & 1234567890'
  );

  // Storage telemetry
  const [storageInfo, setStorageInfo] = useState<StorageUsageInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStorageData();
    }
  }, [isOpen, customFonts]);

  const loadStorageData = async () => {
    const info = await getStorageUsageEstimate();
    setStorageInfo(info);
  };

  if (!isOpen) return null;

  // Install from Web / Google Fonts URL
  const handleInstallFromUrl = async (urlToUse?: string, nameToUse?: string) => {
    const finalUrl = urlToUse || urlInput;
    const finalName = nameToUse || urlFontName;

    if (!finalUrl.trim()) {
      setInstallError('Please enter a Google Fonts or CSS font URL');
      return;
    }

    setIsInstalling(true);
    setInstallError(null);
    setInstallSuccess(null);

    try {
      const newFont = await installFontFromUrl(finalUrl, finalName);
      onFontsUpdated([...customFonts.filter((f) => f.id !== newFont.id), newFont]);
      setUrlInput('');
      setUrlFontName('');
      setInstallSuccess(`Font "${newFont.name}" successfully installed and saved to IndexedDB!`);
      setTimeout(() => setInstallSuccess(null), 3500);
      loadStorageData();
    } catch (err: any) {
      setInstallError(err.message || 'Failed to install font from URL');
    } finally {
      setIsInstalling(false);
    }
  };

  // Upload local font file
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setupPendingFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setupPendingFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const setupPendingFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['ttf', 'otf', 'woff', 'woff2'].includes(ext || '')) {
      setInstallError(`Invalid font format ".${ext}". Please upload .ttf, .otf, .woff, or .woff2 files.`);
      return;
    }
    setInstallError(null);
    setPendingFile(file);
    const cleanName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    setUploadedFontName(cleanName);
  };

  const handleSaveUploadedFont = async () => {
    if (!pendingFile) return;

    setIsInstalling(true);
    setInstallError(null);
    setInstallSuccess(null);

    try {
      const newFont = await installFontFromFile(pendingFile, uploadedFontName);
      onFontsUpdated([...customFonts.filter((f) => f.id !== newFont.id), newFont]);
      setPendingFile(null);
      setUploadedFontName('');
      setInstallSuccess(`Font "${newFont.name}" successfully uploaded and saved to IndexedDB!`);
      setTimeout(() => setInstallSuccess(null), 3500);
      loadStorageData();
    } catch (err: any) {
      setInstallError(err.message || 'Failed to upload font file');
    } finally {
      setIsInstalling(false);
    }
  };

  // Uninstall font
  const handleDeleteFont = async (font: CustomFontItem) => {
    if (confirm(`Uninstall font "${font.name}"? This font will be removed from your local database.`)) {
      await uninstallCustomFont(font.id);
      onFontsUpdated(customFonts.filter((f) => f.id !== font.id));
      loadStorageData();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div
        id="font-manager-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
      >
        {/* Header Tier */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Custom Typography & Font Studio</h2>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  IndexedDB High-Capacity Storage
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Install web fonts from Google Fonts URL or upload font files saved locally on your device
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-white gap-2 pt-2">
          <button
            onClick={() => setActiveTab('installed')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'installed'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Installed Fonts</span>
            <span className="ml-1 bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px]">
              {customFonts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'url'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Install from Web URL</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Font File</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'storage'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Storage & Database</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {installError && (
          <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{installError}</span>
          </div>
        )}
        {installSuccess && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{installSuccess}</span>
          </div>
        )}

        {/* Modal Body Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ===================== TAB 1: INSTALLED FONTS ===================== */}
          {activeTab === 'installed' && (
            <div className="space-y-4">
              {/* Sample Preview Text Modifier */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600 shrink-0">Live Typography Test:</span>
                <input
                  type="text"
                  value={samplePreviewText}
                  onChange={(e) => setSamplePreviewText(e.target.value)}
                  placeholder="Type preview text to test fonts..."
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Custom Fonts List */}
              {customFonts.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-8">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <Type className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">No Custom Fonts Installed Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                    Install fonts by pasting a Google Fonts link or uploading a font file (.ttf, .otf, .woff, .woff2).
                    All custom fonts are saved locally in your browser's IndexedDB database.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setActiveTab('url')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Browse Curated Web Fonts</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Local Font</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>Installed Fonts ({customFonts.length})</span>
                    <span>Saved locally in IndexedDB</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {customFonts.map((font) => (
                      <div
                        key={font.id}
                        className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col gap-3 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{font.name}</span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                font.source === 'url'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {font.source === 'url' ? 'Web URL' : font.format?.toUpperCase() || 'FILE'}
                            </span>
                            {font.fileSize && (
                              <span className="text-[11px] text-slate-400 font-mono">{font.fileSize}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {onSelectFontForActiveDoc && (
                              <button
                                onClick={() => onSelectFontForActiveDoc(font.name)}
                                className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-md text-[11px] font-medium transition-colors"
                                title="Apply to currently open document"
                              >
                                Apply to Doc
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteFont(font)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Uninstall font"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Live Font Rendering Preview Box */}
                        <div
                          style={{ fontFamily: font.name }}
                          className="bg-slate-50/70 p-3 rounded-lg border border-slate-100 text-base text-slate-800 truncate"
                        >
                          {samplePreviewText}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Built-in Standard Fonts Reference */}
              <div className="mt-8 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  System Fonts Available by Default
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {STANDARD_FONTS.map((sf) => (
                    <span
                      key={sf.name}
                      style={{ fontFamily: sf.family }}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs border border-slate-200"
                    >
                      {sf.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 2: INSTALL FROM WEB URL ===================== */}
          {activeTab === 'url' && (
            <div className="space-y-6">
              {/* URL Input Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">Install from Google Fonts or Web CSS URL</span>
                </div>

                <div className="space-y-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="e.g. https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={urlFontName}
                      onChange={(e) => setUrlFontName(e.target.value)}
                      placeholder="Font Family Name (optional, e.g. Playfair Display)"
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleInstallFromUrl()}
                      disabled={isInstalling || !urlInput.trim()}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      {isInstalling ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Installing...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Install Font</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Tip: Visit{' '}
                  <a
                    href="https://fonts.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    Google Fonts <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  , copy any font's embed link or specimen URL, and paste it above!
                </p>
              </div>

              {/* Curated 1-Click Google Fonts Gallery */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-900">Popular Curated Google Fonts (1-Click Install)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Click to install immediately</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CURATED_WEB_FONTS.map((font) => {
                    const isInstalled = customFonts.some((cf) => cf.name.toLowerCase() === font.name.toLowerCase());
                    return (
                      <div
                        key={font.name}
                        className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-indigo-300 transition-all shadow-2xs flex flex-col justify-between gap-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">{font.name}</span>
                              <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {font.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{font.description}</p>
                          </div>

                          <button
                            onClick={() => !isInstalled && handleInstallFromUrl(font.googleFontsUrl, font.name)}
                            disabled={isInstalled || isInstalling}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                              isInstalled
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                            }`}
                          >
                            {isInstalled ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Installed</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>Install</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-lg text-xs text-slate-700 truncate font-mono">
                          {font.sample}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 3: UPLOAD FONT FILE ===================== */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">Drag and Drop Font Files Here</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Supports TrueType (.ttf), OpenType (.otf), and Web Open Font (.woff, .woff2)
                </p>

                <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs">
                  <FileCode className="w-4 h-4" />
                  <span>Choose Font File</span>
                  <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Pending File Staging Box */}
              {pendingFile && (
                <div className="bg-white border border-indigo-200 rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                        {pendingFile.name.split('.').pop()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{pendingFile.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {(pendingFile.size / 1024).toFixed(1)} KB &bull; Staged for IndexedDB
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setPendingFile(null)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Font Family Name (used in document editors):
                    </label>
                    <input
                      type="text"
                      value={uploadedFontName}
                      onChange={(e) => setUploadedFontName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    onClick={handleSaveUploadedFont}
                    disabled={isInstalling || !uploadedFontName.trim()}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    {isInstalling ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to IndexedDB...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-3.5 h-3.5" />
                        <span>Save Font to IndexedDB Local Database</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 4: STORAGE & DATABASE ===================== */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">IndexedDB High-Capacity Local Storage</h3>
                    <p className="text-xs text-slate-500">
                      High-throughput persistent browser storage for documents, binary sheets, and custom typography
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Storage Used
                    </span>
                    <span className="text-lg font-bold text-slate-900 font-mono">
                      {storageInfo?.usedFormatted || '0 B'}
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Available Quota
                    </span>
                    <span className="text-lg font-bold text-emerald-600 font-mono">
                      {storageInfo?.quotaFormatted || 'Gigabytes'}
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Installed Fonts
                    </span>
                    <span className="text-lg font-bold text-indigo-600 font-mono">
                      {customFonts.length} Fonts
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Persistent Offline Guarantee</span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    IndexedDB does not have the strict 5MB limitation of traditional browser localStorage. Large
                    spreadsheets with tens of thousands of rows, high-resolution slide decks, and binary font files
                    are safely preserved on this device across restarts and offline use.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Tier */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Active Engine: IndexedDB (UniversalDocStudioDB)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors shadow-2xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
