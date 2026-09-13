import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bold,
  Italic,
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
} from 'lucide-react';
import { ExcelCell, ExcelDocItem, ExcelSheet } from '../../types';
import {
  colIndexToLabel,
  computeAllCells,
  formatCellValue,
  labelToColIndex,
  parseCellKey,
} from '../../utils/excelFormula';
import { exportExcelFile } from '../../utils/fileHelpers';

interface ExcelEditorProps {
  document: ExcelDocItem;
  onChange: (updatedDoc: ExcelDocItem) => void;
  isReadOnly?: boolean;
}

export const ExcelEditor: React.FC<ExcelEditorProps> = ({ document: docItem, onChange, isReadOnly = false }) => {
  const activeSheetIndex = docItem.data.activeSheetIndex ?? 0;
  const currentSheet = docItem.data.sheets[activeSheetIndex] || docItem.data.sheets[0];

  const [selectedCellKey, setSelectedCellKey] = useState<string>('A1');
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [cellInputValue, setCellInputValue] = useState<string>('');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showBgPicker, setShowBgPicker] = useState<boolean>(false);

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
    if (isReadOnly) return;
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
    if (isReadOnly || !selectedCellKey) return;
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

  // Quick auto-formula insert
  const handleInsertFormula = (formulaName: 'SUM' | 'AVERAGE' | 'COUNT' | 'MIN' | 'MAX') => {
    if (isReadOnly || !selectedCellKey) return;
    const parsed = parseCellKey(selectedCellKey);
    if (!parsed) return;

    // By default, target the cells above in the same column
    const colLabel = colIndexToLabel(parsed.col);
    const startRow = Math.max(1, parsed.row - 5);
    const endRow = Math.max(1, parsed.row);
    const formula = `=${formulaName}(${colLabel}${startRow}:${colLabel}${endRow})`;

    setCellInputValue(formula);
    handleCommitCellValue(selectedCellKey, formula);
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
    if (isReadOnly) return;
    const updatedSheet: ExcelSheet = {
      ...currentSheet,
      rowCount: currentSheet.rowCount + 5,
    };
    const updatedSheets = [...docItem.data.sheets];
    updatedSheets[activeSheetIndex] = updatedSheet;
    onChange({ ...docItem, data: { ...docItem.data, sheets: updatedSheets } });
  };

  const handleInsertCol = () => {
    if (isReadOnly) return;
    const updatedSheet: ExcelSheet = {
      ...currentSheet,
      colCount: currentSheet.colCount + 3,
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
        // Move to row below
        const nextKey = `${colIndexToLabel(col)}${row + 2}`;
        setSelectedCellKey(nextKey);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleCommitCellValue(editingCellKey, cellInputValue);
        setEditingCellKey(null);
        // Move to next column
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
      setEditingCellKey(key);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      handleCommitCellValue(key, '');
    }
  };

  // Current active cell data
  const currentActiveCell = currentSheet?.data[selectedCellKey];

  // Calculate live statistics of selected / non-empty cells
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

  const bgPalette = ['#ffffff', '#f8fafc', '#f1f5f9', '#e0f2fe', '#dcfce7', '#fef3c7', '#fee2e2', '#f3e8ff'];
  const textPalette = ['#0f172a', '#1e3a8a', '#166534', '#991b1b', '#6b21a8', '#9a3412', '#475569'];

  return (
    <div id="excel-editor-container" className="flex flex-col h-full bg-slate-100 select-none overflow-hidden">
      {/* Top Excel Ribbon Toolbar */}
      <div id="excel-toolbar" className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center gap-1.5 shadow-xs z-10">
        {/* Cell Formatting */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
          <button
            id="excel-bold-btn"
            onClick={() => handleUpdateCellStyle({ bold: !currentActiveCell?.bold })}
            disabled={isReadOnly}
            title="Bold"
            className={`p-1.5 rounded transition-colors ${
              currentActiveCell?.bold ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Bold className="w-4 h-4 font-bold" />
          </button>
          <button
            id="excel-italic-btn"
            onClick={() => handleUpdateCellStyle({ italic: !currentActiveCell?.italic })}
            disabled={isReadOnly}
            title="Italic"
            className={`p-1.5 rounded transition-colors ${
              currentActiveCell?.italic ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Italic className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
          <button
            id="excel-align-left"
            onClick={() => handleUpdateCellStyle({ align: 'left' })}
            disabled={isReadOnly}
            title="Align Left"
            className={`p-1.5 rounded transition-colors ${
              currentActiveCell?.align === 'left' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            id="excel-align-center"
            onClick={() => handleUpdateCellStyle({ align: 'center' })}
            disabled={isReadOnly}
            title="Align Center"
            className={`p-1.5 rounded transition-colors ${
              currentActiveCell?.align === 'center' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            id="excel-align-right"
            onClick={() => handleUpdateCellStyle({ align: 'right' })}
            disabled={isReadOnly}
            title="Align Right"
            className={`p-1.5 rounded transition-colors ${
              currentActiveCell?.align === 'right' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Number Formats */}
        <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
          <button
            id="excel-format-currency"
            onClick={() => handleUpdateCellStyle({ format: currentActiveCell?.format === 'currency' ? undefined : 'currency' })}
            disabled={isReadOnly}
            title="Currency Format ($)"
            className={`px-2 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
              currentActiveCell?.format === 'currency' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Currency</span>
          </button>
          <button
            id="excel-format-percent"
            onClick={() => handleUpdateCellStyle({ format: currentActiveCell?.format === 'percent' ? undefined : 'percent' })}
            disabled={isReadOnly}
            title="Percentage Format (%)"
            className={`px-2 py-1 text-xs rounded font-medium flex items-center gap-1 transition-colors ${
              currentActiveCell?.format === 'percent' ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Percent</span>
          </button>
        </div>

        {/* Cell Background & Text Color */}
        <div className="relative flex items-center gap-1 pr-2 border-r border-slate-200">
          <div className="relative">
            <button
              id="excel-fill-color-btn"
              onClick={() => {
                setShowBgPicker(!showBgPicker);
                setShowColorPicker(false);
              }}
              disabled={isReadOnly}
              title="Fill Color"
              className="p-1.5 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1 transition-colors"
            >
              <PaintBucket className="w-4 h-4 text-emerald-600" />
            </button>
            {showBgPicker && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1 z-30">
                {bgPalette.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      handleUpdateCellStyle({ bg: c === '#ffffff' ? undefined : c });
                      setShowBgPicker(false);
                    }}
                    className="w-5 h-5 rounded border border-slate-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              id="excel-text-color-btn"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowBgPicker(false);
              }}
              disabled={isReadOnly}
              title="Text Color"
              className="p-1.5 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1 transition-colors"
            >
              <Palette className="w-4 h-4 text-blue-600" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1 z-30">
                {textPalette.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      handleUpdateCellStyle({ color: c });
                      setShowColorPicker(false);
                    }}
                    className="w-5 h-5 rounded border border-slate-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Formulas */}
        <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
          <button
            onClick={() => handleInsertFormula('SUM')}
            disabled={isReadOnly}
            title="Sum Formula"
            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Sigma className="w-3.5 h-3.5" />
            <span>SUM</span>
          </button>
          <button
            onClick={() => handleInsertFormula('AVERAGE')}
            disabled={isReadOnly}
            title="Average Formula"
            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-medium transition-colors"
          >
            AVG
          </button>
        </div>

        {/* Grid Dimensions */}
        <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
          <button
            onClick={handleInsertRow}
            disabled={isReadOnly}
            title="Add Rows"
            className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded flex items-center gap-1"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>+Row</span>
          </button>
          <button
            onClick={handleInsertCol}
            disabled={isReadOnly}
            title="Add Columns"
            className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded flex items-center gap-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>+Col</span>
          </button>
        </div>

        {/* Export XLSX */}
        <div className="ml-auto flex items-center gap-2">
          <button
            id="excel-export-btn"
            onClick={() => exportExcelFile(docItem.data, docItem.name)}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export .xlsx</span>
          </button>
        </div>
      </div>

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
          disabled={isReadOnly}
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

      {/* Spreadsheet Grid Container */}
      <div id="excel-grid-viewport" className="flex-1 overflow-auto bg-slate-100 relative">
        <table className="border-collapse table-fixed bg-white">
          {/* Column Header Row */}
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-xs font-semibold sticky top-0 z-20">
              {/* Top-left corner */}
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

          {/* Grid Body */}
          <tbody>
            {Array.from({ length: currentSheet.rowCount }).map((_, r) => {
              const rowNum = r + 1;
              return (
                <tr key={r} className="h-6">
                  {/* Row Header */}
                  <td className="w-12 min-w-12 border border-slate-300 bg-slate-100 text-center font-mono text-xs text-slate-600 font-medium sticky left-0 z-10 select-none">
                    {rowNum}
                  </td>

                  {/* Row Cells */}
                  {Array.from({ length: currentSheet.colCount }).map((_, c) => {
                    const key = `${colIndexToLabel(c)}${rowNum}`;
                    const cell = currentSheet.data[key];
                    const isSelected = selectedCellKey === key;
                    const isEditing = editingCellKey === key;
                    const displayValue = formatCellValue(cell);

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
                          if (!isReadOnly) {
                            setEditingCellKey(key);
                          }
                        }}
                        onKeyDown={(e) => handleKeyDown(e, r, c)}
                        tabIndex={0}
                        style={{
                          backgroundColor: cell?.bg || undefined,
                          color: cell?.color || undefined,
                          fontWeight: cell?.bold ? 'bold' : 'normal',
                          fontStyle: cell?.italic ? 'italic' : 'normal',
                          textAlign: cell?.align || (cell?.format === 'currency' || !isNaN(Number(cell?.raw)) ? 'right' : 'left'),
                        }}
                        className={`w-28 min-w-28 px-1.5 py-0.5 border border-slate-200 text-xs font-sans relative truncate transition-all cursor-cell outline-hidden ${
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

        {/* Selected Range Stats */}
        <div className="flex items-center gap-4 text-slate-600 font-mono text-[11px] pr-2">
          <span>
            Active: <strong className="text-slate-800">{selectedCellKey}</strong>
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
    </div>
  );
};
