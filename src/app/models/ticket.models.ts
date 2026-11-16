import { SafeUrl } from "@angular/platform-browser";

export type TicketPosition = 'LEFT' | 'CENTER' | 'RIGHT';
export type TicketContentType = 'TEXT' | 'TABLE' | 'BARCODE' | 'QRCODE' | 'IMAGE';
export type TicketBarcodeType = 'EAN8' | 'EAN13' | 'UPCA' | 'UPCE' | 'CODE128';
export type TicketBarcodeTextPosition = 'ABOVE' | 'BELOW' | 'NONE';
export type TicketDataType = 'TEXT' | 'INTEGER' | 'MONEY';
export type TicketSection = 'header' | 'body' | 'footer';
/** What the editor shows: only the body, or the header and footer of a sell point. */
export type TicketEditorMode = 'body' | 'sell-point';

export interface TicketColumn {
  field: string;
  title: string;
  position: TicketPosition;
  maxChars: number;
  dataType: TicketDataType;
  allowLineBreak?: boolean;
}

export interface TicketTextElement {
  position: TicketPosition;
  typeContent: 'TEXT';
  content: string;
  bold: boolean;
  maxChars: number;
  dataType: TicketDataType;
}

export interface TicketTableElement {
  position: TicketPosition;
  typeContent: 'TABLE';
  bold: boolean;
  field: string;
  columns: TicketColumn[];
}

export interface TicketBarcodeElement {
  position: TicketPosition;
  typeContent: 'BARCODE';
  content: string;
  barcodeType: TicketBarcodeType;
  /** Height in mm */
  height: number;
  textPosition: TicketBarcodeTextPosition;
}

export interface TicketQrElement {
  position: TicketPosition;
  typeContent: 'QRCODE';
  content: string;
  /** Size in mm */
  size: number;
}

export interface TicketImageElement {
  position: TicketPosition;
  typeContent: 'IMAGE';
  /** URL or data:image */
  content: string;
  /** Width in mm, 0 = natural size */
  size: number;
}

export type TicketElement =
  | TicketTextElement
  | TicketTableElement
  | TicketBarcodeElement
  | TicketQrElement
  | TicketImageElement;

export interface TicketTemplate {
  body: TicketElement[];
}

export interface TicketSellPointLayout {
  header: TicketElement[];
  footer: TicketElement[];
}

/** All sections the editor can hold; each mode uses a subset. */
export type TicketLayout = TicketTemplate & TicketSellPointLayout;

export interface TicketPreviewSettings {
  dpi: number;
  maxChars: number;
  widthMm: number;
}

export interface Selection {
  section: TicketSection;
  index: number;
}

export interface TextSegment {
  text: string;
  b: boolean;
  i: boolean;
  u: boolean;
}

export interface MediaBlock {
  tag: 'barcode' | 'qrcode' | 'img';
  src: SafeUrl | string | null;
  widthPx: number | null;
  error: string;
}

/** Ticket stored in the backend. */
export interface TicketRecord {
  id: number;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  template: TicketTemplate;
}

/** Body for create/update (id and audit dates are assigned by the backend). */
export type TicketPayload = Pick<TicketRecord, 'name' | 'description' | 'active' | 'template'>;

/** Mirrors Spring Data's Pageable query parameters. */
export interface PageRequest {
  /** Zero-based page index */
  page: number;
  size: number;
  /** Spring format: "field,asc" | "field,desc" */
  sort: string;
  search: string;
}

/** Mirrors Spring Data's Page<T> JSON. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  /** Zero-based current page */
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export const createDefaultTemplate = (): TicketTemplate => ({
  body: [
    { position: 'LEFT', typeContent: 'TEXT', content: 'Body', bold: false, maxChars: 32, dataType: 'TEXT' },
  ]
});

export const createDefaultSellPointLayout = (): TicketSellPointLayout => ({
  header: [
    { position: 'CENTER', typeContent: 'TEXT', content: 'Title', bold: true, maxChars: 32, dataType: 'TEXT' },
  ],
  footer: [
    { position: 'CENTER', typeContent: 'TEXT', content: 'Gracias por su compra', bold: false, maxChars: 32, dataType: 'TEXT' },
  ]
});

/** header and footer are JSON-serialized TicketElement[]. */
export interface TicketTemplateSellPoint {
  id: string;
  sellPointId: number;
  sellPointName?: string;
  header: string;
  footer: string;
}

export type TicketTemplateSellPointPayload = Pick<TicketTemplateSellPoint, 'sellPointId' | 'header' | 'footer'>;

/** GET /v1/sell-point. */
export interface SellPoint {
  sellPointId: number;
  name: string;
  rfc: string;
  fullAddress: string;
  phone: string;
  email: string;
}
