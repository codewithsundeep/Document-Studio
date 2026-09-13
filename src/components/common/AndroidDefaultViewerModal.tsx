import React, { useState } from 'react';
import {
  Smartphone,
  CheckCircle2,
  Settings,
  FolderOpen,
  FileCheck,
  Download,
  Share2,
  ExternalLink,
  X,
  HelpCircle,
  FileText,
  Sheet,
  Presentation,
  FileCode,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface AndroidDefaultViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  onInstall: () => void;
}

export const AndroidDefaultViewerModal: React.FC<AndroidDefaultViewerModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  onInstall,
}) => {
  const [activeTab, setActiveTab] = useState<'install' | 'default' | 'tips'>('install');
  const [selectedBrand, setSelectedBrand] = useState<'samsung' | 'pixel' | 'other'>('pixel');

  if (!isOpen) return null;

  return (
    <div id="android-default-viewer-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="android-default-viewer-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Android Document App</h2>
                <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Phone Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Install on your phone and set as default viewer for Word, Excel, PPT &amp; PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold select-none">
          <button
            onClick={() => setActiveTab('install')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'install'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>1. Install App</span>
          </button>
          <button
            onClick={() => setActiveTab('default')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'default'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>2. Set as Default</span>
          </button>
          <button
            onClick={() => setActiveTab('tips')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'tips'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Supported Files</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* TAB 1: INSTALL AS ANDROID APP */}
          {activeTab === 'install' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                    {isInstalled ? 'App is Already Installed!' : 'Official Android WebAPK / PWA Support'}
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    {isInstalled
                      ? 'Document Studio is running in standalone mode on your device. You can now configure it as your default file opener.'
                      : 'Install Document Studio onto your Android phone to receive an app icon in your app drawer, offline access, and system-wide file handling.'}
                  </p>
                </div>
              </div>

              {!isInstalled && (
                <div className="flex flex-col items-center justify-center py-3 bg-slate-50 rounded-xl border border-slate-200 p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-600 to-blue-600 flex items-center justify-center text-white mb-3 shadow-md">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Install to Android Home Screen</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Tap the button below to trigger your Android browser&apos;s native app installation.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {isInstallable ? (
                      <button
                        id="android-install-prompt-trigger-btn"
                        onClick={onInstall}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        <span>Install Document App Now</span>
                      </button>
                    ) : (
                      <div className="text-xs bg-white border border-slate-300 rounded-lg p-3 text-slate-700 max-w-sm text-left">
                        <p className="font-semibold text-slate-900 mb-1">Manual Installation via Chrome / Edge / Samsung:</p>
                        <ol className="list-decimal pl-4 space-y-1 text-slate-600 text-[11px]">
                          <li>Tap the <strong>three dots menu (⋮)</strong> in your phone browser.</li>
                          <li>Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</li>
                          <li>Confirm <strong>&quot;Install&quot;</strong>.</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Next Step CTA */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTab('default')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>Proceed to Step 2: Set as Default Viewer</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SET AS DEFAULT VIEWER IN ANDROID */}
          {activeTab === 'default' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <span>How to Set as Default Document Opener</span>
                </h3>
                <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                  Android allows you to associate file types like Word (.docx), Excel (.xlsx), PowerPoint (.pptx), and PDF (.pdf) with this app.
                </p>
              </div>

              {/* Method A (Easiest) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                    A
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                    Method 1: Tap Any Document &amp; Select &quot;Always&quot; (Recommended)
                  </h4>
                </div>
                <div className="pl-8 text-xs text-slate-600 space-y-1.5">
                  <p>1. Open your Android <strong>Files</strong>, <strong>My Files</strong>, or <strong>Downloads</strong> folder.</p>
                  <p>2. Tap any <strong>.pdf</strong>, <strong>.docx</strong>, <strong>.xlsx</strong>, or <strong>.pptx</strong> file.</p>
                  <p>3. In the <em>&quot;Open with...&quot;</em> prompt that appears, select <strong>Document Studio</strong>.</p>
                  <p className="font-semibold text-emerald-700">
                    4. Tap <strong>&quot;ALWAYS&quot;</strong> (instead of &quot;Just once&quot;).
                  </p>
                  <p className="text-[11px] text-slate-400">
                    From then on, tapping any document anywhere on your phone will automatically launch Document Studio!
                  </p>
                </div>
              </div>

              {/* Method B (Phone Settings) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                      B
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                      Method 2: Android System Settings
                    </h4>
                  </div>
                  {/* Phone Brand Selector */}
                  <div className="flex gap-1 text-[10px]">
                    <button
                      onClick={() => setSelectedBrand('pixel')}
                      className={`px-2 py-0.5 rounded font-medium ${
                        selectedBrand === 'pixel' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Pixel / Stock
                    </button>
                    <button
                      onClick={() => setSelectedBrand('samsung')}
                      className={`px-2 py-0.5 rounded font-medium ${
                        selectedBrand === 'samsung' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Samsung Galaxy
                    </button>
                  </div>
                </div>

                <div className="pl-8 text-xs text-slate-600 space-y-1.5">
                  {selectedBrand === 'samsung' ? (
                    <>
                      <p>1. Open <strong>Settings</strong> &rarr; <strong>Apps</strong>.</p>
                      <p>2. Tap <strong>Choose default apps</strong> (or <strong>Default apps</strong>).</p>
                      <p>3. Tap <strong>Opening links</strong> &rarr; find <strong>Document Studio</strong>.</p>
                      <p>4. Enable <strong>Open supported links</strong>.</p>
                    </>
                  ) : (
                    <>
                      <p>1. Open phone <strong>Settings</strong> &rarr; <strong>Apps</strong>.</p>
                      <p>2. Tap <strong>All apps</strong> &rarr; select <strong>Document Studio</strong>.</p>
                      <p>3. Tap <strong>Open by default</strong> &rarr; enable <strong>Open supported links</strong>.</p>
                    </>
                  )}
                </div>
              </div>

              {/* Android Share Sheet Support */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <Share2 className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-xs text-slate-600">
                  You can also open documents received in <strong>WhatsApp, Gmail, Telegram, or Drive</strong> by tapping <strong>Share &rarr; Document Studio</strong>!
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SUPPORTED FILE ASSOCIATIONS */}
          {activeTab === 'tips' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Pre-configured Android File Handlers
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Word */}
                <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Word Documents</h4>
                    <p className="text-[11px] text-slate-500 font-mono">.docx, .doc, .txt, .md</p>
                  </div>
                </div>

                {/* Excel */}
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Sheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Excel Spreadsheets</h4>
                    <p className="text-[11px] text-slate-500 font-mono">.xlsx, .xls, .csv</p>
                  </div>
                </div>

                {/* PowerPoint */}
                <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
                    <Presentation className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">PowerPoint Decks</h4>
                    <p className="text-[11px] text-slate-500 font-mono">.pptx, .ppt</p>
                  </div>
                </div>

                {/* PDF */}
                <div className="p-3 bg-red-50/50 border border-red-200 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">PDF Documents</h4>
                    <p className="text-[11px] text-slate-500 font-mono">.pdf</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Zero-Cloud Privacy:</strong> All documents opened on your phone stay 100% inside your phone&apos;s sandbox. No file is ever sent to an external server.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Android W3C File Handling API Ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
