import { Component, ElementRef, HostListener, Input, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  ButtonDirective,
  ButtonGroupComponent,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  FormCheckComponent,
  FormCheckInputDirective,
  FormCheckLabelDirective,
  FormControlDirective,
  FormDirective,
  FormLabelDirective,
  FormSelectDirective,
  FormTextDirective,
  RowComponent,
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  ButtonCloseDirective,
  TableDirective
} from '@coreui/angular';
import {
  TicketBarcodeTextPosition,
  TicketBarcodeType,
  TicketColumn,
  TicketContentType,
  TicketDataType,
  TicketElement,
  TicketPosition,
  TicketSection,
  TicketTableElement,
  Selection,
  TicketTemplate,
  createDefaultTemplate,
  TextSegment,
  MediaBlock,
  TicketBarcodeElement,
  TicketQrElement
} from '../../../models/ticket.models';
import { SAMPLE_LISTS, SAMPLE_VARIABLES, resolveSampleRows, resolveSampleValue } from './sample-data';
import { IconDirective, IconSetService } from '@coreui/icons-angular';



const BARCODE_FORMATS: Record<TicketBarcodeType, string> = {
  EAN8: 'EAN8',
  EAN13: 'EAN13',
  UPCA: 'UPC',
  UPCE: 'UPC',
  CODE128: 'CODE128'
};

const DEFAULTS = {
  BARCODE: '7501055300075',
  QRCODE: 'https://jhonypos.mx',
  IMAGE: 'https://placehold.co/200x100.png',
  TEXT: 'Nuevo texto'
};



