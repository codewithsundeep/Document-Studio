import React, { useState, useRef, useEffect } from 'react';
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
  Heading1,
  Heading2,
  Heading3,
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
  Eye,
  Edit3,
  X,
  Palette,
  Highlighter,
} from 'lucide-react';
import { WordDocItem } from '../../types';
import { exportWordFile } from '../../utils/fileHelpers';

interface WordEditorProps {
  document: WordDocItem;
  onChange: (updatedDoc: WordDocItem) => void;
  isReadOnly?: boolean;
}

export const WordEditor: React.FC<WordEditorProps> = ({ document: docItem, onChange, isReadOnly = false }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'page' | 'continuous'>('page');
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [showFindReplace, setShowFindReplace] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState<boolean>(false);

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

  const handleInsertTable = () => {
    if (isReadOnly) return;
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left;">Header 1</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left;">Header 2</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left;">Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Cell 1</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Cell 2</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Cell 3</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Cell 4</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Cell 5</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Cell 6</td>
          </tr>
        </tbody>
      </table>
      <p></p>
    `;
    execCmd('insertHTML', tableHtml);
  };

  const handleInsertImage = () => {
    if (isReadOnly) return;
    const url = prompt('Enter image URL (or paste image data):', 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80');
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

  const handleFindReplace = () => {
    if (!findQuery || !editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    // Replace occurrences safely
    const regex = new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newHtml = currentHtml.replace(regex, replaceQuery);
    editorRef.current.innerHTML = newHtml;
    handleInput();
  };

  const handlePrint = () => {
    window.print();
  };

  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const textColors = ['#000000', '#1e3a8a', '#047857', '#b91c1c', '#7c3aed', '#c2410c', '#475569'];
  const highlightColors = ['#fef08a', '#bbf7d0', '#fed7aa', '#fbcfe8', '#bae6fd', 'transparent'];

  return (
    <div id="word-editor-container" className="flex flex-col h-full bg-slate-100 select-text overflow-hidden">
      {/* Top Word Ribbon Toolbar */}
      <div id="word-toolbar" className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center gap-1.5 shadow-xs z-10">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
          <button
            id="word-undo-btn"
            onClick={() => execCmd('undo')}
            disabled={isReadOnly}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            id="word-redo-btn"
            onClick={() => execCmd('redo')}
            disabled={isReadOnly}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Heading / Style Selector */}
        <div className="flex items-center pr-2 border-r border-slate-200">
          <select
            id="word-format-block-select"
            disabled={isReadOnly}
            onChange={(e) => execCmd('formatBlock', e.target.value)}
            defaultValue="p"
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="p">Normal Text</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="blockquote">Quote</option>
            <option value="pre">Code Block</option>
          </select>
        </div>

        {/* Font Family */}
        <div className="flex items-center pr-2 border-r border-slate-200">
          <select
            id="word-font-family-select"
            disabled={isReadOnly}
            onChange={(e) => execCmd('fontName', e.target.value)}
            defaultValue="Inter, system-ui"
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium w-28"
          >
            <option value="Inter, system-ui">Modern Sans</option>
            <option value="Georgia, serif">Classic Serif</option>
            <option value="Courier New, monospace">Monospace</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Times New Roman, serif">Times Roman</option>
          </select>
        </div>

        {/* Basic Text Formatting */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
          <button
            id="word-bold-btn"
            onClick={() => execCmd('bold')}
            disabled={isReadOnly}
            title="Bold (Ctrl+B)"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 font-bold disabled:opacity-40 transition-colors"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            id="word-italic-btn"
            onClick={() => execCmd('italic')}
            disabled={isReadOnly}
            title="Italic (Ctrl+I)"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition-colors"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            id="word-underline-btn"
            onClick={() => execCmd('underline')}
            disabled={isReadOnly}
            title="Underline (Ctrl+U)"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition-colors"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            id="word-strike-btn"
            onClick={() => execCmd('strikeThrough')}
            disabled={isReadOnly}
            title="Strikethrough"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition-colors"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Text Color & Highlight */}
        <div className="relative flex items-center gap-1 pr-2 border-r border-slate-200">
          <div className="relative">
            <button
              id="word-color-picker-toggle"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
              }}
              disabled={isReadOnly}
              title="Text Color"
              className="p-1.5 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1 transition-colors"
            >
              <Palette className="w-4 h-4 text-blue-600" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex gap-1 z-30">
                {textColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      execCmd('foreColor', color);
                      setShowColorPicker(false);
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
              id="word-highlight-picker-toggle"
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowColorPicker(false);
              }}
              disabled={isReadOnly}
              title="Highlight Color"
              className="p-1.5 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1 transition-colors"
            >
              <Highlighter className="w-4 h-4 text-amber-500" />
            </button>
            {showHighlightPicker && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex gap-1 z-30">
                {highlightColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      execCmd('hiliteColor', color);
                      setShowHighlightPicker(false);
                    }}
                    className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition-transform flex items-center justify-center text-[10px]"
                    style={{ backgroundColor: color }}
                    title={color === 'transparent' ? 'Clear' : color}
                  >
                    {color === 'transparent' ? '✕' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
          <button
            id="word-align-left-btn"
            onClick={() => execCmd('justifyLeft')}
            disabled={isReadOnly}
            title="Align Left"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            id="word-align-center-btn"
            onClick={() => execCmd('justifyCenter')}
            disabled={isReadOnly}
            title="Align Center"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            id="word-align-right-btn"
            onClick={() => execCmd('justifyRight')}
            disabled={isReadOnly}
            title="Align Right"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            id="word-align-justify-btn"
            onClick={() => execCmd('justifyFull')}
            disabled={isReadOnly}
            title="Justify"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Insertables */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
          <button
            id="word-bullet-list-btn"
            onClick={() => execCmd('insertUnorderedList')}
            disabled={isReadOnly}
            title="Bullet List"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            id="word-numbered-list-btn"
            onClick={() => execCmd('insertOrderedList')}
            disabled={isReadOnly}
            title="Numbered List"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            id="word-insert-table-btn"
            onClick={handleInsertTable}
            disabled={isReadOnly}
            title="Insert Table"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            id="word-insert-image-btn"
            onClick={handleInsertImage}
            disabled={isReadOnly}
            title="Insert Image"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            id="word-insert-link-btn"
            onClick={handleInsertLink}
            disabled={isReadOnly}
            title="Insert Link"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            id="word-insert-divider-btn"
            onClick={() => execCmd('insertHorizontalRule')}
            disabled={isReadOnly}
            title="Horizontal Divider"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Tools: Find & Replace, Print, View Toggle */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            id="word-find-replace-toggle"
            onClick={() => setShowFindReplace(!showFindReplace)}
            className={`p-1.5 rounded text-xs flex items-center gap-1 ${
              showFindReplace ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100 text-slate-600'
            }`}
            title="Find & Replace"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Find</span>
          </button>

          <button
            id="word-print-btn"
            onClick={handlePrint}
            title="Print Document"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Export Menu */}
          <div className="relative group">
            <button
              id="word-download-dropdown-btn"
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors shadow-xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-44 z-30">
              <button
                onClick={() => exportWordFile(docItem.data, docItem.name, 'doc')}
                className="px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium"
              >
                Download as Word (.doc)
              </button>
              <button
                onClick={() => exportWordFile(docItem.data, docItem.name, 'pdf')}
                className="px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium"
              >
                Download as PDF (.pdf)
              </button>
              <button
                onClick={() => exportWordFile(docItem.data, docItem.name, 'html')}
                className="px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium"
              >
                Download as HTML (.html)
              </button>
              <button
                onClick={() => exportWordFile(docItem.data, docItem.name, 'txt')}
                className="px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium"
              >
                Download Plain Text (.txt)
              </button>
            </div>
          </div>
        </div>
      </div>

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

      {/* Main Document Body Canvas */}
      <div
        id="word-viewport"
        className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-200/70"
        style={{
          perspective: '1000px',
        }}
      >
        <div
          id="word-document-page"
          className={`bg-white text-slate-800 transition-all duration-150 ${
            viewMode === 'page'
              ? 'w-full max-w-[850px] min-h-[1100px] p-8 md:p-14 shadow-lg border border-slate-300 rounded-sm'
              : 'w-full max-w-4xl p-6 shadow-sm border border-slate-200'
          }`}
          style={{
            zoom: `${zoom}%`,
            fontFamily: docItem.data.fontFamily || 'Inter, system-ui, sans-serif',
            fontSize: docItem.data.fontSize || '15px',
            lineHeight: docItem.data.lineSpacing || '1.6',
          }}
        >
          {/* Authentic Editable Canvas */}
          <div
            id="word-content-editable"
            ref={editorRef}
            contentEditable={!isReadOnly}
            suppressContentEditableWarning
            onInput={handleInput}
            className="outline-none min-h-[900px] focus:ring-0 selection:bg-blue-100"
          />
        </div>
      </div>

      {/* Bottom Status & Pagination Bar */}
      <div id="word-status-bar" className="bg-white border-t border-slate-200 px-4 py-1.5 flex items-center justify-between text-xs text-slate-500 select-none">
        <div className="flex items-center gap-4">
          <span>Page 1 of 1</span>
          <span>{wordCount.toLocaleString()} words</span>
          <span>{charCount.toLocaleString()} characters</span>
          <span className="hidden sm:inline">~{readingTimeMinutes} min read</span>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 rounded p-0.5 border border-slate-200">
            <button
              onClick={() => setViewMode('page')}
              className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
                viewMode === 'page' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Page View
            </button>
            <button
              onClick={() => setViewMode('continuous')}
              className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
                viewMode === 'continuous' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Web Flow
            </button>
          </div>

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
    </div>
  );
};
