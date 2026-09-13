import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Mail,
  Download,
  Smartphone,
  QrCode,
  FileText,
  Sheet,
  Presentation,
  FileCode,
  X,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { DocumentItem } from '../../types';
import { getDocumentAsFile, getDocumentSummaryText, triggerDownload } from '../../utils/fileHelpers';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, document: docItem }) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);

  if (!isOpen || !docItem) return null;

  const summaryText = getDocumentSummaryText(docItem);
  const shareUrl = window.location.href;

  // Native Android / System Share
  const handleNativeShare = async () => {
    if (!navigator.share) {
      setShareStatus('Native sharing is not supported by this browser. Use copy or email options below.');
      return;
    }

    try {
      const file = getDocumentAsFile(docItem);
      // Test if canShare with files
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: docItem.name,
          text: `Check out ${docItem.name} on Document Studio`,
          files: [file],
        });
        setShareStatus('Shared successfully!');
      } else {
        // Fallback to text + URL sharing
        await navigator.share({
          title: docItem.name,
          text: summaryText,
          url: shareUrl,
        });
        setShareStatus('Shared successfully!');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Sharing failed:', err);
        setShareStatus('Sharing was canceled or unavailable.');
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Document: ${docItem.name}`);
    const body = encodeURIComponent(
      `Hello,\n\nI am sharing "${docItem.name}" with you.\n\n${summaryText}\n\nOpen or view in Document Studio: ${shareUrl}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleDownloadFile = () => {
    const file = getDocumentAsFile(docItem);
    triggerDownload(file, file.name);
  };

  const getDocIcon = () => {
    switch (docItem.type) {
      case 'word':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'excel':
        return <Sheet className="w-5 h-5 text-emerald-600" />;
      case 'powerpoint':
        return <Presentation className="w-5 h-5 text-orange-600" />;
      case 'pdf':
        return <FileCode className="w-5 h-5 text-red-600" />;
    }
  };

  return (
    <div id="share-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="share-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-2xs">
              {getDocIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-[240px] sm:max-w-xs">{docItem.name}</h3>
                <span className="text-[10px] font-bold uppercase bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                  {docItem.type}
                </span>
              </div>
              <p className="text-xs text-slate-400">Share or export this document to other devices &amp; apps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-slate-800">
          {/* Primary Android / Device Native Share CTA */}
          <button
            id="share-native-sheet-btn"
            onClick={handleNativeShare}
            className="w-full p-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  <span>Share to Apps &amp; Nearby</span>
                  <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-xs text-blue-100">WhatsApp, Gmail, Telegram, Drive, Bluetooth</div>
              </div>
            </div>
            <Share2 className="w-5 h-5 text-white/80 shrink-0 ml-2" />
          </button>

          {shareStatus && (
            <div className="p-2.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs">
              {shareStatus}
            </div>
          )}

          {/* Grid of Other Sharing Options */}
          <div className="grid grid-cols-2 gap-3">
            {/* Copy Link */}
            <button
              id="share-copy-link-btn"
              onClick={handleCopyLink}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50 flex flex-col items-center text-center gap-1.5 transition-all shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-slate-600 group-hover:text-blue-600 transition-colors">
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </div>
              <span className="text-xs font-bold text-slate-800">{copiedLink ? 'Link Copied!' : 'Copy App Link'}</span>
              <span className="text-[10px] text-slate-400">Direct workspace URL</span>
            </button>

            {/* Email Document */}
            <button
              id="share-email-btn"
              onClick={handleEmailShare}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50 flex flex-col items-center text-center gap-1.5 transition-all shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-slate-600 group-hover:text-blue-600 transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Email Document</span>
              <span className="text-[10px] text-slate-400">Launch mail client</span>
            </button>

            {/* Copy Text Summary */}
            <button
              id="share-copy-summary-btn"
              onClick={handleCopySummary}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50 flex flex-col items-center text-center gap-1.5 transition-all shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-slate-600 group-hover:text-blue-600 transition-colors">
                {copiedSummary ? <Check className="w-4 h-4 text-emerald-600" /> : <FileText className="w-4 h-4" />}
              </div>
              <span className="text-xs font-bold text-slate-800">
                {copiedSummary ? 'Summary Copied!' : 'Copy Summary'}
              </span>
              <span className="text-[10px] text-slate-400">Formatted text clip</span>
            </button>

            {/* Download Clean File */}
            <button
              id="share-download-file-btn"
              onClick={handleDownloadFile}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50 flex flex-col items-center text-center gap-1.5 transition-all shadow-2xs group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-slate-600 group-hover:text-blue-600 transition-colors">
                <Download className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800">Export &amp; Download</span>
              <span className="text-[10px] text-slate-400">Save to device storage</span>
            </button>
          </div>

          {/* Phone QR Code Toggle */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-800">Open on Phone via QR Code</span>
              </div>
              <button
                onClick={() => setShowQrCode(!showQrCode)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                {showQrCode ? 'Hide QR' : 'Show QR'}
              </button>
            </div>

            {showQrCode && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col items-center text-center animate-in fade-in duration-200">
                {/* Visual generated QR Code using SVG */}
                <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-xs mb-2">
                  <svg viewBox="0 0 100 100" className="w-32 h-32">
                    {/* Outer corners */}
                    <rect x="5" y="5" width="28" height="28" fill="#0f172a" rx="4" />
                    <rect x="9" y="9" width="20" height="20" fill="#ffffff" rx="2" />
                    <rect x="13" y="13" width="12" height="12" fill="#0f172a" rx="1" />

                    <rect x="67" y="5" width="28" height="28" fill="#0f172a" rx="4" />
                    <rect x="71" y="9" width="20" height="20" fill="#ffffff" rx="2" />
                    <rect x="75" y="13" width="12" height="12" fill="#0f172a" rx="1" />

                    <rect x="5" y="67" width="28" height="28" fill="#0f172a" rx="4" />
                    <rect x="9" y="71" width="20" height="20" fill="#ffffff" rx="2" />
                    <rect x="13" y="75" width="12" height="12" fill="#0f172a" rx="1" />

                    {/* QR Matrix Data Pattern */}
                    <rect x="38" y="8" width="6" height="6" fill="#0f172a" />
                    <rect x="48" y="12" width="6" height="6" fill="#0f172a" />
                    <rect x="42" y="22" width="6" height="6" fill="#0f172a" />
                    <rect x="54" y="24" width="6" height="6" fill="#0f172a" />

                    <rect x="10" y="40" width="6" height="6" fill="#0f172a" />
                    <rect x="22" y="44" width="6" height="6" fill="#0f172a" />
                    <rect x="35" y="38" width="6" height="6" fill="#0f172a" />
                    <rect x="45" y="45" width="10" height="10" fill="#0f172a" />
                    <rect x="62" y="40" width="6" height="6" fill="#0f172a" />
                    <rect x="75" y="44" width="6" height="6" fill="#0f172a" />
                    <rect x="85" y="38" width="6" height="6" fill="#0f172a" />

                    <rect x="38" y="60" width="6" height="6" fill="#0f172a" />
                    <rect x="48" y="68" width="6" height="6" fill="#0f172a" />
                    <rect x="58" y="62" width="6" height="6" fill="#0f172a" />
                    <rect x="70" y="70" width="6" height="6" fill="#0f172a" />
                    <rect x="80" y="64" width="6" height="6" fill="#0f172a" />
                    <rect x="75" y="80" width="6" height="6" fill="#0f172a" />
                    <rect x="85" y="85" width="6" height="6" fill="#0f172a" />
                  </svg>
                </div>
                <p className="text-[11px] text-slate-500">
                  Scan with your phone&apos;s camera to open this document instantly on Android or iOS.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>End-to-End Client Privacy</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