@Component({
  selector: 'app-tickets-editor',
  templateUrl: './tickets-editor.component.html',
  styleUrl: './tickets-editor.component.scss',
  providers: [IconSetService],
  imports: [

    ReactiveFormsModule,
    ButtonDirective,
    ButtonGroupComponent,
    CardBodyComponent,
    CardHeaderComponent,
    CardComponent,
    ColComponent,
    RowComponent,
    FormCheckComponent,
    FormCheckInputDirective,
    FormCheckLabelDirective,
    FormControlDirective,
    FormDirective,
    FormLabelDirective,
    FormSelectDirective,
    FormTextDirective,
    ModalBodyComponent,
    ModalComponent,
    ModalFooterComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ButtonCloseDirective,
    TableDirective,
    IconDirective
  ]
})
export class TicketsEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly mediaCache = new Map<string, MediaBlock>();

  constructor(public iconSet: IconSetService) {

  }

  readonly positions: { value: TicketPosition; label: string }[] = [
    { value: 'LEFT', label: 'Izquierda' },
    { value: 'CENTER', label: 'Centro' },
    { value: 'RIGHT', label: 'Derecha' }
  ];
  readonly dataTypes: { value: TicketDataType; label: string }[] = [
    { value: 'TEXT', label: 'Texto' },
    { value: 'INTEGER', label: 'Número entero' },
    { value: 'MONEY', label: 'Dinero' }
  ];
  readonly sections: { value: TicketSection; label: string }[] = [
    { value: 'header', label: 'Encabezado' },
    { value: 'body', label: 'Cuerpo' }
  ];
  readonly elementTypes: { value: TicketContentType; label: string }[] = [
    { value: 'TEXT', label: 'Texto' },
    { value: 'TABLE', label: 'Tabla' },
    { value: 'BARCODE', label: 'Código de barras' },
    { value: 'QRCODE', label: 'Código QR' },
    { value: 'IMAGE', label: 'Imagen' }
  ];
  readonly barcodeTypes: { value: TicketBarcodeType; label: string }[] = [
    { value: 'EAN13', label: 'EAN-13' },
    { value: 'EAN8', label: 'EAN-8' },
    { value: 'UPCA', label: 'UPC-A' },
    { value: 'UPCE', label: 'UPC-E' },
    { value: 'CODE128', label: 'Code 128' }
  ];
  readonly barcodeTextPositions: { value: TicketBarcodeTextPosition; label: string }[] = [
    { value: 'BELOW', label: 'Debajo' },
    { value: 'ABOVE', label: 'Arriba' },
    { value: 'NONE', label: 'Sin texto' }
  ];
  readonly variables = SAMPLE_VARIABLES;
  readonly lists = SAMPLE_LISTS;

  settingsForm: FormGroup = this.fb.nonNullable.group({
    dpi: [203],
    maxChars: [32],
    widthMm: [48],
    showGrid: [false]
  });

  @Input() template: TicketTemplate | null = null;

  ticket: TicketTemplate = createDefaultTemplate();
  private initialSnapshot = '';

  selection: Selection | null = null;
  toolbarVisible = false;
  elementForm: FormGroup = this.buildElementForm();
  readonly maxColumns = 4;
  readonly paperPadding = 20;
  columnModalVisible = false;
  editingColumnIndex: number | null = null;
  columnForm: FormGroup = this.buildColumn();

  ngOnInit(): void {
    this.ticket = this.template ? structuredClone(this.template) : createDefaultTemplate();
    this.initialSnapshot = JSON.stringify(this.ticket);
    this.elementForm.valueChanges.subscribe(() => this.applyElementForm());
  }

  get settings() {
    return this.settingsForm.getRawValue() as { dpi: number; maxChars: number; widthMm: number; showGrid: boolean };
  }

  get widthPx(): number {
    return (this.settings.widthMm / 25.4) * this.settings.dpi;
  }

  get charWidthPx(): number {
    return this.widthPx / Math.max(1, this.settings.maxChars);
  }

  get fontSizePx(): number {
    // Monospace glyphs are ~0.6em wide
    return this.charWidthPx / 0.6;
  }

  get columns(): FormArray {
    return this.elementForm.get('columns') as FormArray;
  }

  get elementType(): TicketContentType {
    return this.elementForm.get('typeContent')?.value;
  }

  get selectedElement(): TicketElement | null {
    return this.selection ? this.ticket[this.selection.section][this.selection.index] : null;
  }

  private buildElementForm(): FormGroup {
    return this.fb.nonNullable.group({
      typeContent: ['TEXT' as TicketContentType],
      position: ['LEFT' as TicketPosition],
      bold: [false],
      content: [''],
      maxChars: [32],
      dataType: ['TEXT' as TicketDataType],
      field: [''],
      barcodeType: ['EAN13' as TicketBarcodeType],
      height: [10],
      textPosition: ['BELOW' as TicketBarcodeTextPosition],
      size: [25],
      columns: this.fb.array<FormGroup>([])
    });
  }

  private buildColumn(c?: TicketColumn): FormGroup {
    return this.fb.nonNullable.group({
      field: [c?.field ?? ''],
      title: [c?.title ?? ''],
      position: [c?.position ?? ('LEFT' as TicketPosition)],
      maxChars: [c?.maxChars ?? 10],
      dataType: [c?.dataType ?? ('TEXT' as TicketDataType)]
    });
  }

  // Inline editing from the preview (double click)
  private editing: Selection | null = null;
  inlineValue = '';

  isEditing(section: TicketSection, index: number): boolean {
    return this.editing?.section === section && this.editing.index === index;
  }

  startInlineEdit(section: TicketSection, index: number): void {
    const el = this.ticket[section][index];
    // Tables have no single text content; they are edited from the form
    if (!('content' in el)) return;
    this.select(section, index);
    this.inlineValue = el.content;
    this.editing = { section, index };
    this.toolbarVisible = false;
    setTimeout(() => {
      const input = this.host.nativeElement.querySelector('.inline-editor') as HTMLInputElement | null;
      input?.focus();
      input?.select();
    });
  }

  commitInlineEdit(value: string): void {
    if (!this.editing) return;
    this.editing = null;
    this.elementForm.get('content')?.setValue(value);
  }

  cancelInlineEdit(): void {
    this.editing = null;
  }

  select(section: TicketSection, index: number): void {
    this.selection = { section, index };
    this.toolbarVisible = true;
    const el = this.ticket[section][index];
    this.columns.clear({ emitEvent: false });
    if (el.typeContent === 'TABLE') {
      el.columns.forEach(c => this.columns.push(this.buildColumn(c), { emitEvent: false }));
    }
    const text = el.typeContent === 'TEXT' ? el : null;
    this.elementForm.patchValue(
      {
        typeContent: el.typeContent,
        position: el.position,
        bold: 'bold' in el ? el.bold : false,
        content: 'content' in el ? el.content : '',
        maxChars: text ? text.maxChars : this.settings.maxChars,
        dataType: text ? text.dataType : 'TEXT',
        field: el.typeContent === 'TABLE' ? el.field : '',
        barcodeType: el.typeContent === 'BARCODE' ? el.barcodeType : 'EAN13',
        height: el.typeContent === 'BARCODE' ? el.height : 10,
        textPosition: el.typeContent === 'BARCODE' ? el.textPosition : 'BELOW',
        size: el.typeContent === 'QRCODE' || el.typeContent === 'IMAGE' ? el.size : 25
      },
      { emitEvent: false }
    );
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement | null)?.closest('.ticket-el')) this.toolbarVisible = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.toolbarVisible = false;
  }

  isSelected(section: TicketSection, index: number): boolean {
    return this.selection?.section === section && this.selection.index === index;
  }

  private applyElementForm(): void {
    if (!this.selection) return;
    const v = this.elementForm.getRawValue();
    const { section, index } = this.selection;
    this.ticket[section][index] = this.buildElement(v.typeContent, v);
  }

  private buildElement(type: TicketContentType, v: any): TicketElement {
    switch (type) {
      case 'TABLE':
        return {
          position: v.position,
          typeContent: 'TABLE',
          bold: v.bold,
          field: v.field,
          columns: v.columns.map((c: TicketColumn) => ({ ...c, maxChars: Number(c.maxChars) }))
        };
      case 'BARCODE':
        return {
          position: v.position,
          typeContent: 'BARCODE',
          content: v.content,
          barcodeType: v.barcodeType,
          height: Number(v.height),
          textPosition: v.textPosition
        };
      case 'QRCODE':
        return { position: v.position, typeContent: 'QRCODE', content: v.content, size: Number(v.size) };
      case 'IMAGE':
        return { position: v.position, typeContent: 'IMAGE', content: v.content, size: Number(v.size) };
      default:
        return {
          position: v.position,
          typeContent: 'TEXT',
          content: this.stripMediaTags(v.content),
          bold: v.bold,
          maxChars: Number(v.maxChars),
          dataType: v.dataType
        };
    }
  }

  /** Text elements only accept <b>, <i> and <u>. */
  private stripMediaTags(content: string): string {
    return content.replace(/<\/?(barcode|qrcode|img)\b[^>]*>/gi, '');
  }

  onContentInput(): void {
    if (this.elementType !== 'TEXT') return;
    const control = this.elementForm.get('content');
    const clean = this.stripMediaTags(control?.value ?? '');
    if (clean !== control?.value) control?.setValue(clean);
  }

  onTypeChange(): void {
    const type = this.elementType;
    this.elementForm.get('content')?.setValue(type === 'TABLE' ? '' : DEFAULTS[type as keyof typeof DEFAULTS], { emitEvent: false });
    if (type === 'IMAGE') this.elementForm.get('size')?.setValue(0, { emitEvent: false });
    else if (type === 'QRCODE') this.elementForm.get('size')?.setValue(25, { emitEvent: false });
    this.applyElementForm();
  }

  addElement(section: TicketSection, type: TicketContentType): void {
    const list = this.ticket[section];
    const base = {
      position: 'LEFT' as TicketPosition,
      bold: false,
      maxChars: this.settings.maxChars,
      dataType: 'TEXT' as TicketDataType,
      field: 'detail',
      columns: [],
      barcodeType: 'EAN13' as TicketBarcodeType,
      height: 10,
      textPosition: 'BELOW' as TicketBarcodeTextPosition,
      size: type === 'IMAGE' ? 0 : 25,
      content: type === 'TABLE' ? '' : DEFAULTS[type as keyof typeof DEFAULTS]
    };
    list.push(this.buildElement(type, base));
    this.select(section, list.length - 1);
  }

  removeElement(): void {
    if (!this.selection) return;
    this.ticket[this.selection.section].splice(this.selection.index, 1);
    this.selection = null;
  }

  moveElement(delta: number): void {
    if (!this.selection) return;
    const { section, index } = this.selection;
    const list = this.ticket[section];
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    this.selection = { section, index: target };
  }

  dragOver: Selection | null = null;

  get isDragging(): boolean {
    return this.dragSource !== null;
  }

  private dragSource: Selection | null = null;

  onDragStart(event: DragEvent, section: TicketSection, index: number): void {
    this.dragSource = { section, index };
    event.dataTransfer?.setData('text/plain', `${section}:${index}`);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent, section: TicketSection, index: number): void {
    if (!this.dragSource) return;
    event.preventDefault();
    this.dragOver = { section, index };
  }

  onDrop(event: DragEvent, section: TicketSection, index: number): void {
    event.preventDefault();
    const src = this.dragSource;
    this.onDragEnd();
    if (!src || (src.section === section && src.index === index)) return;
    const [moved] = this.ticket[src.section].splice(src.index, 1);
    this.ticket[section].splice(index, 0, moved);
    this.select(section, index);
  }

  onDragEnd(): void {
    this.dragSource = null;
    this.dragOver = null;
  }

  insertVariable(name: string): void {
    const control = this.elementForm.get('content');
    control?.setValue(`${control.value ?? ''}{${name}}`);
  }

  openColumnModal(index: number | null = null): void {
    if (index === null && this.columns.length >= this.maxColumns) return;
    this.editingColumnIndex = index;
    const value = index === null ? this.buildColumn().getRawValue() : this.columns.at(index).getRawValue();
    this.columnForm.reset(value);
    this.columnModalVisible = true;
  }

  closeColumnModal(): void {
    this.columnModalVisible = false;
  }

  saveColumn(): void {
    const value = this.columnForm.getRawValue();
    value.maxChars = Number(value.maxChars);
    if (this.editingColumnIndex === null) {
      if (this.columns.length < this.maxColumns) this.columns.push(this.buildColumn(value));
    } else {
      this.columns.at(this.editingColumnIndex).patchValue(value);
    }
    this.closeColumnModal();
  }

  removeColumn(i: number): void {
    this.columns.removeAt(i);
  }

  getTemplate(): TicketTemplate {
    return structuredClone(this.ticket);
  }

  isDirty(): boolean {
    return JSON.stringify(this.ticket) !== this.initialSnapshot;
  }

  /** Marks the current state as saved. */
  markPristine(): void {
    this.initialSnapshot = JSON.stringify(this.ticket);
  }

  // ---- Preview rendering ----

  formatValue(value: unknown, type: TicketDataType): string {
    if (value === undefined || value === null) return '';
    const num = typeof value === 'number' ? value : Number(value);
    const numeric = value !== '' && !Number.isNaN(num);
    if (type === 'MONEY' && numeric) return '$' + num.toFixed(2);
    if (type === 'INTEGER' && numeric) return String(Math.trunc(num));
    return String(value);
  }

  /** Resolves variables and parses <b>, <i>, <u> tags into styled segments; tags take no width. */
  renderSegments(el: TicketElement, text?: string): TextSegment[] {
    if (el.typeContent !== 'TEXT') return [];
    text ??= this.resolveVariables(el);
    const limit = Math.min(el.maxChars, this.settings.maxChars);
    const segments: TextSegment[] = [];
    const style = { b: false, i: false, u: false };
    let remaining = limit;
    let used = 0;
    let last = 0;
    const push = (chunk: string) => {
      const part = chunk.slice(0, remaining);
      if (!part) return;
      segments.push({ text: part, ...style });
      remaining -= part.length;
      used += part.length;
    };
    for (const m of text.matchAll(/<(\/?)([biu])>/gi)) {
      push(text.slice(last, m.index));
      style[m[2].toLowerCase() as 'b' | 'i' | 'u'] = m[1] === '';
      last = m.index + m[0].length;
    }
    push(text.slice(last));

    const space = Math.max(0, this.settings.maxChars - used);
    const plain = (n: number) => ({ text: ' '.repeat(n), b: false, i: false, u: false });
    if (el.position === 'RIGHT') segments.unshift(plain(space));
    else if (el.position === 'CENTER') {
      const left = Math.floor(space / 2);
      segments.unshift(plain(left));
      segments.push(plain(space - left));
    } else segments.push(plain(space));
    return segments;
  }

  private resolveVariables(el: TicketElement): string {
    if (!('content' in el)) return '';
    const dataType = el.typeContent === 'TEXT' ? el.dataType : 'TEXT';
    return el.content.replace(/\{([\w.]+)\}/g, (match, key) => {
      const value = resolveSampleValue(key);
      return value === undefined ? match : this.formatValue(value, dataType);
    });
  }

  renderMedia(el: TicketElement): MediaBlock | null {
    if (el.typeContent !== 'BARCODE' && el.typeContent !== 'QRCODE' && el.typeContent !== 'IMAGE') return null;
    const content = this.resolveVariables(el).trim();
    const key = JSON.stringify([el, content, this.settings.dpi]);
    const cached = this.mediaCache.get(key);
    if (cached) return cached;
    const block = this.createMedia(el, content);
    if (this.mediaCache.size > 200) this.mediaCache.clear();
    this.mediaCache.set(key, block);
    return block;
  }

  private mmToPx(mm: number): number {
    return (mm / 25.4) * this.settings.dpi;
  }


  


  private createSvgURL(svg: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl('data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))));
  }

  private createMedia(el: TicketElement, value: string): MediaBlock {
    const tag = el.typeContent === 'BARCODE' ? 'barcode' : el.typeContent === 'QRCODE' ? 'qrcode' : 'img';
    const fail = (error: string): MediaBlock => ({ tag, src: null, widthPx: null, error });
    if (!value) return fail('Sin contenido');
    try {
      if (el.typeContent === 'QRCODE') {
        const { size: n, data } = QRCode.create(value, { errorCorrectionLevel: 'M' }).modules;
        let path = '';
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (data[y * n + x]) path += `M${x} ${y}h1v1h-1z`;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
        return { tag, src: this.createSvgURL(svg), widthPx: this.mmToPx(el.size || 25), error: '' };
      }
      if (el.typeContent === 'BARCODE') {
        const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        JsBarcode(svgEl, value, {
          format: BARCODE_FORMATS[el.barcodeType],
          height: Math.max(10, this.mmToPx(el.height || 10)),
          displayValue: el.textPosition !== 'NONE',
          textPosition: el.textPosition === 'ABOVE' ? 'top' : 'bottom',
          margin: 0,
          width: 2,
          flat: el.barcodeType === 'UPCE',
          valid: () => undefined
        });
        const svg = new XMLSerializer().serializeToString(svgEl);
        const w = Number(/width="([\d.]+)/.exec(svg)?.[1] ?? 0);
        return { tag, src: this.createSvgURL(svg), widthPx: w || null, error: '' };
      }
      if (/^(https?:\/\/|data:image\/|\/|\.\/)/i.test(value)) {
        const widthPx = el.typeContent === 'IMAGE' && el.size ? this.mmToPx(el.size) : null;
        return { tag, src: value, widthPx, error: '' };
      }
      return fail('Usa una URL o data:image');
    } catch {
      return fail('Valor inválido para este tipo');
    }
  }

  wrapSelection(input: HTMLInputElement, tag: 'b' | 'i' | 'u'): void {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const v = input.value;
    const control = this.elementForm.get('content');
    control?.setValue(`${v.slice(0, start)}<${tag}>${v.slice(start, end)}</${tag}>${v.slice(end)}`);
    input.focus();
  }

  pad(text: string, width: number, position: TicketPosition): string {
    const t = text.slice(0, width);
    const space = Math.max(0, width - t.length);
    if (position === 'RIGHT') return ' '.repeat(space) + t;
    if (position === 'CENTER') {
      const left = Math.floor(space / 2);
      return ' '.repeat(left) + t + ' '.repeat(space - left);
    }
    return t + ' '.repeat(space);
  }

  tableLines(el: TicketElement): string[] {
    if (el.typeContent !== 'TABLE') return [];
    const row = (get: (c: TicketColumn) => string) =>
      el.columns.map(c => this.pad(get(c), c.maxChars, c.position)).join('');
    const rows = resolveSampleRows(el.field, el.columns.map(c => c.field));
    return [
      row(c => c.title),
      ...rows.map((r, i) => row(c => this.formatValue(resolveSampleValue(c.field, r, i), c.dataType)))
    ].map(l => this.pad(l, this.settings.maxChars, el.position));
  }
}
