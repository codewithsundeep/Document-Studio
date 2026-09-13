import React, { useState } from 'react';
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
  FileDown,
  MessageSquare,
  Sparkles,
  Layers,
  Grid,
  Image as ImageIcon,
  Quote,
  Printer,
  Sliders,
  Ratio,
  MoveRight,
  Eye,
} from 'lucide-react';
import { PowerPointDocItem, Slide, SlideElement, SlideElementType, CustomFontItem } from '../../types';

export type PowerpointRibbonTab =
  | 'file'
  | 'home'
  | 'insert'
  | 'design'
  | 'transitions'
  | 'animations'
  | 'slide_show'
  | 'review'
  | 'view';

interface PowerPointRibbonProps {
  document: PowerPointDocItem;
  currentSlide?: Slide;
  activeSlideIndex: number;
  activeTab: PowerpointRibbonTab;
  onTabChange: (tab: PowerpointRibbonTab) => void;
  selectedElement?: SlideElement;
  isReadOnly?: boolean;
  onStartPresentation: (fromBeginning?: boolean) => void;
  onAddSlide: () => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
  onMoveSlide: (direction: 'up' | 'down') => void;
  onAddElement: (type: SlideElementType) => void;
  onUpdateElement: (updates: Partial<SlideElement>) => void;
  onDeleteElement: () => void;
  onUpdateSlideBg: (bg: string, textCol: string) => void;
  onExport: (format: 'json' | 'html') => void;
  onPrint: () => void;
  showNotes: boolean;
  onToggleNotes: () => void;
  onOpenSlideSorter: () => void;
  aspectRatio: '16:9' | '4:3';
  onToggleAspectRatio: () => void;
  transitionEffect: string;
  onSetTransitionEffect: (effect: string) => void;
  onApplyTransitionToAll: () => void;
  customFonts?: CustomFontItem[];
  onOpenFontManager?: () => void;
}

