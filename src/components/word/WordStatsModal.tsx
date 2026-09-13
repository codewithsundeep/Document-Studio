import React from 'react';
import { X, FileText, Clock, Mic, AlignLeft } from 'lucide-react';
import { WordDocItem } from '../../types';

interface WordStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: WordDocItem;
  wordCount: number;
  charCount: number;
  paragraphCount: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
}

export const WordStatsModal: React.FC<WordStatsModalProps> = ({
  isOpen,
  onClose,
  document: docItem,
  wordCount,
  charCount,
  paragraphCount,
  readingTimeMinutes,
  speakingTimeMinutes,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800 text-sm">Word Document Statistics</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-600">
          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-500">Document Name</span>
              <span className="font-semibold text-slate-900 truncate max-w-[200px]">{docItem.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-500">Pages</span>
              <span className="font-semibold text-slate-900">1</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-500">Words</span>
              <span className="font-bold text-blue-600 text-sm">{wordCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-500">Characters (with spaces)</span>
              <span className="font-semibold text-slate-900">{charCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-500">Paragraphs</span>
              <span className="font-semibold text-slate-900">{paragraphCount}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-500">Page Orientation</span>
              <span className="font-semibold text-slate-900 capitalize">{docItem.data.pageOrientation}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="font-medium text-slate-500">Page Size</span>
              <span className="font-semibold text-slate-900 uppercase">{docItem.data.pageSize}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-blue-50/60 rounded-lg p-3 border border-blue-100 flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <div className="text-[10px] text-blue-700 font-medium uppercase tracking-wider">Reading Time</div>
                <div className="font-bold text-slate-900 text-sm">~{readingTimeMinutes} min</div>
              </div>
            </div>
            <div className="bg-emerald-50/60 rounded-lg p-3 border border-emerald-100 flex items-center gap-2.5">
              <Mic className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-[10px] text-emerald-700 font-medium uppercase tracking-wider">Speaking Time</div>
                <div className="font-bold text-slate-900 text-sm">~{speakingTimeMinutes} min</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
