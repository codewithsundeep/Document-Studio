import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { ExcelCell, ExcelDocItem, ExcelSheet, CustomFontItem } from '../../types';
import {
  colIndexToLabel,
  computeAllCells,
  formatCellValue,
  labelToColIndex,
  parseCellKey,
} from '../../utils/excelFormula';
import { exportExcelFile } from '../../utils/fileHelpers';
import { ExcelRibbon, ExcelRibbonTab } from './ExcelRibbon';
import { ExcelChartModal } from './ExcelChartModal';
import { ExcelFunctionWizardModal } from './ExcelFunctionWizardModal';

interface ExcelEditorProps {
  document: ExcelDocItem;
  onChange: (updatedDoc: ExcelDocItem) => void;
  isReadOnly?: boolean;
  customFonts?: CustomFontItem[];
  onOpenFontManager?: () => void;
}

export const ExcelEditor: React.FC<ExcelEditorProps> = ({
  document: docItem,
  onChange,
  isReadOnly = false,
  customFonts = [],
  onOpenFontManager,
}) => {
  const activeSheetIndex = docItem.data.activeSheetIndex ?? 0;
  const currentSheet = docItem.data.sheets[activeSheetIndex] || docItem.data.sheets[0];

  const [activeTab, setActiveTab] = useState<ExcelRibbonTab>('home');
  const [selectedCellKey, setSelectedCellKey] = useState<string>('A1');
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [cellInputValue, setCellInputValue] = useState<string>('');
  const [isChartModalOpen, setIsChartModalOpen] = useState<boolean>(false);
  const [isFormulaWizardOpen, setIsFormulaWizardOpen] = useState<boolean>(false);
  const [showGridlines, setShowGridlines] = useState<boolean>(true);
  const [showHeaders, setShowHeaders] = useState<boolean>(true);
  const [frozenTopRow, setFrozenTopRow] = useState<boolean>(false);
  const [frozenFirstCol, setFrozenFirstCol] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(100);
  const [isProtected, setIsProtected] = useState<boolean>(false);

  const formulaInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  // Sync formula bar input when selected cell changes
  useEffect(() => {
    if (selectedCellKey && currentSheet) {
      const cell = currentSheet.data[selectedCellKey];
      setCellInputValue(cell ? cell.raw : '');
    }
  }, [selectedCellKey, currentSheet]);

  // Focus inline input when editing
  useEffect(() => {
    if (editingCellKey && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [editingCellKey]);

  // Update cell value
  const handleCommitCellValue = (key: string, value: string) => {
    if (isReadOnly || isProtected) return;
    const existing = currentSheet.data[key] || { raw: '' };
    const updatedData = {
      ...currentSheet.data,
      [key]: {
        ...existing,
        raw: value,
      },
    };

    // Recompute formulas across sheet
    const computedData = computeAllCells(updatedData);

    const updatedSheets = [...docItem.data.sheets];
    updatedSheets[activeSheetIndex] = {
      ...currentSheet,
      data: computedData,
    };

    onChange({
      ...docItem,
      lastModified: Date.now(),
      data: {
        ...docItem.data,
        sheets: updatedSheets,
      },
    });
  };

  // Update cell style attributes (bold, italic, align, bg, color, format)
  const handleUpdateCellStyle = (styleProps: Partial<ExcelCell>) => {
    if (isReadOnly || isProtected || !selectedCellKey) return;
    const existing = currentSheet.data[selectedCellKey] || { raw: '' };
    const updatedCell: ExcelCell = {
      ...existing,
      ...styleProps,
    };

    const updatedData = {
      ...currentSheet.data,
      [selectedCellKey]: updatedCell,
    };

    const updatedSheets = [...docItem.data.sheets];
    updatedSheets[activeSheetIndex] = {
      ...currentSheet,
      data: computeAllCells(updatedData),
    };

    onChange({
      ...docItem,
      lastModified: Date.now(),
      data: {
        ...docItem.data,
        sheets: updatedSheets,
      },
    });
  };

  // Auto-formula insert
  const handleAutoSum = (formulaName: 'SUM' | 'AVERAGE' | 'COUNT' | 'MIN' | 'MAX' = 'SUM') => {
    if (isReadOnly || isProtected || !selectedCellKey) return;
    const parsed = parseCellKey(selectedCellKey);
    if (!parsed) return;

    const colLabel = colIndexToLabel(parsed.col);
    const startRow = Math.max(1, parsed.row - 5);
    const endRow = Math.max(1, parsed.row);
    const formula = `=${formulaName}(${colLabel}${startRow}:${colLabel}${endRow})`;

    setCellInputValue(formula);
    handleCommitCellValue(selectedCellKey, formula);
  };

  // Sort current column
  const handleSort = (direction: 'asc' | 'desc') => {
    if (isReadOnly || isProtected) return;
    const parsed = parseCellKey(selectedCellKey);
    if (!parsed) return;
    const colLabel = colIndexToLabel(parsed.col);

    // Collect rows to sort (from row 2 down to rowCount)
    const rowsToSort: { row: number; val: any; cells: Record<string, ExcelCell> }[] = [];
    for (let r = 2; r <= currentSheet.rowCount; r++) {
      const cell = currentSheet.data[`${colLabel}${r}`];
      const val = cell?.computed !== undefined ? cell.computed : cell?.raw || '';
      const rowCells: Record<string, ExcelCell> = {};
      for (let c = 0; c < currentSheet.colCount; c++) {
        const k = `${colIndexToLabel(c)}${r}`;
        if (currentSheet.data[k]) {
          rowCells[colIndexToLabel(c)] = currentSheet.data[k];
        }
      }
      rowsToSort.push({ row: r, val, cells: rowCells });
    }

    rowsToSort.sort((a, b) => {
      const aNum = parseFloat(String(a.val).replace(/[$,%]/g, ''));
      const bNum = parseFloat(String(b.val).replace(/[$,%]/g, ''));
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      return direction === 'asc' ? String(a.val).localeCompare(String(b.val)) : String(b.val).localeCompare(String(a.val));
    });

    const newData = { ...currentSheet.data };
    rowsToSort.forEach((sortedRow, idx) => {
      const targetRow = idx + 2;
      for (let c = 0; c < currentSheet.colCount; c++) {
        const cLabel = colIndexToLabel(c);
        const cellData = sortedRow.cells[cLabel];
        const targetKey = `${cLabel}${targetRow}`;
        if (cellData) {
          newData[targetKey] = cellData;
        } else {
          delete newData[targetKey];
        }
      }
    });

    const updatedSheets = [...docItem.data.sheets];
    updatedSheets[activeSheetIndex] = {
      ...currentSheet,
      data: computeAllCells(newData),
    };

    onChange({
      ...docItem,
      lastModified: Date.now(),
      data: {
        ...docItem.data,
        sheets: updatedSheets,
      },
    });
  };

  const handleClear = (type: 'all' | 'formats' | 'contents') => {
    if (isReadOnly || isProtected || !selectedCellKey) return;
    const existing = currentSheet.data[selectedCellKey];
    if (!existing) return;

    if (type === 'all' || type === 'contents') {
      handleCommitCellValue(selectedCellKey, '');
    }
    if (type === 'all' || type === 'formats') {
      handleUpdateCellStyle({
        bold: false,
        italic: false,
        underline: false,
        align: undefined,
        bg: undefined,
        color: undefined,
        format: undefined,
        border: undefined,
      });
    }
  };

  const handleAddComment = () => {
    if (isReadOnly || isProtected || !selectedCellKey) return;
    const comment = prompt(`Add cell note/comment to ${selectedCellKey}:`);
    if (comment !== null) {
      handleUpdateCellStyle({ comment: comment.trim() || undefined });
    }
  };

  // Sheet operations
  const handleAddSheet = () => {
    if (isReadOnly) return;
    const newSheetIndex = docItem.data.sheets.length + 1;
    const newSheet: ExcelSheet = {
      id: `sheet-${Date.now()}`,
      name: `Sheet${newSheetIndex}`,
      data: {},
      rowCount: 25,
      colCount: 12,
    };

    onChange({
      ...docItem,
      data: {
        ...docItem.data,
        sheets: [...docItem.data.sheets, newSheet],
        activeSheetIndex: docItem.data.sheets.length,
      },
    });
  };

  const handleRenameSheet = (index: number) => {
    if (isReadOnly) return;
    const currentName = docItem.data.sheets[index].name;
    const newName = prompt('Enter new sheet name:', currentName);
    if (newName && newName.trim()) {
      const updatedSheets = [...docItem.data.sheets];
      updatedSheets[index] = { ...updatedSheets[index], name: newName.trim() };
      onChange({
        ...docItem,
        data: {
          ...docItem.data,
          sheets: updatedSheets,
        },
      });
    }
  };

  const handleDeleteSheet = (index: number) => {
    if (isReadOnly || docItem.data.sheets.length <= 1) return;
    if (confirm(`Delete sheet "${docItem.data.sheets[index].name}"?`)) {
      const updatedSheets = docItem.data.sheets.filter((_, i) => i !== index);
      onChange({
        ...docItem,
        data: {
          ...docItem.data,
          sheets: updatedSheets,
          activeSheetIndex: Math.max(0, index - 1),
        },
      });
    }
  };

  // Insert/Delete rows & columns
  const handleInsertRow = () => {
    if (isReadOnly || isProtected) return;
    const updatedSheet: ExcelSheet = {
      ...currentSheet,
      rowCount: currentSheet.rowCount + 5,
    };
    const updatedSheets = [...docItem.data.sheets];
    updatedSheets[activeSheetIndex] = updatedSheet;
    onChange({ ...docItem, data: { ...docItem.data, sheets: updatedSheets } });
  };

  const handleInsertCol = () => {
    if (isReadOnly || isProtected) return;
    const updatedSheet: ExcelSheet = {
      ...currentSheet,
      colCount: currentSheet.colCount + 3,
    };
    const updatedSheets = [...docItem.data.sheets];
    updatedSheets[activeSheetIndex] = updatedSheet;
    onChange({ ...docItem, data: { ...docItem.data, sheets: updatedSheets } });
  };

  const handleDeleteRow = () => {
    if (isReadOnly || isProtected || currentSheet.rowCount <= 5) return;
    const updatedSheet: ExcelSheet = {
      ...currentSheet,
      rowCount: currentSheet.rowCount - 1,
    };
    const updatedSheets = [...docItem.data.sheets];
    updatedSheets[activeSheetIndex] = updatedSheet;
    onChange({ ...docItem, data: { ...docItem.data, sheets: updatedSheets } });
  };

  const handleDeleteCol = () => {
    if (isReadOnly || isProtected || currentSheet.colCount <= 3) return;
    const updatedSheet: ExcelSheet = {
      ...currentSheet,
      colCount: currentSheet.colCount - 1,
    };
    const updatedSheets = [...docItem.data.sheets];
    updatedSheets[activeSheetIndex] = updatedSheet;
    onChange({ ...docItem, data: { ...docItem.data, sheets: updatedSheets } });
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    const key = `${colIndexToLabel(col)}${row + 1}`;

    if (editingCellKey) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCommitCellValue(editingCellKey, cellInputValue);
        setEditingCellKey(null);
        const nextKey = `${colIndexToLabel(col)}${row + 2}`;
        setSelectedCellKey(nextKey);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleCommitCellValue(editingCellKey, cellInputValue);
        setEditingCellKey(null);
        const nextKey = `${colIndexToLabel(col + 1)}${row + 1}`;
        setSelectedCellKey(nextKey);
      } else if (e.key === 'Escape') {
        setEditingCellKey(null);
        const prev = currentSheet.data[key]?.raw || '';
        setCellInputValue(prev);
      }
      return;
    }

    if (e.key === 'ArrowUp' && row > 0) {
      e.preventDefault();
      setSelectedCellKey(`${colIndexToLabel(col)}${row}`);
    } else if (e.key === 'ArrowDown' && row < currentSheet.rowCount - 1) {
      e.preventDefault();
      setSelectedCellKey(`${colIndexToLabel(col)}${row + 2}`);
    } else if (e.key === 'ArrowLeft' && col > 0) {
      e.preventDefault();
      setSelectedCellKey(`${colIndexToLabel(col - 1)}${row + 1}`);
    } else if (e.key === 'ArrowRight' && col < currentSheet.colCount - 1) {
      e.preventDefault();
      setSelectedCellKey(`${colIndexToLabel(col + 1)}${row + 1}`);
    } else if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault();
      if (!isProtected) setEditingCellKey(key);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (!isProtected) handleCommitCellValue(key, '');
    }
  };

  const currentActiveCell = currentSheet?.data[selectedCellKey];

  // Calculate live statistics
  const stats = useMemo(() => {
    if (!currentSheet) return { count: 0, sum: 0, avg: 0 };
    const values: number[] = [];
    Object.values(currentSheet.data).forEach((cell: ExcelCell) => {
      const v = cell.computed !== undefined ? cell.computed : cell.raw;
      const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[$,%]/g, ''));
      if (!isNaN(n)) {
        values.push(n);
      }
    });
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      count: values.length,
      sum: Math.round(sum * 100) / 100,
      avg: values.length ? Math.round((sum / values.length) * 100) / 100 : 0,
    };
  }, [currentSheet]);

  return (
    <div id="excel-editor-container" className="flex flex-col h-full bg-slate-100 select-none overflow-hidden">
      {/* 1. Full Multi-Tab Ribbon (File, Home, Insert, Page Layout, Formulas, Data, Review, View) */}
      <ExcelRibbon
        document={docItem}
        sheet={currentSheet}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedCellKey={selectedCellKey}
        activeCell={currentActiveCell}
        isReadOnly={isReadOnly}
        onUpdateCellStyle={handleUpdateCellStyle}
        onInsertRow={handleInsertRow}
        onInsertCol={handleInsertCol}
        onDeleteRow={handleDeleteRow}
        onDeleteCol={handleDeleteCol}
        onAutoSum={handleAutoSum}
        onSort={handleSort}
        onClear={handleClear}
        onExport={(fmt) => exportExcelFile(docItem.data, docItem.name)}
        onPrint={() => window.print()}
        onOpenChartModal={() => setIsChartModalOpen(true)}
        onOpenFormulaWizard={() => setIsFormulaWizardOpen(true)}
        showGridlines={showGridlines}
        onToggleGridlines={() => setShowGridlines(!showGridlines)}
        showHeaders={showHeaders}
        onToggleHeaders={() => setShowHeaders(!showHeaders)}
        frozenTopRow={frozenTopRow}
        onToggleFreezeTopRow={() => setFrozenTopRow(!frozenTopRow)}
        frozenFirstCol={frozenFirstCol}
        onToggleFreezeFirstCol={() => setFrozenFirstCol(!frozenFirstCol)}
        zoom={zoom}
        onZoomChange={setZoom}
        isProtected={isProtected}
        onToggleProtect={() => setIsProtected(!isProtected)}
        onAddComment={handleAddComment}
        stats={stats}
        customFonts={customFonts}
        onOpenFontManager={onOpenFontManager}
      />

      {/* Formula Bar */}
      <div id="excel-formula-bar" className="bg-white border-b border-slate-200 px-4 py-1.5 flex items-center gap-2 text-xs">
        <div className="w-14 px-2 py-1 bg-slate-100 border border-slate-200 rounded text-center font-mono font-bold text-slate-700">
          {selectedCellKey}
        </div>
        <div className="font-serif italic text-slate-400 font-bold px-1 select-none">fx</div>
        <input
          id="excel-formula-input"
          ref={formulaInputRef}
          type="text"
          value={cellInputValue}
          disabled={isReadOnly || isProtected}
          onChange={(e) => setCellInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCommitCellValue(selectedCellKey, cellInputValue);
            }
          }}
          onBlur={() => {
            handleCommitCellValue(selectedCellKey, cellInputValue);
          }}
          placeholder="Type cell value or formula (e.g. =SUM(A1:A5))..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-800 font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Spreadsheet Grid Viewport */}
      <div
        id="excel-grid-viewport"
        className="flex-1 overflow-auto bg-slate-100 relative"
        style={{ zoom: `${zoom}%` }}
      >
        <table className="border-collapse table-fixed bg-white">
          {/* Column Header Row */}
          {showHeaders && (
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-xs font-semibold sticky top-0 z-20">
                <th className="w-12 min-w-12 h-7 border border-slate-300 bg-slate-200/80 sticky left-0 z-30"></th>
                {Array.from({ length: currentSheet.colCount }).map((_, c) => {
                  const label = colIndexToLabel(c);
                  return (
                    <th
                      key={c}
                      className="w-28 min-w-28 h-7 border border-slate-300 bg-slate-100 text-center font-mono font-medium text-slate-700 select-none"
                    >
                      {label}
                    </th>
                  );
                })}
              </tr>
            </thead>
          )}

          {/* Grid Body */}
          <tbody>
            {Array.from({ length: currentSheet.rowCount }).map((_, r) => {
              const rowNum = r + 1;
              const isRowFrozen = frozenTopRow && r === 0;

              return (
                <tr key={r} className={`h-6 ${isRowFrozen ? 'sticky top-7 z-10 bg-slate-50 shadow-xs' : ''}`}>
                  {/* Row Header */}
                  {showHeaders && (
                    <td className="w-12 min-w-12 border border-slate-300 bg-slate-100 text-center font-mono text-xs text-slate-600 font-medium sticky left-0 z-10 select-none">
                      {rowNum}
                    </td>
                  )}

                  {/* Row Cells */}
                  {Array.from({ length: currentSheet.colCount }).map((_, c) => {
                    const key = `${colIndexToLabel(c)}${rowNum}`;
                    const cell = currentSheet.data[key];
                    const isSelected = selectedCellKey === key;
                    const isEditing = editingCellKey === key;
                    const displayValue = formatCellValue(cell);
                    const isColFrozen = frozenFirstCol && c === 0;

                    let borderClass = showGridlines ? 'border border-slate-200' : 'border border-transparent';
                    if (cell?.border === 'all') borderClass = 'border-2 border-slate-700';
                    else if (cell?.border === 'bottom') borderClass = 'border-b-2 border-slate-700';
                    else if (cell?.border === 'box') borderClass = 'border-2 border-emerald-600';

                    return (
                      <td
                        key={c}
                        onClick={() => {
                          setSelectedCellKey(key);
                          if (isEditing && editingCellKey !== key) {
                            handleCommitCellValue(editingCellKey, cellInputValue);
                            setEditingCellKey(null);
                          }
                        }}
                        onDoubleClick={() => {
                          if (!isReadOnly && !isProtected) {
                            setEditingCellKey(key);
                          }
                        }}
                        onKeyDown={(e) => handleKeyDown(e, r, c)}
                        tabIndex={0}
                        style={{
                          backgroundColor: cell?.bg || undefined,
                          color: cell?.color || undefined,
                          fontFamily: cell?.fontFamily || undefined,
                          fontWeight: cell?.bold ? 'bold' : 'normal',
                          fontStyle: cell?.italic ? 'italic' : 'normal',
                          textDecoration: cell?.underline ? 'underline' : 'none',
                          textAlign: cell?.align || (cell?.format === 'currency' || !isNaN(Number(cell?.raw)) ? 'right' : 'left'),
                        }}
                        className={`w-28 min-w-28 px-1.5 py-0.5 ${borderClass} text-xs font-sans relative truncate transition-all cursor-cell outline-hidden ${
                          isColFrozen ? 'sticky left-12 z-10' : ''
                        } ${
                          isSelected
                            ? 'ring-2 ring-emerald-600 ring-inset z-10 bg-emerald-50/20'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {isEditing ? (
                          <input
                            ref={inlineInputRef}
                            type="text"
                            value={cellInputValue}
                            onChange={(e) => setCellInputValue(e.target.value)}
                            onBlur={() => {
                              handleCommitCellValue(key, cellInputValue);
                              setEditingCellKey(null);
                            }}
                            className="w-full h-full p-0 m-0 bg-white outline-none border-none font-sans text-xs"
                          />
                        ) : (
                          <span className="block truncate">{displayValue}</span>
                        )}

                        {/* Little cell comment marker */}
                        {cell?.comment && (
                          <div
                            className="absolute top-0 right-0 w-0 h-0 border-t-6 border-t-amber-500 border-l-6 border-l-transparent"
                            title={`Note: ${cell.comment}`}
                          />
                        )}

                        {/* Little cell drag handle when selected */}
                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-emerald-600 rounded-xs pointer-events-none" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Sheet Tabs Bar & Summary */}
      <div id="excel-sheet-tabs-bar" className="bg-white border-t border-slate-200 px-3 py-1 flex items-center justify-between text-xs select-none">
        {/* Sheet Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {docItem.data.sheets.map((sheet, index) => {
            const isActive = index === activeSheetIndex;
            return (
              <div
                key={sheet.id || index}
                onClick={() => {
                  onChange({
                    ...docItem,
                    data: {
                      ...docItem.data,
                      activeSheetIndex: index,
                    },
                  });
                }}
                onDoubleClick={() => handleRenameSheet(index)}
                className={`group px-3 py-1 rounded-t flex items-center gap-2 cursor-pointer border-t-2 font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 border-emerald-600 text-emerald-800 font-semibold'
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{sheet.name}</span>
                {docItem.data.sheets.length > 1 && !isReadOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSheet(index);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-600 transition-opacity"
                    title="Delete Sheet"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {!isReadOnly && (
            <button
              id="excel-add-sheet-btn"
              onClick={handleAddSheet}
              title="Add Sheet"
              className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors ml-1"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selected Range Live Statistics */}
        <div className="flex items-center gap-4 text-slate-600 font-mono text-[11px] pr-2">
          <span>
            Cell: <strong className="text-slate-800">{selectedCellKey}</strong>
          </span>
          <span>
            Count: <strong className="text-slate-800">{stats.count}</strong>
          </span>
          <span>
            Sum: <strong className="text-slate-800">${stats.sum.toLocaleString()}</strong>
          </span>
          <span className="hidden sm:inline">
            Avg: <strong className="text-slate-800">${stats.avg.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      {/* Recommended Chart Modal */}
      <ExcelChartModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        sheet={currentSheet}
      />

      {/* Formula Wizard Modal */}
      <ExcelFunctionWizardModal
        isOpen={isFormulaWizardOpen}
        onClose={() => setIsFormulaWizardOpen(false)}
        selectedCellKey={selectedCellKey}
        onInsertFunction={(formula) => {
          setCellInputValue(formula);
          handleCommitCellValue(selectedCellKey, formula);
        }}
      />
    </div>
  );
};
