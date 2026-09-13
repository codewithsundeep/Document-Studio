import React, { useState } from 'react';
import { X, Sigma, Search, Check, Calculator } from 'lucide-react';

interface ExcelFunctionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertFunction: (formulaSyntax: string) => void;
  selectedCellKey: string;
}

interface FormulaDef {
  name: string;
  category: 'Math' | 'Logical' | 'Text' | 'Date';
  syntax: string;
  description: string;
  example: string;
}

const FORMULA_DEFINITIONS: FormulaDef[] = [
  // Math & Statistics
  {
    name: 'SUM',
    category: 'Math',
    syntax: '=SUM(A1:A5)',
    description: 'Adds all numbers in a range of cells.',
    example: '=SUM(A1:A10)',
  },
  {
    name: 'AVERAGE',
    category: 'Math',
    syntax: '=AVERAGE(A1:A5)',
    description: 'Calculates the arithmetic mean of values in a range.',
    example: '=AVERAGE(B2:B12)',
  },
  {
    name: 'COUNT',
    category: 'Math',
    syntax: '=COUNT(A1:A10)',
    description: 'Counts the number of cells that contain numbers.',
    example: '=COUNT(A1:A20)',
  },
  {
    name: 'MAX',
    category: 'Math',
    syntax: '=MAX(A1:A10)',
    description: 'Returns the largest value in a set of values.',
    example: '=MAX(C1:C15)',
  },
  {
    name: 'MIN',
    category: 'Math',
    syntax: '=MIN(A1:A10)',
    description: 'Returns the smallest number in a set of values.',
    example: '=MIN(C1:C15)',
  },
  {
    name: 'ROUND',
    category: 'Math',
    syntax: '=ROUND(A1, 2)',
    description: 'Rounds a number to a specified number of digits.',
    example: '=ROUND(123.456, 2)',
  },
  {
    name: 'ABS',
    category: 'Math',
    syntax: '=ABS(A1)',
    description: 'Returns the absolute value of a number.',
    example: '=ABS(-45)',
  },
  {
    name: 'SQRT',
    category: 'Math',
    syntax: '=SQRT(A1)',
    description: 'Returns a positive square root.',
    example: '=SQRT(144)',
  },

  // Logical
  {
    name: 'IF',
    category: 'Logical',
    syntax: '=IF(A1>50, "Pass", "Fail")',
    description: 'Checks whether a condition is met, and returns one value if TRUE, and another value if FALSE.',
    example: '=IF(B2>1000, "High", "Normal")',
  },
  {
    name: 'AND',
    category: 'Logical',
    syntax: '=AND(A1>0, B1>0)',
    description: 'Returns TRUE if all its arguments evaluate to TRUE.',
    example: '=AND(A1>10, A1<100)',
  },
  {
    name: 'OR',
    category: 'Logical',
    syntax: '=OR(A1>100, B1>100)',
    description: 'Returns TRUE if any argument is TRUE.',
    example: '=OR(A1="Yes", B1="Yes")',
  },

  // Text
  {
    name: 'CONCAT',
    category: 'Text',
    syntax: '=CONCAT(A1, " ", B1)',
    description: 'Combines the text from multiple ranges and/or strings.',
    example: '=CONCAT(A2, " ", B2)',
  },
  {
    name: 'UPPER',
    category: 'Text',
    syntax: '=UPPER(A1)',
    description: 'Converts text to all uppercase letters.',
    example: '=UPPER(A1)',
  },
  {
    name: 'LOWER',
    category: 'Text',
    syntax: '=LOWER(A1)',
    description: 'Converts all letters in a text string to lowercase.',
    example: '=LOWER(A1)',
  },
  {
    name: 'LEN',
    category: 'Text',
    syntax: '=LEN(A1)',
    description: 'Returns the number of characters in a text string.',
    example: '=LEN(A1)',
  },
  {
    name: 'TRIM',
    category: 'Text',
    syntax: '=TRIM(A1)',
    description: 'Removes all spaces from text except for single spaces between words.',
    example: '=TRIM(A1)',
  },

  // Date
  {
    name: 'TODAY',
    category: 'Date',
    syntax: '=TODAY()',
    description: 'Returns the current date formatted as date value.',
    example: '=TODAY()',
  },
  {
    name: 'NOW',
    category: 'Date',
    syntax: '=NOW()',
    description: 'Returns the current date and time.',
    example: '=NOW()',
  },
  {
    name: 'YEAR',
    category: 'Date',
    syntax: '=YEAR(A1)',
    description: 'Returns the year corresponding to a date.',
    example: '=YEAR(TODAY())',
  },
];

export const ExcelFunctionWizardModal: React.FC<ExcelFunctionWizardModalProps> = ({
  isOpen,
  onClose,
  onInsertFunction,
  selectedCellKey,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDef, setSelectedDef] = useState<FormulaDef>(FORMULA_DEFINITIONS[0]);

  if (!isOpen) return null;

  const categories = ['All', 'Math', 'Logical', 'Text', 'Date'];

  const filteredDefs = FORMULA_DEFINITIONS.filter((def) => {
    const matchesCat = selectedCategory === 'All' || def.category === selectedCategory;
    const matchesSearch =
      def.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      def.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSelectAndInsert = (def: FormulaDef) => {
    onInsertFunction(def.syntax);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Sigma className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">Excel Function Wizard</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Search and Category Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search formulas (e.g. SUM, AVERAGE)..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* List and Details Layout */}
          <div className="grid grid-cols-2 gap-3 h-52">
            {/* List */}
            <div className="border border-slate-200 rounded-lg overflow-y-auto p-1 divide-y divide-slate-100">
              {filteredDefs.map((def) => {
                const isSel = selectedDef.name === def.name;
                return (
                  <button
                    key={def.name}
                    onClick={() => setSelectedDef(def)}
                    className={`w-full text-left px-3 py-2 rounded-md font-mono text-xs flex items-center justify-between transition-colors ${
                      isSel ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{def.name}</span>
                    <span className="text-[10px] font-sans text-slate-400">{def.category}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected formula details */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="font-mono font-bold text-sm text-emerald-700">{selectedDef.name}</div>
                <div className="mt-1 text-[11px] font-mono text-slate-600 bg-white border border-slate-200 p-1.5 rounded">
                  {selectedDef.syntax}
                </div>
                <p className="mt-2 text-slate-600 leading-relaxed text-[11px]">{selectedDef.description}</p>
                <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                  <span className="font-semibold">Example:</span> <code className="font-mono">{selectedDef.example}</code>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[10px] text-slate-400 block mb-1">Target Cell: {selectedCellKey}</span>
                <button
                  onClick={() => handleSelectAndInsert(selectedDef)}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-xs flex items-center justify-center gap-1 shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Insert into {selectedCellKey}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
