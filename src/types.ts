export type DocumentType = 'word' | 'excel' | 'powerpoint' | 'pdf';

export interface BaseDocument {
  id: string;
  name: string;
  type: DocumentType;
  lastModified: number;
  fileSize?: string;
  isSample?: boolean;
}

// Word Document Types
export interface WordDocumentData {
  htmlContent: string;
  fontFamily: string;
  fontSize: string;
  pageOrientation: 'portrait' | 'landscape';
  pageSize: 'a4' | 'letter';
  lineSpacing: '1.0' | '1.15' | '1.5' | '2.0';
}

// Excel Document Types
export interface ExcelCell {
  raw: string; // The user input, e.g. "=SUM(A1:A5)" or "1500" or "Revenue"
  computed?: string | number;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  bg?: string;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'number' | 'currency' | 'percent';
}

export type ExcelGridData = Record<string, ExcelCell>; // Key: "A1", "B2" etc.

export interface ExcelSheet {
  id: string;
  name: string;
  data: ExcelGridData;
  rowCount: number;
  colCount: number;
}

export interface ExcelDocumentData {
  sheets: ExcelSheet[];
  activeSheetIndex: number;
}

// PowerPoint Document Types
export type SlideElementType = 'title' | 'text' | 'bullet' | 'shape' | 'metric' | 'image';

export interface SlideElement {
  id: string;
  type: SlideElementType;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  content: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'semibold';
  fontColor?: string;
  bgColor?: string;
  align?: 'left' | 'center' | 'right';
  shapeType?: 'rectangle' | 'rounded' | 'circle' | 'callout' | 'pill';
  subtitle?: string; // For metric/card
}

export interface Slide {
  id: string;
  title: string;
  bgColor: string;
  textColor: string;
  elements: SlideElement[];
  notes?: string;
}

export interface PowerPointDocumentData {
  slides: Slide[];
  activeSlideIndex: number;
  aspectRatio: '16:9' | '4:3';
}

// PDF Document Types
export interface PDFAnnotation {
  id: string;
  pageNumber: number;
  type: 'highlight' | 'note' | 'signature' | 'text';
  x: number; // percentage
  y: number; // percentage
  width?: number;
  height?: number;
  color: string;
  text?: string;
  createdAt: number;
}

export interface PDFDocumentData {
  pdfUrl?: string; // Blob URL or object URL
  pdfDataBuffer?: Uint8Array;
  fileName: string;
  pageCount: number;
  currentPage: number;
  scale: number;
  rotation: number;
  annotations: PDFAnnotation[];
}

// Union Document Data
export interface WordDocItem extends BaseDocument {
  type: 'word';
  data: WordDocumentData;
}

export interface ExcelDocItem extends BaseDocument {
  type: 'excel';
  data: ExcelDocumentData;
}

export interface PowerPointDocItem extends BaseDocument {
  type: 'powerpoint';
  data: PowerPointDocumentData;
}

export interface PDFDocItem extends BaseDocument {
  type: 'pdf';
  data: PDFDocumentData;
}

export type DocumentItem = WordDocItem | ExcelDocItem | PowerPointDocItem | PDFDocItem;
