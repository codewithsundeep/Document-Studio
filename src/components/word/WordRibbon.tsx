import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Table as TableIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Minus,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  FileDown,
  Printer,
  Palette,
  Highlighter,
  Scissors,
  Copy,
  Clipboard,
  Type,
  BookOpen,
  Volume2,
  VolumeX,
  Columns,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  Check,
  Bookmark,
  ChevronDown,
} from 'lucide-react';
import { WordDocItem, CustomFontItem } from '../../types';

export type WordRibbonTab = 'file' | 'home' | 'insert' | 'layout' | 'references' | 'review' | 'view';

interface WordRibbonProps {
  document: WordDocItem;
  activeTab: WordRibbonTab;
  onTabChange: (tab: WordRibbonTab) => void;
  onExecCmd: (cmd: string, val?: string) => void;
  isReadOnly?: boolean;
  wordCount: number;
  charCount: number;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  viewMode: 'page' | 'continuous' | 'focus';
  onViewModeChange: (mode: 'page' | 'continuous' | 'focus') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  showRuler: boolean;
  onToggleRuler: () => void;
  onExport: (format: 'doc' | 'pdf' | 'html' | 'txt' | 'md') => void;
  onPrint: () => void;
  onInsertTable: (rows?: number, cols?: number) => void;
  onInsertImage: () => void;
  onInsertLink: () => void;
  onInsertSymbol: (symbol: string) => void;
  onInsertCallout: (type: 'tip' | 'warning' | 'info') => void;
  onGenerateTOC: () => void;
  onInsertFootnote: () => void;
  onInsertCitation: () => void;
  onOpenStatsModal: () => void;
  onToggleFindReplace: () => void;
  isFindReplaceOpen: boolean;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  onUpdateDocumentData: (data: Partial<WordDocItem['data']>) => void;
  customFonts?: CustomFontItem[];
  onOpenFontManager?: () => void;
}

