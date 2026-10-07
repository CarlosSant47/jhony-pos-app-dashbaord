export type TicketPosition = 'LEFT' | 'CENTER' | 'RIGHT';
export type TicketContentType = 'TEXT' | 'TABLE';
export type TicketDataType = 'TEXT' | 'INTEGER' | 'MONEY';
export type TicketSection = 'header' | 'body';

export interface TicketColumn {
  field: string;
  title: string;
  position: TicketPosition;
  maxChars: number;
  dataType: TicketDataType;
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

export type TicketElement = TicketTextElement | TicketTableElement;

export interface TicketTemplate {
  header: TicketElement[];
  body: TicketElement[];
}

export interface TicketPreviewSettings {
  dpi: number;
  maxChars: number;
  widthMm: number;
}
