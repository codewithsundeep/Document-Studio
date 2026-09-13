import { ExcelCell, ExcelGridData } from '../types';

// Convert column index (0 = A, 25 = Z, 26 = AA) to label
export function colIndexToLabel(index: number): string {
  let label = '';
  let temp = index;
  while (temp >= 0) {
    label = String.fromCharCode((temp % 26) + 65) + label;
    temp = Math.floor(temp / 26) - 1;
  }
  return label;
}

// Convert label "A" -> 0, "Z" -> 25, "AA" -> 26
export function labelToColIndex(label: string): number {
  let index = 0;
  const upper = label.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
}

// Parse cell key "B4" -> { col: 1, row: 3, colLabel: "B", rowLabel: 4 }
export function parseCellKey(key: string): { col: number; row: number } | null {
  const match = key.match(/^([A-Z]+)([0-9]+)$/i);
  if (!match) return null;
  const colLabel = match[1].toUpperCase();
  const rowNum = parseInt(match[2], 10);
  return {
    col: labelToColIndex(colLabel),
    row: rowNum - 1,
  };
}

// Get numeric value of cell
export function getNumericCellValue(key: string, data: ExcelGridData): number {
  const cell = data[key];
  if (!cell) return 0;
  const raw = cell.raw.trim();
  if (raw.startsWith('=')) {
    // Return computed value
    const comp = cell.computed;
    if (typeof comp === 'number') return comp;
    if (typeof comp === 'string') {
      const parsed = parseFloat(comp.replace(/[$,%]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }
  const clean = raw.replace(/[$,%]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

// Expand range like "A1:A5" -> ["A1", "A2", "A3", "A4", "A5"]
export function expandRange(rangeStr: string): string[] {
  const parts = rangeStr.split(':');
  if (parts.length === 1) return [parts[0].toUpperCase().trim()];
  if (parts.length !== 2) return [];

  const start = parseCellKey(parts[0].trim());
  const end = parseCellKey(parts[1].trim());
  if (!start || !end) return [];

  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);

  const keys: string[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      keys.push(`${colIndexToLabel(c)}${r + 1}`);
    }
  }
  return keys;
}

// Evaluate formula string
export function evaluateFormula(formula: string, data: ExcelGridData): string | number {
  if (!formula.startsWith('=')) return formula;

  const expression = formula.substring(1).trim();

  // Match SUM, AVERAGE, COUNT, MIN, MAX
  const funcMatch = expression.match(/^(SUM|AVERAGE|AVG|COUNT|MIN|MAX)\((.*?)\)$/i);
  if (funcMatch) {
    const fnName = funcMatch[1].toUpperCase();
    const argsStr = funcMatch[2];
    const argTokens = argsStr.split(',').map((s) => s.trim());
    const cellKeys: string[] = [];

    for (const token of argTokens) {
      if (token.includes(':')) {
        cellKeys.push(...expandRange(token));
      } else {
        cellKeys.push(token.toUpperCase());
      }
    }

    const values = cellKeys.map((k) => getNumericCellValue(k, data));

    switch (fnName) {
      case 'SUM': {
        const sum = values.reduce((a, b) => a + b, 0);
        return Math.round(sum * 100) / 100;
      }
      case 'AVERAGE':
      case 'AVG': {
        if (values.length === 0) return 0;
        const sum = values.reduce((a, b) => a + b, 0);
        return Math.round((sum / values.length) * 100) / 100;
      }
      case 'COUNT': {
        const count = cellKeys.filter((k) => {
          const val = data[k]?.raw?.trim();
          return val && !isNaN(Number(val.replace(/[$,%]/g, '')));
        }).length;
        return count;
      }
      case 'MIN': {
        return values.length > 0 ? Math.min(...values) : 0;
      }
      case 'MAX': {
        return values.length > 0 ? Math.max(...values) : 0;
      }
    }
  }

  // Simple arithmetic replacement: e.g. "A1 + B1 * 2"
  try {
    const replaced = expression.replace(/([A-Z]+[0-9]+)/gi, (match) => {
      const val = getNumericCellValue(match.toUpperCase(), data);
      return val.toString();
    });

    // Sanitize to only allow numbers and basic math operators
    if (/^[\d\s+\-*/().%]+$/.test(replaced)) {
      // Safely evaluate simple arithmetic using Function constructor
      // eslint-disable-next-line no-new-func
      const result = new Function(`return (${replaced})`)();
      if (typeof result === 'number' && !isNaN(result)) {
        return Math.round(result * 100) / 100;
      }
    }
  } catch (err) {
    return '#ERROR!';
  }

  return formula;
}

// Compute all cells in a sheet grid
export function computeAllCells(data: ExcelGridData): ExcelGridData {
  const result: ExcelGridData = {};
  for (const key of Object.keys(data)) {
    const cell = data[key];
    if (cell.raw.startsWith('=')) {
      result[key] = {
        ...cell,
        computed: evaluateFormula(cell.raw, data),
      };
    } else {
      result[key] = {
        ...cell,
        computed: cell.raw,
      };
    }
  }
  return result;
}

// Format a cell value for display
export function formatCellValue(cell?: ExcelCell): string {
  if (!cell) return '';
  const val = cell.computed !== undefined ? cell.computed : cell.raw;
  if (val === undefined || val === null) return '';

  if (cell.format === 'currency') {
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[$,]/g, ''));
    if (!isNaN(num)) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
    }
  }
  if (cell.format === 'percent') {
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (!isNaN(num)) {
      return `${(num * 100).toFixed(1)}%`;
    }
  }
  if (cell.format === 'number') {
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (!isNaN(num)) {
      return new Intl.NumberFormat('en-US').format(num);
    }
  }

  return String(val);
}
