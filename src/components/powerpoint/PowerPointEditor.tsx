import React, { useState, useEffect } from 'react';
import {
  Play,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Type,
  List,
  Square,
  BarChart2,
  Palette,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  FileDown,
  MessageSquare,
} from 'lucide-react';
import { PowerPointDocItem, Slide, SlideElement, SlideElementType } from '../../types';
import { triggerDownload } from '../../utils/fileHelpers';

interface PowerPointEditorProps {
  document: PowerPointDocItem;
  onChange: (updatedDoc: PowerPointDocItem) => void;
  isReadOnly?: boolean;
}

export const PowerPointEditor: React.FC<PowerPointEditorProps> = ({
  document: docItem,
  onChange,
  isReadOnly = false,
}) => {
  const activeSlideIndex = docItem.data.activeSlideIndex ?? 0;
  const currentSlide = docItem.data.slides[activeSlideIndex] || docItem.data.slides[0];

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isPresenting, setIsPresenting] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [showBgPicker, setShowBgPicker] = useState<boolean>(false);

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
      bgColor: '#ffffff',
      textColor: '#0f172a',
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
          fontColor: '#0f172a',
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

  const handleDuplicateSlide = (index: number) => {
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

  const handleDeleteSlide = (index: number) => {
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

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
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
          bgColor: currentSlide.bgColor.includes('slate') || currentSlide.bgColor.includes('#0') ? 'rgba(30,41,59,0.7)' : '#f1f5f9',
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

  const handleUpdateElement = (elId: string, updates: Partial<SlideElement>) => {
    if (isReadOnly || !currentSlide) return;
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

  const handleDeleteElement = (elId: string) => {
    if (isReadOnly || !currentSlide) return;
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
    setShowBgPicker(false);
  };

  const handleExportSlidesJson = () => {
    const jsonStr = JSON.stringify(docItem.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    triggerDownload(blob, `${docItem.name.replace(/\.[^/.]+$/, '')}.presentation.json`);
  };

  const backgroundThemes = [
    { name: 'Pure White', bg: '#ffffff', text: '#0f172a' },
    { name: 'Executive Dark', bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', text: '#ffffff' },
    { name: 'Navy Gradient', bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', text: '#ffffff' },
    { name: 'Emerald Forest', bg: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)', text: '#ffffff' },
    { name: 'Clean Warm', bg: '#f8fafc', text: '#1e293b' },
    { name: 'Dusk Velvet', bg: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 100%)', text: '#ffffff' },
  ];

  const selectedElement = currentSlide?.elements.find((el) => el.id === selectedElementId);

  return (
    <div id="powerpoint-editor-container" className="flex flex-col h-full bg-slate-100 select-none overflow-hidden">
      {/* Top PowerPoint Ribbon Toolbar */}
      <div id="powerpoint-toolbar" className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center gap-2 shadow-xs z-10">
        {/* Present / Slide Show Button */}
        <button
          id="ppt-present-btn"
          onClick={() => setIsPresenting(true)}
          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Present Slides</span>
        </button>

        {/* Add Elements Group */}
        <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
          <button
            id="ppt-add-title-btn"
            onClick={() => handleAddElement('title')}
            disabled={isReadOnly}
            className="px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded flex items-center gap-1 transition-colors"
          >
            <Type className="w-3.5 h-3.5 text-orange-600" />
            <span>Title</span>
          </button>
          <button
            id="ppt-add-text-btn"
            onClick={() => handleAddElement('text')}
            disabled={isReadOnly}
            className="px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded flex items-center gap-1 transition-colors"
          >
            <span className="font-serif italic font-bold text-xs text-slate-500">T</span>
            <span>Text Box</span>
          </button>
          <button
            id="ppt-add-bullet-btn"
            onClick={() => handleAddElement('bullet')}
            disabled={isReadOnly}
            className="px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded flex items-center gap-1 transition-colors"
          >
            <List className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bullets</span>
          </button>
          <button
            id="ppt-add-metric-btn"
            onClick={() => handleAddElement('metric')}
            disabled={isReadOnly}
            className="px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded flex items-center gap-1 transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Metric</span>
          </button>
          <button
            id="ppt-add-shape-btn"
            onClick={() => handleAddElement('shape')}
            disabled={isReadOnly}
            className="px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded flex items-center gap-1 transition-colors"
          >
            <Square className="w-3.5 h-3.5 text-purple-600" />
            <span>Shape</span>
          </button>
        </div>

        {/* Slide Theme Background */}
        <div className="relative flex items-center pl-2 border-l border-slate-200">
          <button
            id="ppt-theme-btn"
            onClick={() => setShowBgPicker(!showBgPicker)}
            disabled={isReadOnly}
            className="px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded flex items-center gap-1.5 transition-colors"
          >
            <Palette className="w-3.5 h-3.5 text-slate-600" />
            <span>Slide Theme</span>
          </button>
          {showBgPicker && (
            <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex flex-col gap-1 w-44 z-30">
              {backgroundThemes.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => handleUpdateSlideBg(theme.bg, theme.text)}
                  className="px-2.5 py-1 text-xs text-left rounded hover:bg-slate-100 flex items-center justify-between text-slate-700"
                >
                  <span>{theme.name}</span>
                  <div
                    className="w-4 h-4 rounded-full border border-slate-300"
                    style={{ background: theme.bg }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Element Quick Styler */}
        {selectedElement && !isReadOnly && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-orange-200 bg-orange-50/70 py-0.5 px-2 rounded">
            <span className="text-[11px] text-orange-900 font-semibold uppercase">{selectedElement.type}</span>
            <input
              type="number"
              min="10"
              max="72"
              value={selectedElement.fontSize || 16}
              onChange={(e) => handleUpdateElement(selectedElement.id, { fontSize: parseInt(e.target.value, 10) || 16 })}
              className="w-12 px-1 py-0.5 text-xs bg-white border border-orange-300 rounded font-mono"
            />
            <button
              onClick={() =>
                handleUpdateElement(selectedElement.id, {
                  fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold',
                })
              }
              className={`p-1 rounded text-xs font-bold ${
                selectedElement.fontWeight === 'bold' ? 'bg-orange-200 text-orange-900' : 'text-slate-600'
              }`}
            >
              B
            </button>
            <button
              onClick={() => handleDeleteElement(selectedElement.id)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Delete element"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right Tools */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition-colors ${
              showNotes ? 'bg-slate-200 text-slate-800' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Speaker Notes</span>
          </button>

          <button
            onClick={handleExportSlidesJson}
            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded flex items-center gap-1 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body: Left Thumbnails + Center Slide Stage */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Slide Carousel Rail */}
        <div id="ppt-slide-thumbnails" className="w-48 sm:w-56 bg-white border-r border-slate-200 flex flex-col overflow-y-auto p-3 gap-3 select-none">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Slides ({docItem.data.slides.length})</span>
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

                  {/* Thumbnail Preview Aspect Box (16:9) */}
                  <div
                    className="w-full aspect-video rounded overflow-hidden shadow-2xs relative p-1.5 flex flex-col justify-between"
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
                        <div
                          key={el.id}
                          className="h-1.5 flex-1 rounded-xs bg-slate-400/40"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Hover Reorder/Duplicate/Delete toolbar */}
                  {!isReadOnly && (
                    <div className="opacity-0 group-hover:opacity-100 absolute -right-2 top-2 flex flex-col bg-white border border-slate-200 rounded shadow-md z-20 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSlide(index, 'up');
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
                          handleMoveSlide(index, 'down');
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
            {/* 16:9 Presentation Canvas Box */}
            <div
              className="w-full max-w-4xl aspect-video rounded-lg shadow-xl relative overflow-hidden transition-all select-text"
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
                      color: el.fontColor || currentSlide.textColor,
                      background: el.bgColor || 'transparent',
                      textAlign: el.align || 'left',
                      fontWeight: el.fontWeight || 'normal',
                    }}
                    className={`absolute p-2 transition-shadow cursor-pointer ${
                      isSelected && !isReadOnly ? 'ring-2 ring-orange-500 ring-offset-1 rounded' : ''
                    } ${el.shapeType === 'pill' ? 'rounded-full px-3' : ''} ${
                      el.shapeType === 'rounded' ? 'rounded-xl p-4' : ''
                    }`}
                  >
                    {/* Inline Content Editor */}
                    <div
                      contentEditable={!isReadOnly}
                      suppressContentEditableWarning
                      onBlur={(e) => handleUpdateElement(el.id, { content: e.currentTarget.innerText })}
                      className="outline-none whitespace-pre-line"
                    >
                      {el.content}
                    </div>

                    {/* Subtitle for metric cards */}
                    {el.subtitle && (
                      <div
                        contentEditable={!isReadOnly}
                        suppressContentEditableWarning
                        onBlur={(e) => handleUpdateElement(el.id, { subtitle: e.currentTarget.innerText })}
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
            className="w-full max-w-6xl aspect-video rounded-md shadow-2xl relative overflow-hidden select-none transition-all p-12 flex flex-col justify-center"
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
    </div>
  );
};
