import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  DollarSign,
  Percent,
  Plus,
  Trash2,
  FileDown,
  Sigma,
  TableProperties,
  ArrowDown,
  ArrowRight,
  PaintBucket,
  Palette,
  Undo,
  Redo,
  Copy,
  Scissors,
  BarChart2,
  Table,
  Lock,
  Unlock,
  Filter,
  ArrowUpDown,
  Grid,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Info,
  ChevronDown,
  Calculator,
  MessageSquare,
  HelpCircle,
  Eye,
  Type,
} from 'lucide-react';
import { ExcelCell, ExcelDocItem, ExcelSheet, CustomFontItem } from '../../types';

export type ExcelRibbonTab = 'file' | 'home' | 'insert' | 'page_layout' | 'formulas' | 'data' | 'review' | 'view';

interface ExcelRibbonProps {
  document: ExcelDocItem;
  sheet: ExcelSheet;
  activeTab: ExcelRibbonTab;
  onTabChange: (tab: ExcelRibbonTab) => void;
  selectedCellKey: string;
  activeCell?: ExcelCell;
  isReadOnly?: boolean;
  onUpdateCellStyle: (stylePatch: Partial<ExcelCell>) => void;
  onInsertRow: () => void;
  onInsertCol: () => void;
  onDeleteRow: () => void;
  onDeleteCol: () => void;
  onAutoSum: (funcName?: 'SUM' | 'AVERAGE' | 'COUNT' | 'MAX' | 'MIN') => void;
  onSort: (direction: 'asc' | 'desc') => void;
  onClear: (type: 'all' | 'formats' | 'contents') => void;
  onExport: (format: 'xlsx' | 'csv') => void;
  onPrint: () => void;
  onOpenChartModal: () => void;
  onOpenFormulaWizard: () => void;
  showGridlines: boolean;
  onToggleGridlines: () => void;
  showHeaders: boolean;
  onToggleHeaders: () => void;
  frozenTopRow: boolean;
  onToggleFreezeTopRow: () => void;
  frozenFirstCol: boolean;
  onToggleFreezeFirstCol: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  isProtected: boolean;
  onToggleProtect: () => void;
  onAddComment: () => void;
  stats: { count: number; sum: number; avg: number };
  customFonts?: CustomFontItem[];
  onOpenFontManager?: () => void;
}

