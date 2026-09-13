import React, { useState } from 'react';
import { X, BarChart2, TrendingUp, PieChart as PieChartIcon, Download } from 'lucide-react';
import { ExcelSheet } from '../../types';
import { colIndexToLabel, labelToColIndex } from '../../utils/excelFormula';

interface ExcelChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: ExcelSheet;
}

export const ExcelChartModal: React.FC<ExcelChartModalProps> = ({ isOpen, onClose, sheet }) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [labelCol, setLabelCol] = useState<string>('A');
  const [valueCol, setValueCol] = useState<string>('B');
  const [chartTitle, setChartTitle] = useState<string>('Spreadsheet Data Visualization');

  if (!isOpen) return null;

  // Extract chart series from selected columns
  const dataPoints: { label: string; value: number }[] = [];
  const lColIdx = labelToColIndex(labelCol);
  const vColIdx = labelToColIndex(valueCol);

  for (let r = 1; r < sheet.rowCount; r++) {
    const lKey = `${labelCol}${r + 1}`;
    const vKey = `${valueCol}${r + 1}`;
    const lCell = sheet.data[lKey];
    const vCell = sheet.data[vKey];

    const label = lCell?.raw || lCell?.computed !== undefined ? String(lCell?.computed ?? lCell?.raw) : `Row ${r + 1}`;
    const rawVal = vCell?.computed !== undefined ? vCell.computed : vCell?.raw;
    const num = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal || '').replace(/[$,%]/g, ''));

    if (!isNaN(num) && num !== 0) {
      dataPoints.push({ label, value: num });
    }
  }

  // Fallback demo data if sheet has no numbers yet
  const displayPoints =
    dataPoints.length > 0
      ? dataPoints.slice(0, 10)
      : [
          { label: 'Item 1', value: 45 },
          { label: 'Item 2', value: 78 },
          { label: 'Item 3', value: 62 },
          { label: 'Item 4', value: 95 },
          { label: 'Item 5', value: 54 },
        ];

  const maxValue = Math.max(...displayPoints.map((d) => d.value), 1);
  const totalValue = displayPoints.reduce((acc, d) => acc + Math.abs(d.value), 0) || 1;

  // Pie chart calculation helper
  let cumulativePercent = 0;
  const pieColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">Spreadsheet Chart Studio</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Controls */}
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            {/* Chart Type Selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Type:</span>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors ${
                  chartType === 'bar' ? 'bg-emerald-600 text-white font-bold' : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Column</span>
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors ${
                  chartType === 'line' ? 'bg-emerald-600 text-white font-bold' : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Trend Line</span>
              </button>
              <button
                onClick={() => setChartType('pie')}
                className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors ${
                  chartType === 'pie' ? 'bg-emerald-600 text-white font-bold' : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <PieChartIcon className="w-3.5 h-3.5" />
                <span>Pie / Donut</span>
              </button>
            </div>

            {/* Column selection */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1">
                <span className="text-slate-500 font-medium">Labels:</span>
                <select
                  value={labelCol}
                  onChange={(e) => setLabelCol(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 font-mono font-semibold text-slate-800"
                >
                  {Array.from({ length: Math.min(sheet.colCount, 10) }).map((_, i) => {
                    const l = colIndexToLabel(i);
                    return <option key={l} value={l}>Col {l}</option>;
                  })}
                </select>
              </label>

              <label className="flex items-center gap-1">
                <span className="text-slate-500 font-medium">Values:</span>
                <select
                  value={valueCol}
                  onChange={(e) => setValueCol(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 font-mono font-semibold text-slate-800"
                >
                  {Array.from({ length: Math.min(sheet.colCount, 10) }).map((_, i) => {
                    const l = colIndexToLabel(i);
                    return <option key={l} value={l}>Col {l}</option>;
                  })}
                </select>
              </label>
            </div>
          </div>

          {/* Chart Rendering Canvas */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 min-h-[300px] flex flex-col items-center justify-center relative shadow-xs">
            <h4 className="font-bold text-slate-800 text-sm mb-6 text-center">{chartTitle}</h4>

            {/* 1. Bar Chart */}
            {chartType === 'bar' && (
              <div className="w-full flex items-end justify-center gap-4 h-56 px-4 pb-6 border-b border-slate-200">
                {displayPoints.map((dp, i) => {
                  const heightPercent = Math.max(8, Math.round((dp.value / maxValue) * 100));
                  return (
                    <div key={i} className="flex-1 max-w-[60px] flex flex-col items-center gap-1.5 group">
                      <span className="text-[11px] font-mono font-semibold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        {dp.value.toLocaleString()}
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm hover:brightness-110 transition-all shadow-xs"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[10px] text-slate-600 font-medium truncate max-w-full text-center">
                        {dp.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. Line Chart */}
            {chartType === 'line' && (
              <div className="w-full h-56 relative px-4 flex items-center justify-center">
                <svg className="w-full h-44 overflow-visible" viewBox={`0 0 500 150`}>
                  {/* Background Gridlines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeDasharray="4" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeDasharray="4" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeDasharray="4" />

                  {/* Polyline Path */}
                  {(() => {
                    const step = 500 / Math.max(1, displayPoints.length - 1);
                    const pointsStr = displayPoints
                      .map((dp, i) => {
                        const x = i * step;
                        const y = 140 - (dp.value / maxValue) * 110;
                        return `${x},${y}`;
                      })
                      .join(' ');
                    return (
                      <>
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={pointsStr}
                        />
                        {displayPoints.map((dp, i) => {
                          const x = i * step;
                          const y = 140 - (dp.value / maxValue) * 110;
                          return (
                            <g key={i}>
                              <circle cx={x} cy={y} r="5" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />
                              <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fill="#047857" fontWeight="bold">
                                {dp.value}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            )}

            {/* 3. Pie Chart */}
            {chartType === 'pie' && (
              <div className="flex items-center justify-center gap-8 py-2">
                <div className="relative w-44 h-44">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {displayPoints.map((dp, idx) => {
                      const percent = (Math.abs(dp.value) / totalValue) * 100;
                      const strokeDasharray = `${percent} ${100 - percent}`;
                      const strokeDashoffset = -cumulativePercent;
                      cumulativePercent += percent;
                      return (
                        <circle
                          key={idx}
                          cx="50"
                          cy="50"
                          r="35"
                          fill="transparent"
                          stroke={pieColors[idx % pieColors.length]}
                          strokeWidth="24"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          pathLength="100"
                          className="hover:opacity-90 transition-opacity cursor-pointer"
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* Legend */}
                <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto">
                  {displayPoints.map((dp, idx) => {
                    const percent = Math.round((Math.abs(dp.value) / totalValue) * 100);
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-xs shrink-0"
                          style={{ backgroundColor: pieColors[idx % pieColors.length] }}
                        />
                        <span className="font-medium text-slate-700 truncate max-w-[120px]">{dp.label}</span>
                        <span className="text-slate-400 font-mono text-[11px] ml-auto">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <span className="text-xs text-slate-500">Based on active columns {labelCol} and {valueCol}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
