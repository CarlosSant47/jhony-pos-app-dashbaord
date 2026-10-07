import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  ButtonDirective,
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
  RowComponent
} from '@coreui/angular';
import {
  TicketColumn,
  TicketContentType,
  TicketDataType,
  TicketElement,
  TicketPosition,
  TicketSection,
  TicketTableElement,
  TicketTemplate
} from './ticket.models';
import { SAMPLE_LISTS, SAMPLE_VARIABLES, resolveSampleRows, resolveSampleValue } from './sample-data';

interface Selection {
  section: TicketSection;
  index: number;
}

@Component({
  selector: 'app-tickets-editor',
  templateUrl: './tickets-editor.component.html',
  styleUrl: './tickets-editor.component.scss',
  imports: [
    ReactiveFormsModule,
    ButtonDirective,
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
    FormTextDirective
  ]
})
export class TicketsEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

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
  readonly variables = SAMPLE_VARIABLES;
  readonly lists = SAMPLE_LISTS;

  settingsForm: FormGroup = this.fb.nonNullable.group({
    dpi: [203],
    maxChars: [32],
    widthMm: [58],
    showGrid: [false]
  });

  ticket: TicketTemplate = {
    header: [
      { position: 'CENTER', typeContent: 'TEXT', content: 'TICKET {folio}', bold: true, maxChars: 32, dataType: 'TEXT' },
      { position: 'LEFT', typeContent: 'TEXT', content: 'Cliente: {customerName}', bold: false, maxChars: 32, dataType: 'TEXT' }
    ],
    body: [
      { position: 'LEFT', typeContent: 'TEXT', content: 'Ruta: {routeName}', bold: false, maxChars: 32, dataType: 'TEXT' },
      {
        position: 'LEFT',
        typeContent: 'TABLE',
        bold: false,
        field: 'detail',
        columns: [
          { field: 'productName', title: 'Producto', position: 'LEFT', maxChars: 10, dataType: 'TEXT' },
          { field: 'quantity', title: 'Cantidad', position: 'CENTER', maxChars: 10, dataType: 'INTEGER' },
          { field: 'price', title: 'Total', position: 'LEFT', maxChars: 10, dataType: 'MONEY' }
        ]
      },
      { position: 'RIGHT', typeContent: 'TEXT', content: 'TOTAL: {grandTotal}', bold: true, maxChars: 32, dataType: 'MONEY' }
    ]
  };

  selection: Selection | null = null;
  elementForm: FormGroup = this.buildElementForm();
  submitted = false;
  jsonOutput = '';

  ngOnInit(): void {
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

  get isTable(): boolean {
    return this.elementForm.get('typeContent')?.value === 'TABLE';
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

  select(section: TicketSection, index: number): void {
    this.selection = { section, index };
    const el = this.ticket[section][index];
    this.columns.clear({ emitEvent: false });
    if (el.typeContent === 'TABLE') {
      el.columns.forEach(c => this.columns.push(this.buildColumn(c), { emitEvent: false }));
    }
    this.elementForm.patchValue(
      {
        typeContent: el.typeContent,
        position: el.position,
        bold: el.bold,
        content: el.typeContent === 'TEXT' ? el.content : '',
        maxChars: el.typeContent === 'TEXT' ? el.maxChars : this.settings.maxChars,
        dataType: el.typeContent === 'TEXT' ? el.dataType : 'TEXT',
        field: el.typeContent === 'TABLE' ? el.field : ''
      },
      { emitEvent: false }
    );
  }

  isSelected(section: TicketSection, index: number): boolean {
    return this.selection?.section === section && this.selection.index === index;
  }

  private applyElementForm(): void {
    if (!this.selection) return;
    const v = this.elementForm.getRawValue();
    const { section, index } = this.selection;
    this.ticket[section][index] =
      v.typeContent === 'TABLE'
        ? ({
            position: v.position,
            typeContent: 'TABLE',
            bold: v.bold,
            field: v.field,
            columns: v.columns.map((c: TicketColumn) => ({ ...c, maxChars: Number(c.maxChars) }))
          } as TicketTableElement)
        : {
            position: v.position,
            typeContent: 'TEXT',
            content: v.content,
            bold: v.bold,
            maxChars: Number(v.maxChars),
            dataType: v.dataType
          };
  }

  addElement(section: TicketSection, type: TicketContentType): void {
    const list = this.ticket[section];
    list.push(
      type === 'TEXT'
        ? { position: 'LEFT', typeContent: 'TEXT', content: 'Nuevo texto', bold: false, maxChars: this.settings.maxChars, dataType: 'TEXT' }
        : { position: 'LEFT', typeContent: 'TABLE', bold: false, field: 'detail', columns: [] }
    );
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

  addColumn(): void {
    this.columns.push(this.buildColumn());
  }

  removeColumn(i: number): void {
    this.columns.removeAt(i);
  }

  save(): void {
    this.submitted = true;
    this.jsonOutput = JSON.stringify(this.ticket, null, 2);
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

  renderText(el: TicketElement): string {
    if (el.typeContent !== 'TEXT') return '';
    const text = el.content.replace(/\{([\w.]+)\}/g, (match, key) => {
      const value = resolveSampleValue(key);
      return value === undefined ? match : this.formatValue(value, el.dataType);
    });
    const limit = Math.min(el.maxChars, this.settings.maxChars);
    return this.pad(text.slice(0, limit), this.settings.maxChars, el.position);
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