export const ExcelRibbon: React.FC<ExcelRibbonProps> = ({
  document: docItem,
  sheet,
  activeTab,
  onTabChange,
  selectedCellKey,
  activeCell,
  isReadOnly = false,
  onUpdateCellStyle,
  onInsertRow,
  onInsertCol,
  onDeleteRow,
  onDeleteCol,
  onAutoSum,
  onSort,
  onClear,
  onExport,
  onPrint,
  onOpenChartModal,
  onOpenFormulaWizard,
  showGridlines,
  onToggleGridlines,
  showHeaders,
  onToggleHeaders,
  frozenTopRow,
  onToggleFreezeTopRow,
  frozenFirstCol,
  onToggleFreezeFirstCol,
  zoom,
  onZoomChange,
  isProtected,
  onToggleProtect,
  onAddComment,
  stats,
  customFonts = [],
  onOpenFontManager,
}) => {
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAutoSumMenu, setShowAutoSumMenu] = useState(false);
  const [showClearMenu, setShowClearMenu] = useState(false);
  const [showBordersMenu, setShowBordersMenu] = useState(false);

  const bgPalette = ['#ffffff', '#f8fafc', '#f1f5f9', '#e0f2fe', '#dcfce7', '#fef3c7', '#fee2e2', '#f3e8ff', '#fce7f3'];
  const textPalette = ['#0f172a', '#1e3a8a', '#166534', '#991b1b', '#6b21a8', '#9a3412', '#475569'];

  const tabs: { id: ExcelRibbonTab; label: string }[] = [
    { id: 'file', label: 'File' },
    { id: 'home', label: 'Home' },
    { id: 'insert', label: 'Insert' },
    { id: 'page_layout', label: 'Page Layout' },
    { id: 'formulas', label: 'Formulas' },
    { id: 'data', label: 'Data' },
    { id: 'review', label: 'Review' },
    { id: 'view', label: 'View' },
  ];

  return (
    <div id="excel-ribbon-container" className="bg-white border-b border-slate-200 select-none shadow-xs z-20">
      {/* 1. Ribbon Tab Headers */}
      <div className="flex items-center px-3 bg-slate-100/90 border-b border-slate-200 gap-0.5 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`excel-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all border-b-2 ${
                isActive
                  ? 'border-emerald-700 text-emerald-700 bg-white shadow-xs rounded-t-md -mb-[1px]'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-t-md'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 2. Ribbon Action Toolbar */}
      <div className="min-h-[58px] px-3 py-1.5 flex items-center gap-2 overflow-x-auto text-xs text-slate-700">
        {/* ======================= FILE TAB ======================= */}
        {activeTab === 'file' && (
          <div className="flex items-center gap-3 animate-in fade-in duration-100">
            {/* Sheet Info */}
            <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                XLS
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900 text-xs truncate max-w-[150px]">{sheet.name}</div>
                <div className="text-[10px] text-slate-500">
                  {sheet.rowCount} rows × {sheet.colCount} cols • {docItem.data.sheets.length} sheet(s)
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-200">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mr-1">Export:</span>
              <button
                onClick={() => onExport('xlsx')}
                className="px-2.5 py-1 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-xs"
                title="Download as Excel Workbook (.xlsx)"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => onExport('csv')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                title="Download as CSV file"
              >
                CSV (.csv)
              </button>
            </div>

            {/* Print */}
            <button
              onClick={onPrint}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Grid</span>
            </button>
          </div>
        )}

        {/* ======================= HOME TAB ======================= */}
        {activeTab === 'home' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-100 flex-wrap sm:flex-nowrap">
            {/* Font Family Selector */}
            <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
              <select
                value={activeCell?.fontFamily || 'Inter, system-ui'}
                onChange={(e) => {
                  if (e.target.value === '__open_font_manager__') {
                    onOpenFontManager?.();
                  } else {
                    onUpdateCellStyle({ fontFamily: e.target.value });
                  }
                }}
                disabled={isReadOnly || isProtected}
                className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 focus:ring-1 focus:ring-emerald-500 font-medium w-28 truncate"
                title="Cell Font Family"
              >
                <optgroup label="System Fonts">
                  <option value="Inter, system-ui">Modern Sans</option>
                  <option value="Calibri, sans-serif">Calibri</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                  <option value="Courier New, monospace">Courier New</option>
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
                  className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded text-xs"
                  title="Install custom fonts saved to IndexedDB"
                >
                  <Type className="w-3.5 h-3.5 text-emerald-600" />
                </button>
              )}
            </div>

            {/* Font Styling */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
              <button
                onClick={() => onUpdateCellStyle({ bold: !activeCell?.bold })}
                disabled={isReadOnly || isProtected}
                title="Bold (Ctrl+B)"
                className={`p-1.5 rounded transition-colors ${
                  activeCell?.bold ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Bold className="w-4 h-4 font-bold" />
              </button>
              <button
                onClick={() => onUpdateCellStyle({ italic: !activeCell?.italic })}
                disabled={isReadOnly || isProtected}
                title="Italic (Ctrl+I)"
                className={`p-1.5 rounded transition-colors ${
                  activeCell?.italic ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => onUpdateCellStyle({ underline: !activeCell?.underline })}
                disabled={isReadOnly || isProtected}
                title="Underline (Ctrl+U)"
                className={`p-1.5 rounded transition-colors ${
                  activeCell?.underline ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Underline className="w-4 h-4" />
              </button>
            </div>

            {/* Cell Fill Background & Font Color */}
            <div className="relative flex items-center gap-1 pr-2 border-r border-slate-200">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowBgPicker(!showBgPicker);
                    setShowColorPicker(false);
                  }}
                  disabled={isReadOnly || isProtected}
                  title="Fill Background Color"
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-0.5"
                >
                  <PaintBucket className="w-4 h-4 text-emerald-600" />
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
                {showBgPicker && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-xl p-2 grid grid-cols-3 gap-1.5 z-40">
                    {bgPalette.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          onUpdateCellStyle({ bg: c === '#ffffff' ? undefined : c });
                          setShowBgPicker(false);
                        }}
                        className="w-5 h-5 rounded border border-slate-300 hover:scale-110"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setShowColorPicker(!showColorPicker);
                    setShowBgPicker(false);
                  }}
                  disabled={isReadOnly || isProtected}
                  title="Font Color"
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-0.5"
                >
                  <Palette className="w-4 h-4 text-blue-600" />
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
                {showColorPicker && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-xl p-2 grid grid-cols-4 gap-1.5 z-40">
                    {textPalette.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          onUpdateCellStyle({ color: c });
                          setShowColorPicker(false);
                        }}
                        className="w-5 h-5 rounded border border-slate-300 hover:scale-110"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Cell Borders */}
              <div className="relative">
                <button
                  onClick={() => setShowBordersMenu(!showBordersMenu)}
                  disabled={isReadOnly || isProtected}
                  title="Cell Borders"
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-0.5"
                >
                  <Grid className="w-4 h-4 text-slate-600" />
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
                {showBordersMenu && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-32 z-40">
                    <button
                      onClick={() => {
                        onUpdateCellStyle({ border: 'all' });
                        setShowBordersMenu(false);
                      }}
                      className="w-full text-left px-3 py-1 text-xs hover:bg-slate-100 font-medium"
                    >
                      All Borders
                    </button>
                    <button
                      onClick={() => {
                        onUpdateCellStyle({ border: 'box' });
                        setShowBordersMenu(false);
                      }}
                      className="w-full text-left px-3 py-1 text-xs hover:bg-slate-100 font-medium"
                    >
                      Thick Box Border
                    </button>
                    <button
                      onClick={() => {
                        onUpdateCellStyle({ border: 'bottom' });
                        setShowBordersMenu(false);
                      }}
                      className="w-full text-left px-3 py-1 text-xs hover:bg-slate-100 font-medium"
                    >
                      Bottom Border
                    </button>
                    <button
                      onClick={() => {
                        onUpdateCellStyle({ border: 'none' });
                        setShowBordersMenu(false);
                      }}
                      className="w-full text-left px-3 py-1 text-xs hover:bg-slate-100 text-slate-500"
                    >
                      No Border
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
              <button
                onClick={() => onUpdateCellStyle({ align: 'left' })}
                disabled={isReadOnly || isProtected}
                title="Align Left"
                className={`p-1.5 rounded ${activeCell?.align === 'left' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onUpdateCellStyle({ align: 'center' })}
                disabled={isReadOnly || isProtected}
                title="Align Center"
                className={`p-1.5 rounded ${activeCell?.align === 'center' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => onUpdateCellStyle({ align: 'right' })}
                disabled={isReadOnly || isProtected}
                title="Align Right"
                className={`p-1.5 rounded ${activeCell?.align === 'right' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>

            {/* Number Formats */}
            <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
              <button
                onClick={() => onUpdateCellStyle({ format: activeCell?.format === 'currency' ? undefined : 'currency' })}
                disabled={isReadOnly || isProtected}
                title="Currency ($)"
                className={`px-2 py-1 rounded font-medium flex items-center gap-0.5 ${
                  activeCell?.format === 'currency' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>$</span>
              </button>
              <button
                onClick={() => onUpdateCellStyle({ format: activeCell?.format === 'percent' ? undefined : 'percent' })}
                disabled={isReadOnly || isProtected}
                title="Percent (%)"
                className={`px-2 py-1 rounded font-medium flex items-center gap-0.5 ${
                  activeCell?.format === 'percent' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>%</span>
              </button>
            </div>

            {/* Cell Rows & Columns Operations */}
            <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
              <button
                onClick={onInsertRow}
                disabled={isReadOnly || isProtected}
                title="Insert Row Below"
                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-200 flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-emerald-600" />
                <span>Row</span>
              </button>
              <button
                onClick={onInsertCol}
                disabled={isReadOnly || isProtected}
                title="Insert Column Right"
                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded border border-slate-200 flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-emerald-600" />
                <span>Col</span>
              </button>
              <button
                onClick={onDeleteRow}
                disabled={isReadOnly || isProtected}
                title="Delete Row"
                className="p-1 hover:bg-red-50 text-red-600 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* AutoSum & Clear */}
            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={() => setShowAutoSumMenu(!showAutoSumMenu)}
                  disabled={isReadOnly || isProtected}
                  title="AutoSum"
                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold flex items-center gap-1"
                >
                  <Sigma className="w-3.5 h-3.5" />
                  <span>AutoSum</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
                {showAutoSumMenu && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-28 z-40">
                    {(['SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN'] as const).map((fn) => (
                      <button
                        key={fn}
                        onClick={() => {
                          onAutoSum(fn);
                          setShowAutoSumMenu(false);
                        }}
                        className="w-full text-left px-3 py-1 text-xs hover:bg-emerald-50 hover:text-emerald-800 font-mono font-medium"
                      >
                        {fn}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort A-Z */}
              <button
                onClick={() => onSort('asc')}
                disabled={isReadOnly || isProtected}
                title="Sort Ascending A to Z"
                className="p-1.5 rounded hover:bg-slate-100 text-slate-700"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ======================= INSERT TAB ======================= */}
        {activeTab === 'insert' && (
          <div className="flex items-center gap-3 animate-in fade-in duration-100">
            <button
              onClick={onOpenChartModal}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <BarChart2 className="w-4 h-4" />
              <span>Recommended Charts</span>
            </button>
            <div className="h-6 w-[1px] bg-slate-200" />

            <button
              onClick={() => {
                onUpdateCellStyle({ bg: '#f1f5f9', bold: true, border: 'bottom' });
              }}
              disabled={isReadOnly || isProtected}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 font-medium"
            >
              <Table className="w-3.5 h-3.5 text-blue-600" />
              <span>Format as Table</span>
            </button>

            <button
              onClick={onAddComment}
              disabled={isReadOnly || isProtected}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 font-medium"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Cell Note / Comment</span>
            </button>
          </div>
        )}

        {/* ======================= PAGE LAYOUT TAB ======================= */}
        {activeTab === 'page_layout' && (
          <div className="flex items-center gap-4 animate-in fade-in duration-100">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showGridlines}
                onChange={onToggleGridlines}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <span className="text-xs text-slate-700 font-medium">Show Gridlines</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showHeaders}
                onChange={onToggleHeaders}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <span className="text-xs text-slate-700 font-medium">Show Headings (A, B, C / 1, 2, 3)</span>
            </label>

            <div className="h-6 w-[1px] bg-slate-200" />
            <span className="text-slate-500 text-xs">Print Area: Entire Worksheet</span>
          </div>
        )}

        {/* ======================= FORMULAS TAB ======================= */}
        {activeTab === 'formulas' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-100 flex-wrap sm:flex-nowrap">
            <button
              onClick={onOpenFormulaWizard}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Calculator className="w-4 h-4" />
              <span>Insert Function Wizard</span>
            </button>
            <div className="h-6 w-[1px] bg-slate-200" />

            {/* Quick AutoSum */}
            <button
              onClick={() => onAutoSum('SUM')}
              disabled={isReadOnly || isProtected}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-semibold"
            >
              Σ SUM
            </button>
            <button
              onClick={() => onAutoSum('AVERAGE')}
              disabled={isReadOnly || isProtected}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-semibold"
            >
              AVERAGE
            </button>
            <button
              onClick={() => onAutoSum('COUNT')}
              disabled={isReadOnly || isProtected}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-semibold"
            >
              COUNT
            </button>
            <button
              onClick={() => onAutoSum('MAX')}
              disabled={isReadOnly || isProtected}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-semibold"
            >
              MAX
            </button>
            <button
              onClick={() => onAutoSum('MIN')}
              disabled={isReadOnly || isProtected}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-semibold"
            >
              MIN
            </button>
          </div>
        )}

        {/* ======================= DATA TAB ======================= */}
        {activeTab === 'data' && (
          <div className="flex items-center gap-3 animate-in fade-in duration-100">
            <button
              onClick={() => onSort('asc')}
              disabled={isReadOnly || isProtected}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 font-medium"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sort A to Z</span>
            </button>
            <button
              onClick={() => onSort('desc')}
              disabled={isReadOnly || isProtected}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 font-medium"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sort Z to A</span>
            </button>
            <div className="h-6 w-[1px] bg-slate-200" />
            <button
              onClick={() => alert(`Active column has ${stats.count} numeric records with total ${stats.sum}`)}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 font-medium"
            >
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Column Data Audit</span>
            </button>
          </div>
        )}

        {/* ======================= REVIEW TAB ======================= */}
        {activeTab === 'review' && (
          <div className="flex items-center gap-3 animate-in fade-in duration-100">
            <button
              onClick={onToggleProtect}
              className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors ${
                isProtected ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isProtected ? <Lock className="w-3.5 h-3.5 text-amber-700" /> : <Unlock className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isProtected ? 'Sheet Protected (Locked)' : 'Protect Sheet'}</span>
            </button>

            <button
              onClick={onAddComment}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 font-medium"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>New Comment on {selectedCellKey}</span>
            </button>
          </div>
        )}

        {/* ======================= VIEW TAB ======================= */}
        {activeTab === 'view' && (
          <div className="flex items-center gap-3 animate-in fade-in duration-100 flex-wrap sm:flex-nowrap">
            {/* Freeze Panes */}
            <div className="flex items-center gap-1 pr-3 border-r border-slate-200">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Freeze:</span>
              <button
                onClick={onToggleFreezeTopRow}
                className={`px-2 py-1 rounded font-medium text-xs transition-colors ${
                  frozenTopRow ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Top Row
              </button>
              <button
                onClick={onToggleFreezeFirstCol}
                className={`px-2 py-1 rounded font-medium text-xs transition-colors ${
                  frozenFirstCol ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                First Col
              </button>
            </div>

            {/* Zoom Presets */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mr-1">Zoom:</span>
              {[75, 100, 125, 150].map((z) => (
                <button
                  key={z}
                  onClick={() => onZoomChange(z)}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] transition-colors ${
                    zoom === z ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
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