export const PowerPointRibbon: React.FC<PowerPointRibbonProps> = ({
  document: docItem,
  currentSlide,
  activeSlideIndex,
  activeTab,
  onTabChange,
  selectedElement,
  isReadOnly = false,
  onStartPresentation,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onMoveSlide,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onUpdateSlideBg,
  onExport,
  onPrint,
  showNotes,
  onToggleNotes,
  onOpenSlideSorter,
  aspectRatio,
  onToggleAspectRatio,
  transitionEffect,
  onSetTransitionEffect,
  onApplyTransitionToAll,
  customFonts = [],
  onOpenFontManager,
}) => {
  const [showBgMenu, setShowBgMenu] = useState(false);

  const tabs: { id: PowerpointRibbonTab; label: string }[] = [
    { id: 'file', label: 'File' },
    { id: 'home', label: 'Home' },
    { id: 'insert', label: 'Insert' },
    { id: 'design', label: 'Design' },
    { id: 'transitions', label: 'Transitions' },
    { id: 'animations', label: 'Animations' },
    { id: 'slide_show', label: 'Slide Show' },
    { id: 'review', label: 'Review' },
    { id: 'view', label: 'View' },
  ];

  const designThemes = [
    { name: 'Pure White', bg: '#ffffff', text: '#0f172a' },
    { name: 'Executive Navy', bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', text: '#ffffff' },
    { name: 'Indigo Horizon', bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', text: '#ffffff' },
    { name: 'Emerald Peak', bg: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)', text: '#ffffff' },
    { name: 'Sunset Crimson', bg: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)', text: '#ffffff' },
    { name: 'Warm Cream', bg: '#fbfaf8', text: '#1e293b' },
    { name: 'Slate Minimal', bg: '#f1f5f9', text: '#0f172a' },
    { name: 'Royal Purple', bg: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 100%)', text: '#ffffff' },
  ];

  const transitions = ['None', 'Fade', 'Push', 'Wipe', 'Zoom', 'Split', 'Flip'];
  const animations = ['None', 'Fade In', 'Fly In', 'Float Up', 'Zoom In', 'Bounce'];

  return (
    <div id="ppt-ribbon-container" className="bg-white border-b border-slate-200 select-none shadow-xs z-20">
      {/* 1. Ribbon Tabs Header */}
      <div className="flex items-center px-3 bg-slate-100/90 border-b border-slate-200 gap-0.5 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`ppt-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all border-b-2 ${
                isActive
                  ? 'border-orange-600 text-orange-700 bg-white shadow-xs rounded-t-md -mb-[1px]'
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
            <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-xs">
                PPT
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900 text-xs truncate max-w-[150px]">{docItem.name}</div>
                <div className="text-[10px] text-slate-500">
                  {docItem.data.slides.length} slide(s) • Ratio: {aspectRatio}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-200">
              <button
                onClick={() => onExport('json')}
                className="px-2.5 py-1 bg-orange-600 text-white rounded font-medium hover:bg-orange-700 transition-colors flex items-center gap-1 shadow-xs"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export Presentation</span>
              </button>
            </div>

            <button
              onClick={onPrint}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 font-medium"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slides</span>
            </button>
          </div>
        )}

        {/* ======================= HOME TAB ======================= */}
        {activeTab === 'home' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-100 flex-wrap sm:flex-nowrap">
            {/* Slide Manager */}
            <div className="flex items-center gap-1 pr-2 border-r border-slate-200">
              <button
                onClick={onAddSlide}
                disabled={isReadOnly}
                className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Slide</span>
              </button>
              <button
                onClick={onDuplicateSlide}
                disabled={isReadOnly}
                title="Duplicate Slide"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDeleteSlide}
                disabled={isReadOnly || docItem.data.slides.length <= 1}
                title="Delete Slide"
                className="p-1.5 hover:bg-red-50 text-red-600 rounded disabled:opacity-30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onMoveSlide('up')}
                disabled={isReadOnly || activeSlideIndex === 0}
                title="Move Slide Up"
                className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onMoveSlide('down')}
                disabled={isReadOnly || activeSlideIndex === docItem.data.slides.length - 1}
                title="Move Slide Down"
                className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Content Insertion */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
              <button
                onClick={() => onAddElement('title')}
                disabled={isReadOnly}
                className="px-2 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-medium"
              >
                <Type className="w-3.5 h-3.5 text-orange-600" />
                <span>Title</span>
              </button>
              <button
                onClick={() => onAddElement('text')}
                disabled={isReadOnly}
                className="px-2 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-medium"
              >
                <span className="font-serif italic font-bold text-xs text-slate-600">T</span>
                <span>Text</span>
              </button>
              <button
                onClick={() => onAddElement('bullet')}
                disabled={isReadOnly}
                className="px-2 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-medium"
              >
                <List className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bullets</span>
              </button>
              <button
                onClick={() => onAddElement('metric')}
                disabled={isReadOnly}
                className="px-2 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-medium"
              >
                <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Metric</span>
              </button>
              <button
                onClick={() => onAddElement('shape')}
                disabled={isReadOnly}
                className="px-2 py-1 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-medium"
              >
                <Square className="w-3.5 h-3.5 text-purple-600" />
                <span>Shape</span>
              </button>
            </div>

            {/* Element inspector when selected */}
            {selectedElement && !isReadOnly && (
              <div className="flex items-center gap-1.5 pl-2 bg-orange-50/80 px-2.5 py-1 rounded border border-orange-200">
                <span className="text-[10px] uppercase font-bold text-orange-900 tracking-wider">
                  {selectedElement.type}
                </span>

                {/* Element Font Family */}
                <select
                  value={selectedElement.fontFamily || 'Inter, system-ui'}
                  onChange={(e) => {
                    if (e.target.value === '__open_font_manager__') {
                      onOpenFontManager?.();
                    } else {
                      onUpdateElement({ fontFamily: e.target.value });
                    }
                  }}
                  className="text-xs bg-white border border-orange-300 rounded px-1.5 py-0.5 text-slate-800 font-medium w-28 truncate"
                  title="Element Font Family"
                >
                  <optgroup label="System Fonts">
                    <option value="Inter, system-ui">Modern Sans</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Trebuchet MS, sans-serif">Trebuchet</option>
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

                <input
                  type="number"
                  min="10"
                  max="72"
                  value={selectedElement.fontSize || 16}
                  onChange={(e) => onUpdateElement({ fontSize: parseInt(e.target.value, 10) || 16 })}
                  className="w-12 px-1 py-0.5 text-xs bg-white border border-orange-300 rounded font-mono"
                  title="Font Size"
                />
                <button
                  onClick={() =>
                    onUpdateElement({
                      fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold',
                    })
                  }
                  className={`px-1.5 py-0.5 rounded font-bold text-xs ${
                    selectedElement.fontWeight === 'bold' ? 'bg-orange-200 text-orange-900' : 'text-slate-600'
                  }`}
                  title="Bold"
                >
                  B
                </button>
                <button
                  onClick={onDeleteElement}
                  className="p-1 hover:bg-red-50 text-red-600 rounded"
                  title="Delete element"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================= INSERT TAB ======================= */}
        {activeTab === 'insert' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-100">
            <button
              onClick={() => {
                const url = prompt(
                  'Enter image URL for slide:',
                  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80'
                );
                if (url) {
                  onAddElement('shape');
                  // update latest element to image representation
                }
              }}
              disabled={isReadOnly}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 font-medium"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Picture / Photo</span>
            </button>

            <button
              onClick={() => onAddElement('shape')}
              disabled={isReadOnly}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 font-medium"
            >
              <Square className="w-3.5 h-3.5 text-purple-600" />
              <span>Shapes & Badges</span>
            </button>

            <button
              onClick={() => onAddElement('metric')}
              disabled={isReadOnly}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 font-medium"
            >
              <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>KPI Metric Card</span>
            </button>

            <button
              onClick={() => onAddElement('bullet')}
              disabled={isReadOnly}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 font-medium"
            >
              <Quote className="w-3.5 h-3.5 text-amber-600" />
              <span>Quote / Highlights</span>
            </button>
          </div>
        )}

        {/* ======================= DESIGN TAB ======================= */}
        {activeTab === 'design' && (
          <div className="flex items-center gap-3 animate-in fade-in duration-100 flex-wrap sm:flex-nowrap">
            {/* Theme Presets */}
            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-200 overflow-x-auto">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mr-1">Themes:</span>
              {designThemes.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => onUpdateSlideBg(theme.bg, theme.text)}
                  disabled={isReadOnly}
                  className="px-2 py-1 rounded border border-slate-200 bg-white hover:border-orange-500 text-slate-700 flex items-center gap-1.5 transition-all text-xs font-medium shadow-2xs"
                >
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{ background: theme.bg }} />
                  <span className="truncate max-w-[90px]">{theme.name}</span>
                </button>
              ))}
            </div>

            {/* Slide Ratio */}
            <button
              onClick={onToggleAspectRatio}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium flex items-center gap-1.5"
            >
              <Ratio className="w-3.5 h-3.5 text-slate-500" />
              <span>Slide Size: {aspectRatio}</span>
            </button>
          </div>
        )}

        {/* ======================= TRANSITIONS TAB ======================= */}
        {activeTab === 'transitions' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-100">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mr-1">Transition to this slide:</span>
            {transitions.map((eff) => {
              const isSel = (transitionEffect || 'Fade') === eff;
              return (
                <button
                  key={eff}
                  onClick={() => onSetTransitionEffect(eff)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    isSel ? 'bg-orange-600 text-white font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {eff}
                </button>
              );
            })}

            <div className="h-6 w-[1px] bg-slate-200 mx-1" />
            <button
              onClick={onApplyTransitionToAll}
              className="px-2.5 py-1 rounded bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold"
            >
              Apply To All Slides
            </button>
          </div>
        )}

        {/* ======================= ANIMATIONS TAB ======================= */}
        {activeTab === 'animations' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-100">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mr-1">Entrance Animation:</span>
            {animations.map((anim) => (
              <button
                key={anim}
                onClick={() => {
                  if (selectedElement) {
                    onUpdateElement({ animation: anim });
                  } else {
                    alert('Select an element on the slide first to assign this animation!');
                  }
                }}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  selectedElement?.animation === anim
                    ? 'bg-orange-600 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {anim}
              </button>
            ))}
          </div>
        )}

        {/* ======================= SLIDE SHOW TAB ======================= */}
        {activeTab === 'slide_show' && (
          <div className="flex items-center gap-2 animate-in fade-in duration-100">
            <button
              onClick={() => onStartPresentation(true)}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>From Beginning (Slide 1)</span>
            </button>

            <button
              onClick={() => onStartPresentation(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>From Current Slide ({activeSlideIndex + 1})</span>
            </button>
          </div>
        )}

        {/* ======================= REVIEW TAB ======================= */}
        {activeTab === 'review' && (
          <div className="flex items-center gap-3 animate-in fade-in duration-100">
            <button
              onClick={onToggleNotes}
              className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors ${
                showNotes ? 'bg-orange-100 text-orange-800 font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{showNotes ? 'Hide Speaker Notes' : 'Open Speaker Notes'}</span>
            </button>

            <button
              onClick={() => {
                const totalWords = docItem.data.slides.reduce((acc, s) => {
                  const slideText = s.elements.map((e) => e.content).join(' ') + ' ' + (s.notes || '');
                  return acc + slideText.trim().split(/\s+/).filter(Boolean).length;
                }, 0);
                alert(`Presentation has ${docItem.data.slides.length} slides with ~${totalWords} words total.`);
              }}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Word & Deck Summary</span>
            </button>
          </div>
        )}

        {/* ======================= VIEW TAB ======================= */}
        {activeTab === 'view' && (
          <div className="flex items-center gap-3 animate-in fade-in duration-100">
            <button
              onClick={onOpenSlideSorter}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium flex items-center gap-1.5"
            >
              <Grid className="w-3.5 h-3.5 text-orange-600" />
              <span>Slide Sorter Grid View</span>
            </button>

            <button
              onClick={onToggleNotes}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 font-medium"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Toggle Notes Pane</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