export const WordRibbon: React.FC<WordRibbonProps> = ({
  document: docItem,
  activeTab,
  onTabChange,
  onExecCmd,
  isReadOnly = false,
  wordCount,
  charCount,
  zoom,
  onZoomChange,
  viewMode,
  onViewModeChange,
  isDarkMode,
  onToggleDarkMode,
  showRuler,
  onToggleRuler,
  onExport,
  onPrint,
  onInsertTable,
  onInsertImage,
  onInsertLink,
  onInsertSymbol,
  onInsertCallout,
  onGenerateTOC,
  onInsertFootnote,
  onInsertCitation,
  onOpenStatsModal,
  onToggleFindReplace,
  isFindReplaceOpen,
  isSpeaking,
  onToggleSpeech,
  onUpdateDocumentData,
  customFonts = [],
  onOpenFontManager,
}) => {
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showPageColorPicker, setShowPageColorPicker] = useState(false);
  const [showSymbolsMenu, setShowSymbolsMenu] = useState(false);
  const [tableGridHover, setTableGridHover] = useState({ rows: 3, cols: 3 });
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showWatermarkMenu, setShowWatermarkMenu] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const textColors = ['#000000', '#1e3a8a', '#047857', '#b91c1c', '#7c3aed', '#c2410c', '#475569', '#d97706'];
  const highlightColors = ['#fef08a', '#bbf7d0', '#fed7aa', '#fbcfe8', '#bae6fd', 'transparent'];
  const pageColors = ['#ffffff', '#fffbeb', '#f8fafc', '#f0fdf4', '#eff6ff', '#1e293b'];
  const symbols = ['©', '™', '®', '€', '£', '¥', '§', '¶', '•', '★', '→', '✓', '±', '≠', '≤', '≥', '∞', '°', '—', '…'];

  const triggerCopyFeedback = (text: string) => {
    setCopiedNotification(text);
    setTimeout(() => setCopiedNotification(null), 1500);
  };

  const tabs: { id: WordRibbonTab; label: string }[] = [
    { id: 'file', label: 'File' },
    { id: 'home', label: 'Home' },
    { id: 'insert', label: 'Insert' },
    { id: 'layout', label: 'Layout' },
    { id: 'references', label: 'References' },
    { id: 'review', label: 'Review' },
    { id: 'view', label: 'View' },
  ];

  return (
    <div id="word-ribbon-container" className="bg-white border-b border-slate-200 select-none shadow-xs z-20">
      {/* 1. Ribbon Tab Headers */}
      <div className="flex items-center px-3 bg-slate-100/90 border-b border-slate-200 gap-0.5 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`word-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all border-b-2 ${
                isActive
                  ? 'border-blue-700 text-blue-700 bg-white shadow-xs rounded-t-md -mb-[1px]'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-t-md'
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        {/* Live notification pill */}
        {copiedNotification && (
          <span className="ml-auto text-[11px] font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full animate-in fade-in">
            {copiedNotification}
          </span>
        )}
      </div>

      {/* 2. Ribbon Action Toolbar based on Active Tab */}
      <div className="min-h-[58px] px-3 py-1.5 flex items-center gap-2 overflow-x-auto text-xs text-slate-700">
        {/* ======================= FILE TAB ======================= */}
        {activeTab === 'file' && (
          <div className="flex items-center gap-3 animate-in fade-in duration-100">
            {/* Document Info Card */}
            <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                DOC
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900 text-xs truncate max-w-[150px]">{docItem.name}</div>
                <div className="text-[10px] text-slate-500">
                  {wordCount} words • {charCount} chars
                </div>
              </div>
            </div>

            {/* Export options */}
            <div className="flex items-center gap-1 pr-3 border-r border-slate-200">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mr-1">Export:</span>
              <button
                onClick={() => onExport('doc')}
                className="px-2.5 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-xs"
                title="Download as Word Document (.doc)"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Word (.docx)</span>
              </button>
              <button
                onClick={() => onExport('pdf')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                title="Download as PDF"
              >
                PDF
              </button>
              <button
                onClick={() => onExport('html')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                title="Download HTML page"
              >
                HTML
              </button>
              <button
                onClick={() => onExport('txt')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                title="Download Plain Text"
              >
                TXT
              </button>
              <button
                onClick={() => onExport('md')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                title="Download Markdown"
              >
                MD
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onPrint}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 font-medium transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={onOpenStatsModal}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 font-medium transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Properties & Stats</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================= HOME TAB ======================= */}
        {activeTab === 'home' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-100 flex-wrap sm:flex-nowrap">
            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
              <button
                onClick={() => onExecCmd('undo')}
                disabled={isReadOnly}
                title="Undo (Ctrl+Z)"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-40"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => onExecCmd('redo')}
                disabled={isReadOnly}
                title="Redo (Ctrl+Y)"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-40"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Clipboard */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
              <button
                onClick={() => {
                  onExecCmd('copy');
                  triggerCopyFeedback('Selection Copied');
                }}
                disabled={isReadOnly}
                title="Copy (Ctrl+C)"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-40"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  onExecCmd('cut');
                  triggerCopyFeedback('Selection Cut');
                }}
                disabled={isReadOnly}
                title="Cut (Ctrl+X)"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-40"
              >
                <Scissors className="w-4 h-4" />
              </button>
            </div>

            {/* Font Family & Style */}
            <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
              <select
                onChange={(e) => {
                  if (e.target.value === '__open_font_manager__') {
                    onOpenFontManager?.();
                  } else {
                    onExecCmd('fontName', e.target.value);
                    onUpdateDocumentData({ fontFamily: e.target.value });
                  }
                }}
                defaultValue={docItem.data.fontFamily || 'Inter, system-ui'}
                disabled={isReadOnly}
                className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:ring-1 focus:ring-blue-500 font-medium w-32 truncate"
              >
                <optgroup label="System Fonts">
                  <option value="Inter, system-ui">Modern Sans</option>
                  <option value="Calibri, sans-serif">Calibri</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                  <option value="Courier New, monospace">Courier New</option>
                  <option value="Trebuchet MS, sans-serif">Trebuchet</option>
                </optgroup>
                {customFonts && customFonts.length > 0 && (
                  <optgroup label="Installed Custom Fonts">
                    {customFonts.map((cf) => (
                      <option key={cf.id} value={cf.name}>
                        {cf.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {onOpenFontManager && (
                  <optgroup label="Manage">
                    <option value="__open_font_manager__">+ Install Fonts...</option>
                  </optgroup>
                )}
              </select>
              {onOpenFontManager && (
                <button
                  onClick={onOpenFontManager}
                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded text-xs"
                  title="Install new custom fonts from URL or file"
                >
                  <Type className="w-3.5 h-3.5 text-indigo-600" />
                </button>
              )}

              <select
                onChange={(e) => onExecCmd('fontSize', e.target.value)}
                defaultValue="3"
                disabled={isReadOnly}
                className="text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700 focus:ring-1 focus:ring-blue-500 font-medium w-14"
              >
                <option value="1">10 pt</option>
                <option value="2">11 pt</option>
                <option value="3">12 pt</option>
                <option value="4">14 pt</option>
                <option value="5">18 pt</option>
                <option value="6">24 pt</option>
                <option value="7">36 pt</option>
              </select>
            </div>

            {/* Basic Typography */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
              <button
                onClick={() => onExecCmd('bold')}
                disabled={isReadOnly}
                title="Bold (Ctrl+B)"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700 font-bold disabled:opacity-40"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => onExecCmd('italic')}
                disabled={isReadOnly}
                title="Italic (Ctrl+I)"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-40"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => onExecCmd('underline')}
                disabled={isReadOnly}
                title="Underline (Ctrl+U)"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-40"
              >
                <Underline className="w-4 h-4" />
              </button>
              <button
                onClick={() => onExecCmd('strikeThrough')}
                disabled={isReadOnly}
                title="Strikethrough"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-40"
              >
                <Strikethrough className="w-4 h-4" />
              </button>
              <button
                onClick={() => onExecCmd('subscript')}
                disabled={isReadOnly}
                title="Subscript (X₂)"
                className="px-1.5 py-0.5 text-[11px] font-bold rounded hover:bg-slate-100 text-slate-700 disabled:opacity-40"
              >
                X₂
              </button>
              <button
                onClick={() => onExecCmd('superscript')}
                disabled={isReadOnly}
                title="Superscript (X²)"
                className="px-1.5 py-0.5 text-[11px] font-bold rounded hover:bg-slate-100 text-slate-700 disabled:opacity-40"
              >
                X²
              </button>
            </div>

            {/* Color & Highlight */}
            <div className="relative flex items-center gap-1 pr-2 border-r border-slate-200">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTextColorPicker(!showTextColorPicker);
                    setShowHighlightPicker(false);
                  }}
                  disabled={isReadOnly}
                  title="Text Color"
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-0.5"
                >
                  <Palette className="w-4 h-4 text-blue-600" />
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
                {showTextColorPicker && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-xl p-2 grid grid-cols-4 gap-1.5 z-40">
                    {textColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          onExecCmd('foreColor', color);
                          setShowTextColorPicker(false);
                        }}
                        className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setShowHighlightPicker(!showHighlightPicker);
                    setShowTextColorPicker(false);
                  }}
                  disabled={isReadOnly}
                  title="Highlight Text"
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-0.5"
                >
                  <Highlighter className="w-4 h-4 text-amber-500" />
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
                {showHighlightPicker && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-xl p-2 grid grid-cols-3 gap-1.5 z-40">
                    {highlightColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          onExecCmd('hiliteColor', color);
                          setShowHighlightPicker(false);
                        }}
                        className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition-transform text-[10px] flex items-center justify-center font-bold text-slate-600"
                        style={{ backgroundColor: color }}
                        title={color === 'transparent' ? 'No color' : color}
                      >
                        {color === 'transparent' ? '✕' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Paragraph Alignment & Spacing */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
              <button
                onClick={() => onExecCmd('justifyLeft')}
                disabled={isReadOnly}
                title="Align Left"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onExecCmd('justifyCenter')}
                disabled={isReadOnly}
                title="Align Center"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => onExecCmd('justifyRight')}
                disabled={isReadOnly}
                title="Align Right"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
              >
                <AlignRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onExecCmd('justifyFull')}
                disabled={isReadOnly}
                title="Justify"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
              >
                <AlignJustify className="w-4 h-4" />
              </button>
            </div>

            {/* Lists & Styles */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
              <button
                onClick={() => onExecCmd('insertUnorderedList')}
                disabled={isReadOnly}
                title="Bullet List"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => onExecCmd('insertOrderedList')}
                disabled={isReadOnly}
                title="Numbered List"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  onExecCmd('insertHTML', '<div style="display:flex;align-items:center;gap:8px;margin:4px 0;"><input type="checkbox" style="width:16px;height:16px;" /> <span>Checklist task</span></div>');
                }}
                disabled={isReadOnly}
                title="Checklist Task"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
              >
                <ListChecks className="w-4 h-4 text-emerald-600" />
              </button>
              <button
                onClick={() => onExecCmd('formatBlock', 'blockquote')}
                disabled={isReadOnly}
                title="Blockquote"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
              >
                <Quote className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Heading Styles */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onExecCmd('formatBlock', 'p')}
                className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 font-medium"
                title="Normal text"
              >
                Normal
              </button>
              <button
                onClick={() => onExecCmd('formatBlock', 'h1')}
                className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 font-bold text-blue-900"
                title="Heading 1"
              >
                H1
              </button>
              <button
                onClick={() => onExecCmd('formatBlock', 'h2')}
                className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 font-bold text-blue-800"
                title="Heading 2"
              >
                H2
              </button>
              <button
                onClick={() => onExecCmd('formatBlock', 'h3')}
                className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
                title="Heading 3"
              >
                H3
              </button>
            </div>

            {/* Find and Replace toggle */}
            <div className="ml-auto pl-2 border-l border-slate-200">
              <button
                onClick={onToggleFindReplace}
                className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
                  isFindReplaceOpen ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100 text-slate-600'
                }`}
                title="Find and Replace"
              >
                <Search className="w-4 h-4" />
                <span className="hidden md:inline">Find</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================= INSERT TAB ======================= */}
        {activeTab === 'insert' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-100 flex-wrap sm:flex-nowrap">
            {/* Tables */}
            <div className="relative flex items-center pr-2 border-r border-slate-200">
              <button
                onClick={() => setShowTablePicker(!showTablePicker)}
                disabled={isReadOnly}
                className="px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 font-medium transition-colors"
                title="Insert Table"
              >
                <TableIcon className="w-4 h-4 text-blue-600" />
                <span>Table</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showTablePicker && (
                <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-xl p-3 z-40 w-48">
                  <div className="text-[11px] font-semibold text-slate-600 mb-2">
                    Insert Table: {tableGridHover.rows} × {tableGridHover.cols}
                  </div>
                  <div className="grid grid-cols-5 gap-1 mb-2">
                    {Array.from({ length: 25 }).map((_, i) => {
                      const r = Math.floor(i / 5) + 1;
                      const c = (i % 5) + 1;
                      const isHighlighted = r <= tableGridHover.rows && c <= tableGridHover.cols;
                      return (
                        <div
                          key={i}
                          onMouseEnter={() => setTableGridHover({ rows: r, cols: c })}
                          onClick={() => {
                            onInsertTable(tableGridHover.rows, tableGridHover.cols);
                            setShowTablePicker(false);
                          }}
                          className={`w-6 h-6 border rounded-xs cursor-pointer transition-colors ${
                            isHighlighted ? 'bg-blue-100 border-blue-400' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      onInsertTable(3, 3);
                      setShowTablePicker(false);
                    }}
                    className="w-full py-1 text-center text-xs bg-blue-50 text-blue-700 font-medium rounded hover:bg-blue-100"
                  >
                    Insert Standard 3×3
                  </button>
                </div>
              )}
            </div>

            {/* Media: Images & Links */}
            <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
              <button
                onClick={onInsertImage}
                disabled={isReadOnly}
                className="px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 font-medium"
                title="Insert Image"
              >
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Picture</span>
              </button>
              <button
                onClick={onInsertLink}
                disabled={isReadOnly}
                className="px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 font-medium"
                title="Insert Hyperlink"
              >
                <LinkIcon className="w-4 h-4 text-blue-600" />
                <span>Link</span>
              </button>
              <button
                onClick={() => onExecCmd('insertHorizontalRule')}
                disabled={isReadOnly}
                className="px-2 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-medium"
                title="Horizontal Divider"
              >
                <Minus className="w-4 h-4" />
                <span>Divider</span>
              </button>
            </div>

            {/* Special Callouts & Alert Boxes */}
            <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mr-1">Callouts:</span>
              <button
                onClick={() => onInsertCallout('tip')}
                disabled={isReadOnly}
                className="px-2 py-0.5 text-[11px] rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"
                title="Insert Tip Callout"
              >
                💡 Tip
              </button>
              <button
                onClick={() => onInsertCallout('info')}
                disabled={isReadOnly}
                className="px-2 py-0.5 text-[11px] rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
                title="Insert Info Callout"
              >
                ℹ️ Note
              </button>
              <button
                onClick={() => onInsertCallout('warning')}
                disabled={isReadOnly}
                className="px-2 py-0.5 text-[11px] rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium"
                title="Insert Warning Callout"
              >
                ⚠️ Warning
              </button>
            </div>

            {/* Symbols */}
            <div className="relative flex items-center">
              <button
                onClick={() => setShowSymbolsMenu(!showSymbolsMenu)}
                disabled={isReadOnly}
                className="px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 font-medium"
                title="Insert Special Symbol"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Symbols</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showSymbolsMenu && (
                <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-xl p-2 grid grid-cols-5 gap-1 z-40 w-48">
                  {symbols.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        onInsertSymbol(s);
                        setShowSymbolsMenu(false);
                      }}
                      className="w-8 h-8 rounded hover:bg-blue-50 hover:text-blue-700 text-sm font-semibold flex items-center justify-center border border-slate-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================= LAYOUT TAB ======================= */}
        {activeTab === 'layout' && (
          <div className="flex items-center gap-3 animate-in fade-in duration-100 flex-wrap sm:flex-nowrap">
            {/* Margins */}
            <div className="flex items-center gap-1 pr-3 border-r border-slate-200">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Margins:</span>
              <button
                onClick={() => onUpdateDocumentData({ margins: 'normal' })}
                className={`px-2 py-1 rounded font-medium text-xs transition-colors ${
                  docItem.data.margins !== 'narrow' && docItem.data.margins !== 'wide'
                    ? 'bg-blue-100 text-blue-800'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Normal (1")
              </button>
              <button
                onClick={() => onUpdateDocumentData({ margins: 'narrow' })}
                className={`px-2 py-1 rounded font-medium text-xs transition-colors ${
                  docItem.data.margins === 'narrow' ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Narrow (0.5")
              </button>
              <button
                onClick={() => onUpdateDocumentData({ margins: 'wide' })}
                className={`px-2 py-1 rounded font-medium text-xs transition-colors ${
                  docItem.data.margins === 'wide' ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Wide (2")
              </button>
            </div>

            {/* Page Orientation */}
            <div className="flex items-center gap-1 pr-3 border-r border-slate-200">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Orientation:</span>
              <button
                onClick={() => onUpdateDocumentData({ pageOrientation: 'portrait' })}
                className={`px-2 py-1 rounded font-medium text-xs transition-colors ${
                  docItem.data.pageOrientation !== 'landscape'
                    ? 'bg-blue-100 text-blue-800'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Portrait
              </button>
              <button
                onClick={() => onUpdateDocumentData({ pageOrientation: 'landscape' })}
                className={`px-2 py-1 rounded font-medium text-xs transition-colors ${
                  docItem.data.pageOrientation === 'landscape'
                    ? 'bg-blue-100 text-blue-800'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Landscape
              </button>
            </div>

            {/* Columns */}
            <div className="flex items-center gap-1 pr-3 border-r border-slate-200">
              <Columns className="w-3.5 h-3.5 text-slate-500" />
              <button
                onClick={() => onUpdateDocumentData({ columns: 1 })}
                className={`px-2 py-1 rounded font-medium text-xs ${
                  docItem.data.columns !== 2 ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                1 Col
              </button>
              <button
                onClick={() => onUpdateDocumentData({ columns: 2 })}
                className={`px-2 py-1 rounded font-medium text-xs ${
                  docItem.data.columns === 2 ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                2 Cols
              </button>
            </div>

            {/* Page Color & Watermark */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowPageColorPicker(!showPageColorPicker)}
                  className="px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 font-medium"
                >
                  <Palette className="w-3.5 h-3.5 text-amber-600" />
                  <span>Page Color</span>
                </button>
                {showPageColorPicker && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-xl p-2 grid grid-cols-3 gap-1.5 z-40">
                    {pageColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          onUpdateDocumentData({ pageColor: color });
                          setShowPageColorPicker(false);
                        }}
                        className="w-6 h-6 rounded border border-slate-300 hover:scale-110"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowWatermarkMenu(!showWatermarkMenu)}
                  className="px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 font-medium"
                >
                  <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                  <span>Watermark</span>
                </button>
                {showWatermarkMenu && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-36 z-40">
                    <button
                      onClick={() => {
                        onUpdateDocumentData({ watermark: undefined });
                        setShowWatermarkMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 text-slate-600"
                    >
                      None
                    </button>
                    {['CONFIDENTIAL', 'DRAFT', 'SAMPLE', 'URGENT'].map((wm) => (
                      <button
                        key={wm}
                        onClick={() => {
                          onUpdateDocumentData({ watermark: wm });
                          setShowWatermarkMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 hover:text-blue-700 font-semibold"
                      >
                        {wm}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================= REFERENCES TAB ======================= */}
        {activeTab === 'references' && (
          <div className="flex items-center gap-3 animate-in fade-in duration-100">
            <button
              onClick={onGenerateTOC}
              disabled={isReadOnly}
              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-semibold flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Table of Contents</span>
            </button>
            <div className="h-6 w-[1px] bg-slate-200" />
            <button
              onClick={onInsertFootnote}
              disabled={isReadOnly}
              className="px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-medium"
            >
              <span>Insert Footnote [¹]</span>
            </button>
            <button
              onClick={onInsertCitation}
              disabled={isReadOnly}
              className="px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-medium"
            >
              <span>Insert Citation (Author, Year)</span>
            </button>
          </div>
        )}

        {/* ======================= REVIEW TAB ======================= */}
        {activeTab === 'review' && (
          <div className="flex items-center gap-3 animate-in fade-in duration-100">
            <button
              onClick={onOpenStatsModal}
              className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Type className="w-4 h-4 text-blue-600" />
              <span>Word Count & Statistics</span>
            </button>
            <div className="h-6 w-[1px] bg-slate-200" />

            {/* Text to Speech Read Aloud */}
            <button
              onClick={onToggleSpeech}
              className={`px-3 py-1 rounded font-semibold flex items-center gap-1.5 transition-colors ${
                isSpeaking ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-700" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
              <span>{isSpeaking ? 'Stop Reading' : 'Read Aloud'}</span>
            </button>

            <button
              onClick={() => {
                onExecCmd(
                  'insertHTML',
                  `<mark style="background-color:#fef08a;padding:2px 4px;border-radius:2px;" title="Comment: Review this section">[💬 Note: Needs review]</mark>&nbsp;`
                );
              }}
              disabled={isReadOnly}
              className="px-2.5 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 font-medium"
            >
              <span>New Comment</span>
            </button>
          </div>
        )}

        {/* ======================= VIEW TAB ======================= */}
        {activeTab === 'view' && (
          <div className="flex items-center gap-3 animate-in fade-in duration-100 flex-wrap sm:flex-nowrap">
            {/* View Layout Modes */}
            <div className="flex items-center gap-1 pr-3 border-r border-slate-200">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Layout:</span>
              <button
                onClick={() => onViewModeChange('page')}
                className={`px-2.5 py-1 rounded font-medium text-xs transition-colors ${
                  viewMode === 'page' ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Print Layout
              </button>
              <button
                onClick={() => onViewModeChange('continuous')}
                className={`px-2.5 py-1 rounded font-medium text-xs transition-colors ${
                  viewMode === 'continuous' ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Web Flow
              </button>
              <button
                onClick={() => onViewModeChange('focus')}
                className={`px-2.5 py-1 rounded font-medium text-xs transition-colors ${
                  viewMode === 'focus' ? 'bg-purple-100 text-purple-800' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Focus Mode
              </button>
            </div>

            {/* Show / Hide Elements */}
            <div className="flex items-center gap-3 pr-3 border-r border-slate-200">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRuler}
                  onChange={onToggleRuler}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="text-xs text-slate-700 font-medium">Ruler</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={onToggleDarkMode}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="text-xs text-slate-700 font-medium">Dark Canvas</span>
              </label>
            </div>

            {/* Zoom Presets */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mr-1">Zoom:</span>
              {[75, 100, 125, 150].map((z) => (
                <button
                  key={z}
                  onClick={() => onZoomChange(z)}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] transition-colors ${
                    zoom === z ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {z}%
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
