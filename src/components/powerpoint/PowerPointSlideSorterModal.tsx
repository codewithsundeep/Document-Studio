import React from 'react';
import { X, Grid, Plus, Trash2, Copy, Play } from 'lucide-react';
import { Slide } from '../../types';

interface PowerPointSlideSorterModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDuplicateSlide: (index: number) => void;
  onDeleteSlide: (index: number) => void;
  onStartPresentation: () => void;
  isReadOnly?: boolean;
}

export const PowerPointSlideSorterModal: React.FC<PowerPointSlideSorterModalProps> = ({
  isOpen,
  onClose,
  slides,
  activeSlideIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onStartPresentation,
  isReadOnly = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Grid className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Slide Sorter View</h3>
              <p className="text-[11px] text-slate-500">{slides.length} slides in presentation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onStartPresentation();
              }}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Slide Show</span>
            </button>
            <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {slides.map((slide, index) => {
              const isActive = index === activeSlideIndex;
              return (
                <div
                  key={slide.id || index}
                  onClick={() => {
                    onSelectSlide(index);
                    onClose();
                  }}
                  className={`group relative flex flex-col rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-150 bg-white shadow-xs hover:shadow-md ${
                    isActive ? 'border-orange-500 ring-2 ring-orange-200' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Thumbnail */}
                  <div
                    className="w-full aspect-video p-3 flex flex-col justify-between relative overflow-hidden"
                    style={{ background: slide.bgColor }}
                  >
                    <span
                      className="text-[10px] font-bold line-clamp-2"
                      style={{ color: slide.textColor || '#000' }}
                    >
                      {slide.elements.find((e) => e.type === 'title')?.content || slide.title}
                    </span>

                    <div className="flex gap-1 mt-auto">
                      {slide.elements.slice(1, 3).map((el) => (
                        <div key={el.id} className="h-1.5 flex-1 rounded-xs bg-slate-400/30" />
                      ))}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Slide {index + 1}</span>
                    {!isReadOnly && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateSlide(index);
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSlide(index);
                          }}
                          disabled={slides.length <= 1}
                          className="p-1 hover:bg-red-50 text-red-500 rounded disabled:opacity-30"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Slide Card */}
            {!isReadOnly && (
              <button
                onClick={onAddSlide}
                className="aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-400 bg-slate-50/50 hover:bg-orange-50/20 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-orange-600 transition-colors"
              >
                <Plus className="w-6 h-6" />
                <span className="text-xs font-semibold">Add New Slide</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Click any slide thumbnail to jump directly to it in editing canvas</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
