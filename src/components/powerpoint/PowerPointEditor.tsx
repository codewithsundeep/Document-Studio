import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PowerPointDocItem, Slide, SlideElement, SlideElementType, CustomFontItem } from '../../types';
import { triggerDownload } from '../../utils/fileHelpers';
import { PowerPointRibbon, PowerpointRibbonTab } from './PowerPointRibbon';
import { PowerPointSlideSorterModal } from './PowerPointSlideSorterModal';

interface PowerPointEditorProps {
  document: PowerPointDocItem;
  onChange: (updatedDoc: PowerPointDocItem) => void;
  isReadOnly?: boolean;
  customFonts?: CustomFontItem[];
  onOpenFontManager?: () => void;
}

export const PowerPointEditor: React.FC<PowerPointEditorProps> = ({
  document: docItem,
  onChange,
  isReadOnly = false,
  customFonts = [],
  onOpenFontManager,
}) => {
  const activeSlideIndex = docItem.data.activeSlideIndex ?? 0;
  const currentSlide = docItem.data.slides[activeSlideIndex] || docItem.data.slides[0];

  const [activeTab, setActiveTab] = useState<PowerpointRibbonTab>('home');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isPresenting, setIsPresenting] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [isSlideSorterOpen, setIsSlideSorterOpen] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3'>('16:9');
  const [transitionEffect, setTransitionEffect] = useState<string>('Fade');

  // Fullscreen keyboard controls for presenter mode
  useEffect(() => {
    if (!isPresenting) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        if (activeSlideIndex < docItem.data.slides.length - 1) {
          handleSelectSlide(activeSlideIndex + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (activeSlideIndex > 0) {
          handleSelectSlide(activeSlideIndex - 1);
        }
      } else if (e.key === 'Escape') {
        setIsPresenting(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, activeSlideIndex, docItem.data.slides.length]);

  const handleSelectSlide = (index: number) => {
    setSelectedElementId(null);
    onChange({
      ...docItem,
      data: {
        ...docItem.data,
        activeSlideIndex: index,
      },
    });
  };

  const handleAddSlide = () => {
    if (isReadOnly) return;
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      title: `Slide ${docItem.data.slides.length + 1}`,
      bgColor: currentSlide ? currentSlide.bgColor : '#ffffff',
      textColor: currentSlide ? currentSlide.textColor : '#0f172a',
      notes: '',
      elements: [
        {
          id: `el-title-${Date.now()}`,
          type: 'title',
          x: 8,
          y: 12,
          width: 84,
          height: 15,
          content: 'New Presentation Slide Title',
          fontSize: 30,
          fontWeight: 'bold',
          fontColor: currentSlide ? currentSlide.textColor : '#0f172a',
          align: 'left',
        },
        {
          id: `el-text-${Date.now()}`,
          type: 'text',
          x: 8,
          y: 34,
          width: 84,
          height: 20,
          content: 'Click here to write and articulate key concepts, insights, or project data.',
          fontSize: 16,
          fontColor: '#475569',
          align: 'left',
        },
      ],
    };

    const newSlides = [...docItem.data.slides, newSlide];
    onChange({
      ...docItem,
      lastModified: Date.now(),
      data: {
        ...docItem.data,
        slides: newSlides,
        activeSlideIndex: newSlides.length - 1,
      },
    });
  };

  const handleDuplicateSlide = (index = activeSlideIndex) => {
    if (isReadOnly) return;
    const target = docItem.data.slides[index];
    const duplicated: Slide = {
      ...target,
      id: `slide-${Date.now()}`,
      title: `${target.title} (Copy)`,
      elements: target.elements.map((el) => ({ ...el, id: `el-${Date.now()}-${Math.random()}` })),
    };

    const newSlides = [...docItem.data.slides];
    newSlides.splice(index + 1, 0, duplicated);
    onChange({
      ...docItem,
      lastModified: Date.now(),
      data: {
        ...docItem.data,
        slides: newSlides,
        activeSlideIndex: index + 1,
      },
    });
  };

  const handleDeleteSlide = (index = activeSlideIndex) => {
    if (isReadOnly || docItem.data.slides.length <= 1) return;
    const newSlides = docItem.data.slides.filter((_, i) => i !== index);
    onChange({
      ...docItem,
      lastModified: Date.now(),
      data: {
        ...docItem.data,
        slides: newSlides,
        activeSlideIndex: Math.max(0, index - 1),
      },
    });
  };

  const handleMoveSlide = (direction: 'up' | 'down', index = activeSlideIndex) => {
    if (isReadOnly) return;
    const newSlides = [...docItem.data.slides];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSlides.length) return;

    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIdx];
    newSlides[targetIdx] = temp;

    onChange({
      ...docItem,
      lastModified: Date.now(),
      data: {
        ...docItem.data,
        slides: newSlides,
        activeSlideIndex: targetIdx,
      },
    });
  };

  // Add elements to current slide
  const handleAddElement = (type: SlideElementType) => {
    if (isReadOnly || !currentSlide) return;

    let newEl: SlideElement;
    const id = `el-${type}-${Date.now()}`;

    switch (type) {
      case 'title':
        newEl = {
          id,
          type: 'title',
          x: 8,
          y: 20,
          width: 84,
          height: 15,
          content: 'Add Slide Heading',
          fontSize: 28,
          fontWeight: 'bold',
          fontColor: currentSlide.textColor || '#0f172a',
          align: 'left',
        };
        break;
      case 'bullet':
        newEl = {
          id,
          type: 'bullet',
          x: 8,
          y: 42,
          width: 80,
          height: 35,
          content: '• Key strategic priority one\n• Key milestone two\n• Measureable outcome three',
          fontSize: 15,
          fontColor: currentSlide.textColor || '#334155',
          align: 'left',
        };
        break;
      case 'metric':
        newEl = {
          id,
          type: 'metric',
          x: 35,
          y: 40,
          width: 30,
          height: 25,
          content: '98.5%',
          subtitle: 'Customer Retention Rate',
          fontSize: 28,
          fontColor: '#2563eb',
          bgColor:
            currentSlide.bgColor.includes('slate') || currentSlide.bgColor.includes('#0')
              ? 'rgba(30,41,59,0.7)'
              : '#f1f5f9',
          align: 'center',
        };
        break;
      case 'shape':
        newEl = {
          id,
          type: 'shape',
          x: 30,
          y: 45,
          width: 40,
          height: 20,
          content: 'Highlight Banner or Callout Box',
          fontSize: 14,
          fontColor: '#1e293b',
          bgColor: '#e0f2fe',
          align: 'center',
          shapeType: 'rounded',
        };
        break;
      default:
        newEl = {
          id,
          type: 'text',
          x: 8,
          y: 40,
          width: 80,
          height: 20,
          content: 'Double click to edit body text description or explanatory note.',
          fontSize: 15,
          fontColor: currentSlide.textColor || '#475569',
          align: 'left',
        };
        break;
    }

    const updatedSlides = [...docItem.data.slides];
    updatedSlides[activeSlideIndex] = {
      ...currentSlide,
      elements: [...currentSlide.elements, newEl],
    };

    onChange({
      ...docItem,
      lastModified: Date.now(),
      data: {
        ...docItem.data,
        slides: updatedSlides,
      },
    });
    setSelectedElementId(id);
  };

  const handleUpdateElement = (updates: Partial<SlideElement>, elId = selectedElementId) => {
    if (isReadOnly || !currentSlide || !elId) return;
    const updatedElements = currentSlide.elements.map((el) => (el.id === elId ? { ...el, ...updates } : el));

    const updatedSlides = [...docItem.data.slides];
    updatedSlides[activeSlideIndex] = {
      ...currentSlide,
      elements: updatedElements,
    };

    onChange({
      ...docItem,
      lastModified: Date.now(),
      data: {
        ...docItem.data,
        slides: updatedSlides,
      },
    });
  };

  const handleDeleteElement = (elId = selectedElementId) => {
    if (isReadOnly || !currentSlide || !elId) return;
    const updatedElements = currentSlide.elements.filter((el) => el.id !== elId);
    const updatedSlides = [...docItem.data.slides];
    updatedSlides[activeSlideIndex] = {
      ...currentSlide,
      elements: updatedElements,
    };
    onChange({
      ...docItem,
      data: {
        ...docItem.data,
        slides: updatedSlides,
      },
    });
    setSelectedElementId(null);
  };

  const handleUpdateSlideBg = (bg: string, textCol: string) => {
    if (isReadOnly || !currentSlide) return;
    const updatedSlides = [...docItem.data.slides];
    updatedSlides[activeSlideIndex] = {
      ...currentSlide,
      bgColor: bg,
      textColor: textCol,
    };
    onChange({
      ...docItem,
      data: {
        ...docItem.data,
        slides: updatedSlides,
      },
    });
  };

  const handleExportSlidesJson = () => {
    const jsonStr = JSON.stringify(docItem.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    triggerDownload(blob, `${docItem.name.replace(/\.[^/.]+$/, '')}.presentation.json`);
  };

  const selectedElement = currentSlide?.elements.find((el) => el.id === selectedElementId);

  return (
    <div id="powerpoint-editor-container" className="flex flex-col h-full bg-slate-100 select-none overflow-hidden">
      {/* 1. Authentic PowerPoint Ribbon Toolbar */}
      <PowerPointRibbon
        document={docItem}
        currentSlide={currentSlide}
        activeSlideIndex={activeSlideIndex}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedElement={selectedElement}
        isReadOnly={isReadOnly}
        onStartPresentation={(fromBeginning) => {
          if (fromBeginning) {
            handleSelectSlide(0);
          }
          setIsPresenting(true);
        }}
        onAddSlide={handleAddSlide}
        onDuplicateSlide={() => handleDuplicateSlide(activeSlideIndex)}
        onDeleteSlide={() => handleDeleteSlide(activeSlideIndex)}
        onMoveSlide={(dir) => handleMoveSlide(dir, activeSlideIndex)}
        onAddElement={handleAddElement}
        onUpdateElement={handleUpdateElement}
        onDeleteElement={handleDeleteElement}
        onUpdateSlideBg={handleUpdateSlideBg}
        onExport={handleExportSlidesJson}
        onPrint={() => window.print()}
        showNotes={showNotes}
        onToggleNotes={() => setShowNotes(!showNotes)}
        onOpenSlideSorter={() => setIsSlideSorterOpen(true)}
        aspectRatio={aspectRatio}
        onToggleAspectRatio={() => setAspectRatio(aspectRatio === '16:9' ? '4:3' : '16:9')}
        transitionEffect={transitionEffect}
        onSetTransitionEffect={setTransitionEffect}
        onApplyTransitionToAll={() => alert(`Applied "${transitionEffect}" transition to all slides!`)}
        customFonts={customFonts}
        onOpenFontManager={onOpenFontManager}
      />

      {/* Main Studio Body: Left Thumbnails + Center Slide Stage */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Slide Carousel Rail */}
        <div id="ppt-slide-thumbnails" className="w-48 sm:w-56 bg-white border-r border-slate-200 flex flex-col overflow-y-auto p-3 gap-3 select-none">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Slides ({docItem.data.slides.length})
            </span>
            {!isReadOnly && (
              <button
                id="ppt-add-slide-btn"
                onClick={handleAddSlide}
                className="p-1 hover:bg-orange-50 text-orange-600 rounded transition-colors"
                title="Add New Slide"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {docItem.data.slides.map((slide, index) => {
              const isActive = index === activeSlideIndex;
              return (
                <div
                  key={slide.id || index}
                  onClick={() => handleSelectSlide(index)}
                  className={`group relative flex flex-col gap-1 rounded-lg p-2 transition-all cursor-pointer border-2 ${
                    isActive
                      ? 'border-orange-500 bg-orange-50/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                    <span className="font-semibold">{index + 1}</span>
                    <span className="truncate max-w-[110px] font-medium">{slide.title}</span>
                  </div>

                  {/* Thumbnail Preview Aspect Box */}
                  <div
                    className={`w-full ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-4/3'} rounded overflow-hidden shadow-2xs relative p-1.5 flex flex-col justify-between`}
                    style={{ background: slide.bgColor }}
                  >
                    <div
                      className="text-[8px] font-bold line-clamp-2"
                      style={{ color: slide.textColor || '#000' }}
                    >
                      {slide.elements.find((e) => e.type === 'title')?.content || slide.title}
                    </div>
                    <div className="flex gap-1">
                      {slide.elements.slice(1, 3).map((el) => (
                        <div key={el.id} className="h-1.5 flex-1 rounded-xs bg-slate-400/40" />
                      ))}
                    </div>
                  </div>

                  {/* Hover Reorder/Duplicate/Delete toolbar */}
                  {!isReadOnly && (
                    <div className="opacity-0 group-hover:opacity-100 absolute -right-2 top-2 flex flex-col bg-white border border-slate-200 rounded shadow-md z-20 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSlide('up', index);
                        }}
                        disabled={index === 0}
                        className="p-1 hover:bg-slate-100 text-slate-600 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateSlide(index);
                        }}
                        className="p-1 hover:bg-slate-100 text-slate-600"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlide(index);
                        }}
                        disabled={docItem.data.slides.length <= 1}
                        className="p-1 hover:bg-red-50 text-red-600 disabled:opacity-30"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSlide('down', index);
                        }}
                        disabled={index === docItem.data.slides.length - 1}
                        className="p-1 hover:bg-slate-100 text-slate-600 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Stage & Speaker Notes */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-200/80">
          <div
            id="ppt-slide-stage"
            className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center relative"
            onClick={() => setSelectedElementId(null)}
          >
            {/* Presentation Canvas Box */}
            <div
              className={`w-full ${
                aspectRatio === '16:9' ? 'max-w-4xl aspect-video' : 'max-w-3xl aspect-4/3'
              } rounded-lg shadow-xl relative overflow-hidden transition-all select-text animate-in fade-in duration-200`}
              style={{
                background: currentSlide?.bgColor || '#ffffff',
                color: currentSlide?.textColor || '#0f172a',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Elements on the slide */}
              {currentSlide?.elements.map((el) => {
                const isSelected = selectedElementId === el.id;

                return (
                  <div
                    key={el.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElementId(el.id);
                    }}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.width}%`,
                      minHeight: `${el.height}%`,
                      fontSize: `${el.fontSize || 16}px`,
                      fontFamily: el.fontFamily || undefined,
                      color: el.fontColor || currentSlide.textColor,
                      background: el.bgColor || 'transparent',
                      textAlign: el.align || 'left',
                      fontWeight: el.fontWeight || 'normal',
                    }}
                    className={`absolute p-2 transition-all cursor-pointer ${
                      isSelected && !isReadOnly ? 'ring-2 ring-orange-500 ring-offset-1 rounded' : ''
                    } ${el.shapeType === 'pill' ? 'rounded-full px-3' : ''} ${
                      el.shapeType === 'rounded' ? 'rounded-xl p-4' : ''
                    }`}
                  >
                    {/* Inline Content Editor */}
                    <div
                      contentEditable={!isReadOnly}
                      suppressContentEditableWarning
                      onBlur={(e) => handleUpdateElement({ content: e.currentTarget.innerText }, el.id)}
                      className="outline-none whitespace-pre-line"
                    >
                      {el.content}
                    </div>

                    {/* Subtitle for metric cards */}
                    {el.subtitle && (
                      <div
                        contentEditable={!isReadOnly}
                        suppressContentEditableWarning
                        onBlur={(e) => handleUpdateElement({ subtitle: e.currentTarget.innerText }, el.id)}
                        className="text-xs text-slate-400 mt-1 outline-none font-normal"
                      >
                        {el.subtitle}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Speaker Notes Collapsible Drawer */}
          {showNotes && (
            <div id="ppt-speaker-notes" className="bg-white border-t border-slate-300 p-3 h-32 flex flex-col">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>SPEAKER TALKING POINTS & NOTES</span>
                <span className="text-[11px] text-slate-400">Visible only to presenter</span>
              </div>
              <textarea
                value={currentSlide?.notes || ''}
                disabled={isReadOnly}
                onChange={(e) => {
                  const updatedSlides = [...docItem.data.slides];
                  updatedSlides[activeSlideIndex] = {
                    ...currentSlide,
                    notes: e.target.value,
                  };
                  onChange({
                    ...docItem,
                    data: {
                      ...docItem.data,
                      slides: updatedSlides,
                    },
                  });
                }}
                placeholder="Type talking points, key prompts, or presentation delivery notes for this slide..."
                className="flex-1 w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded resize-none focus:outline-hidden focus:ring-1 focus:ring-orange-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Presentation Mode Overlay */}
      {isPresenting && (
        <div id="ppt-fullscreen-presenter" className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
          {/* Main Slide Stage */}
          <div
            className={`w-full ${
              aspectRatio === '16:9' ? 'max-w-6xl aspect-video' : 'max-w-4xl aspect-4/3'
            } rounded-md shadow-2xl relative overflow-hidden select-none transition-all p-12 flex flex-col justify-center animate-in zoom-in-95 duration-200`}
            style={{
              background: currentSlide?.bgColor || '#ffffff',
              color: currentSlide?.textColor || '#0f172a',
            }}
          >
            {currentSlide?.elements.map((el) => (
              <div
                key={el.id}
                style={{
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: `${el.width}%`,
                  fontSize: `${(el.fontSize || 16) * 1.3}px`,
                  color: el.fontColor || currentSlide.textColor,
                  background: el.bgColor || 'transparent',
                  textAlign: el.align || 'left',
                  fontWeight: el.fontWeight || 'normal',
                }}
                className={`absolute p-2 whitespace-pre-line ${
                  el.shapeType === 'pill' ? 'rounded-full px-4' : ''
                } ${el.shapeType === 'rounded' ? 'rounded-xl p-5' : ''}`}
              >
                <div>{el.content}</div>
                {el.subtitle && <div className="text-sm text-slate-400 mt-1">{el.subtitle}</div>}
              </div>
            ))}
          </div>

          {/* Presenter HUD Navigation Controls */}
          <div className="absolute bottom-6 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-slate-700 text-white shadow-lg">
            <button
              onClick={() => handleSelectSlide(Math.max(0, activeSlideIndex - 1))}
              disabled={activeSlideIndex === 0}
              className="p-1.5 hover:bg-slate-800 rounded-full disabled:opacity-30 transition-colors"
              title="Previous slide (Left arrow)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-xs font-mono font-medium">
              Slide {activeSlideIndex + 1} of {docItem.data.slides.length}
            </span>

            <button
              onClick={() => handleSelectSlide(Math.min(docItem.data.slides.length - 1, activeSlideIndex + 1))}
              disabled={activeSlideIndex === docItem.data.slides.length - 1}
              className="p-1.5 hover:bg-slate-800 rounded-full disabled:opacity-30 transition-colors"
              title="Next slide (Right arrow / Space)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsPresenting(false)}
              className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
            >
              Exit (Esc)
            </button>
          </div>
        </div>
      )}

      {/* Slide Sorter Modal */}
      <PowerPointSlideSorterModal
        isOpen={isSlideSorterOpen}
        onClose={() => setIsSlideSorterOpen(false)}
        slides={docItem.data.slides}
        activeSlideIndex={activeSlideIndex}
        onSelectSlide={handleSelectSlide}
        onAddSlide={handleAddSlide}
        onDuplicateSlide={(idx) => handleDuplicateSlide(idx)}
        onDeleteSlide={(idx) => handleDeleteSlide(idx)}
        onStartPresentation={() => setIsPresenting(true)}
        isReadOnly={isReadOnly}
      />
    </div>
  );
};
