import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ZoomIn,
  ZoomOut,
  X,
  FileDown,
} from 'lucide-react';
import { WordDocItem, CustomFontItem } from '../../types';
import { exportWordFile } from '../../utils/fileHelpers';
import { WordRibbon, WordRibbonTab } from './WordRibbon';
import { WordStatsModal } from './WordStatsModal';

interface WordEditorProps {
  document: WordDocItem;
  onChange: (updatedDoc: WordDocItem) => void;
  isReadOnly?: boolean;
  customFonts?: CustomFontItem[];
  onOpenFontManager?: () => void;
}

export const WordEditor: React.FC<WordEditorProps> = ({
  document: docItem,
  onChange,
  isReadOnly = false,
  customFonts = [],
  onOpenFontManager,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<WordRibbonTab>('home');
  const [zoom, setZoom] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'page' | 'continuous' | 'focus'>('page');
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [paragraphCount, setParagraphCount] = useState<number>(1);
  const [showFindReplace, setShowFindReplace] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showRuler, setShowRuler] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== docItem.data.htmlContent) {
      editorRef.current.innerHTML = docItem.data.htmlContent || '<p>Start typing your document here...</p>';
      calculateStats();
    }
  }, [docItem.id]);

  const calculateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setCharCount(text.length);

    const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0).length;
    setParagraphCount(Math.max(1, paragraphs));
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const newHtml = editorRef.current.innerHTML;
    calculateStats();
    onChange({
      ...docItem,
      lastModified: Date.now(),
      data: {
        ...docItem.data,
        htmlContent: newHtml,
      },
    });
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (isReadOnly) return;
    window.document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
    handleInput();
  };

  const handleUpdateDocumentData = (patch: Partial<WordDocItem['data']>) => {
    if (isReadOnly) return;
    onChange({
      ...docItem,
      lastModified: Date.now(),
      data: {
        ...docItem.data,
        ...patch,
      },
    });
  };

  const handleInsertTable = (rows = 3, cols = 3) => {
    if (isReadOnly) return;
    let headerCells = '';
    for (let c = 1; c <= cols; c++) {
      headerCells += `<th style="border: 1px solid #cbd5e1; padding: 8px 12px; background-color: #f1f5f9; text-align: left; font-weight: 600;">Header ${c}</th>`;
    }
    let bodyRows = '';
    for (let r = 1; r <= rows; r++) {
      let rowCells = '';
      for (let c = 1; c <= cols; c++) {
        rowCells += `<td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Cell ${r},${c}</td>`;
      }
      bodyRows += `<tr>${rowCells}</tr>`;
    }

    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
      <p><br /></p>
    `;
    execCmd('insertHTML', tableHtml);
  };

  const handleInsertImage = () => {
    if (isReadOnly) return;
    const url = prompt(
      'Enter image URL or paste an image link:',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80'
    );
    if (url) {
      execCmd('insertImage', url);
    }
  };

  const handleInsertLink = () => {
    if (isReadOnly) return;
    const url = prompt('Enter website link URL:', 'https://');
    if (url) {
      execCmd('createLink', url);
    }
  };

  const handleInsertSymbol = (symbol: string) => {
    execCmd('insertText', symbol);
  };

  const handleInsertCallout = (type: 'tip' | 'warning' | 'info') => {
    const config = {
      tip: { bg: '#ecfdf5', border: '#10b981', title: '💡 Pro Tip', text: 'Add actionable advice here.' },
      warning: { bg: '#fffbeb', border: '#f59e0b', title: '⚠️ Important Note', text: 'Verify these conditions carefully.' },
      info: { bg: '#eff6ff', border: '#3b82f6', title: 'ℹ️ Information', text: 'Reference details for this section.' },
    }[type];

    const html = `
      <div style="background-color: ${config.bg}; border-left: 4px solid ${config.border}; padding: 12px 16px; margin: 12px 0; border-radius: 4px; font-size: 13px;">
        <strong style="display: block; margin-bottom: 4px;">${config.title}</strong>
        <span>${config.text}</span>
      </div>
      <p></p>
    `;
    execCmd('insertHTML', html);
  };

  const handleGenerateTOC = () => {
    if (!editorRef.current) return;
    const headings = editorRef.current.querySelectorAll('h1, h2, h3');
    if (headings.length === 0) {
      alert('No headings (H1, H2, or H3) found in document. Please format some section titles first!');
      return;
    }

    let tocHtml = `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top:0; margin-bottom: 12px; font-size: 14px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Table of Contents</h3>
        <ul style="margin: 0; padding-left: 20px; list-style-type: none;">
    `;

    headings.forEach((h, idx) => {
      const tag = h.tagName.toLowerCase();
      const text = h.textContent || `Section ${idx + 1}`;
      const indent = tag === 'h1' ? '0px' : tag === 'h2' ? '16px' : '32px';
      const weight = tag === 'h1' ? '600' : '400';
      tocHtml += `
        <li style="margin-bottom: 6px; padding-left: ${indent};">
          <span style="font-weight: ${weight}; color: #2563eb;">${text}</span>
        </li>
      `;
    });

    tocHtml += `
        </ul>
      </div>
      <p></p>
    `;
    execCmd('insertHTML', tocHtml);
  };

  const handleInsertFootnote = () => {
    const num = Math.floor(Math.random() * 9) + 1;
    execCmd('insertHTML', `<sup style="color: #2563eb; font-weight: bold; cursor: pointer;" title="Footnote reference ${num}">[${num}]</sup>&nbsp;`);
  };

  const handleInsertCitation = () => {
    const author = prompt('Enter author and year (e.g. Smith, 2025):', 'Smith, 2025');
    if (author) {
      execCmd('insertHTML', `<em>(${author})</em>&nbsp;`);
    }
  };

  // Text to Speech Read Aloud
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported by your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const text = editorRef.current?.innerText || '';
      if (!text.trim()) {
        alert('Document is empty, nothing to read aloud.');
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleFindReplace = () => {
    if (!findQuery || !editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newHtml = currentHtml.replace(regex, replaceQuery);
    editorRef.current.innerHTML = newHtml;
    handleInput();
  };

  const handlePrint = () => {
    window.print();
  };

  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const speakingTimeMinutes = Math.max(1, Math.ceil(wordCount / 130));

  // Determine margin styles
  const marginPadding = {
    narrow: 'p-6 md:p-8',
    wide: 'p-12 md:p-20',
    normal: 'p-8 md:p-14',
  }[docItem.data.margins || 'normal'];

  return (
    <div id="word-editor-container" className="flex flex-col h-full bg-slate-100 select-text overflow-hidden">
      {/* 1. Full Authentic Word Multi-Tab Ribbon */}
      <WordRibbon
        document={docItem}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExecCmd={execCmd}
        isReadOnly={isReadOnly}
        wordCount={wordCount}
        charCount={charCount}
        zoom={zoom}
        onZoomChange={setZoom}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        showRuler={showRuler}
        onToggleRuler={() => setShowRuler(!showRuler)}
        onExport={(fmt) => exportWordFile(docItem.data, docItem.name, fmt as any)}
        onPrint={handlePrint}
        onInsertTable={handleInsertTable}
        onInsertImage={handleInsertImage}
        onInsertLink={handleInsertLink}
        onInsertSymbol={handleInsertSymbol}
        onInsertCallout={handleInsertCallout}
        onGenerateTOC={handleGenerateTOC}
        onInsertFootnote={handleInsertFootnote}
        onInsertCitation={handleInsertCitation}
        onOpenStatsModal={() => setShowStatsModal(true)}
        onToggleFindReplace={() => setShowFindReplace(!showFindReplace)}
        isFindReplaceOpen={showFindReplace}
        isSpeaking={isSpeaking}
        onToggleSpeech={handleToggleSpeech}
        onUpdateDocumentData={handleUpdateDocumentData}
        customFonts={customFonts}
        onOpenFontManager={onOpenFontManager}
      />

      {/* Find and Replace Popover Bar */}
      {showFindReplace && (
        <div id="word-find-replace-bar" className="bg-blue-50/90 border-b border-blue-200 px-4 py-2 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium">Find:</span>
            <input
              id="word-find-input"
              type="text"
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              placeholder="Search text..."
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 w-36 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium">Replace with:</span>
            <input
              id="word-replace-input"
              type="text"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="New text..."
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 w-36 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            id="word-replace-all-btn"
            onClick={handleFindReplace}
            className="px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors"
          >
            Replace All
          </button>
          <button
            onClick={() => setShowFindReplace(false)}
            className="ml-auto p-1 text-slate-500 hover:text-slate-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Document Ruler (when enabled) */}
      {showRuler && viewMode !== 'focus' && (
        <div className="bg-white border-b border-slate-200 h-5 px-8 flex items-center justify-between text-[9px] text-slate-400 font-mono select-none overflow-hidden">
          <div className="flex items-center gap-6">
            <span>0</span>
            <span>1"</span>
            <span>2"</span>
            <span>3"</span>
            <span>4"</span>
            <span>5"</span>
            <span>6"</span>
            <span>7"</span>
            <span>8"</span>
          </div>
          <div className="text-[10px] text-slate-500 font-sans">Margins: {docItem.data.margins || 'normal'}</div>
        </div>
      )}

      {/* Main Document Body Canvas */}
      <div
        id="word-viewport"
        className={`flex-1 overflow-y-auto p-4 md:p-8 flex justify-center transition-colors ${
          isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-200/70'
        }`}
      >
        <div
          id="word-document-page"
          className={`relative transition-all duration-150 ${
            viewMode === 'focus'
              ? 'w-full max-w-2xl p-8 bg-transparent shadow-none border-none'
              : viewMode === 'page'
              ? `w-full ${
                  docItem.data.pageOrientation === 'landscape' ? 'max-w-[1100px] min-h-[850px]' : 'max-w-[850px] min-h-[1100px]'
                } ${marginPadding} shadow-lg border border-slate-300 rounded-xs`
              : 'w-full max-w-4xl p-6 shadow-xs border border-slate-200'
          }`}
          style={{
            zoom: `${zoom}%`,
            backgroundColor: isDarkMode ? '#0f172a' : docItem.data.pageColor || '#ffffff',
            color: isDarkMode ? '#f8fafc' : '#0f172a',
            fontFamily: docItem.data.fontFamily || 'Inter, system-ui, sans-serif',
            fontSize: docItem.data.fontSize || '15px',
            lineHeight: docItem.data.lineSpacing || '1.6',
            columnCount: docItem.data.columns === 2 ? 2 : 1,
            columnGap: '40px',
          }}
        >
          {/* Watermark Overlay (if enabled) */}
          {docItem.data.watermark && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-10 text-slate-700 font-extrabold text-7xl uppercase tracking-widest rotate-[-35deg]"
              style={{ zIndex: 0 }}
            >
              {docItem.data.watermark}
            </div>
          )}

          {/* Authentic Editable Canvas */}
          <div
            id="word-content-editable"
            ref={editorRef}
            contentEditable={!isReadOnly}
            suppressContentEditableWarning
            onInput={handleInput}
            className="outline-none min-h-[900px] focus:ring-0 selection:bg-blue-200 relative z-10"
          />
        </div>
      </div>

      {/* Bottom Status & Pagination Bar */}
      <div id="word-status-bar" className="bg-white border-t border-slate-200 px-4 py-1.5 flex items-center justify-between text-xs text-slate-500 select-none">
        <div className="flex items-center gap-4">
          <span>Page 1 of 1</span>
          <button
            onClick={() => setShowStatsModal(true)}
            className="hover:text-blue-600 underline underline-offset-2 transition-colors cursor-pointer"
          >
            {wordCount.toLocaleString()} words
          </button>
          <span>{charCount.toLocaleString()} characters</span>
          <span className="hidden sm:inline">~{readingTimeMinutes} min read</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom Slider / Controls */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-9 text-center font-mono font-medium text-slate-700 text-[11px]">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Statistics Modal */}
      <WordStatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        document={docItem}
        wordCount={wordCount}
        charCount={charCount}
        paragraphCount={paragraphCount}
        readingTimeMinutes={readingTimeMinutes}
        speakingTimeMinutes={speakingTimeMinutes}
      />
    </div>
  );
};
