import { CurrencyPipe, DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import {
  AlertComponent,
  BadgeComponent,
  ButtonDirective,
  FormLabelDirective,
  FormSelectDirective,
  PageItemDirective,
  PageLinkDirective,
  PaginationComponent,
  SpinnerComponent,
  TableDirective
} from '@coreui/angular';
import { DataTableAction, DataTableColumn, DataTablePage, DataTableSort } from './data-table.models';

/**
 * Generic, presentational paged table. It never calls an API: the parent listens to
 * (pageChange), (pageSizeChange), (sortChange) and (retry), loads the data and feeds
 * it back through [page], [loading] and [error].
 */
@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    NgTemplateOutlet,
    AlertComponent,
    BadgeComponent,
    ButtonDirective,
    FormLabelDirective,
    FormSelectDirective,
    PageItemDirective,
    PageLinkDirective,
    PaginationComponent,
    SpinnerComponent,
    TableDirective
  ]
})
export class DataTableComponent<T> {
  readonly columns = input.required<DataTableColumn<T>[]>();
  readonly page = input<DataTablePage<T> | null>(null);
  readonly loading = input(false);
  readonly error = input('');
  readonly sort = input<DataTableSort | null>(null);
  readonly actions = input<DataTableAction<T>[]>([]);
  readonly actionsHeader = input('Acciones');
  /** Show the rows-per-page selector (needs a (pageSizeChange) handler to be useful). */
  readonly pageSizes = input<number[]>([5, 10, 25, 50]);
  readonly showPageSize = input(true);
  readonly emptyMessage = input('No hay registros que mostrar.');
  readonly loadingMessage = input('Cargando...');
  readonly rowKey = input<(row: T, index: number) => unknown>((_, i) => i);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();
  readonly sortChange = output<DataTableSort>();
  readonly retry = output<void>();

  readonly colSpan = computed(() => this.columns().length + (this.actions().length ? 1 : 0));

  readonly pageNumbers = computed(() => {
    const p = this.page();
    if (!p) return [];
    const start = Math.max(0, Math.min(p.number - 2, p.totalPages - 5));
    const end = Math.min(p.totalPages, start + 5);
    return Array.from({ length: end - start }, (_, i) => start + i);
  });

  readonly rangeLabel = computed(() => {
    const p = this.page();
    if (!p || p.totalElements === 0) return 'Sin resultados';
    const from = p.number * p.size + 1;
    return `${from}-${from + p.content.length - 1} de ${p.totalElements}`;
  });

  cellValue(col: DataTableColumn<T>, row: T): unknown {
    return col.value ? col.value(row) : (row as Record<string, unknown>)[col.field];
  }

  isEmpty(value: unknown): boolean {
    return value === null || value === undefined || value === '';
  }

  sortIcon(field: string): string {
    const s = this.sort();
    return s?.field === field ? (s.direction === 'asc' ? '▲' : '▼') : '';
  }

  toggleSort(col: DataTableColumn<T>): void {
    if (!col.sortable) return;
    const s = this.sort();
    this.sortChange.emit({ field: col.field, direction: s?.field === col.field && s.direction === 'asc' ? 'desc' : 'asc' });
  }

  goTo(n: number): void {
    const p = this.page();
    if (!p || n < 0 || n >= p.totalPages || n === p.number) return;
    this.pageChange.emit(n);
  }

  changeSize(value: string): void {
    this.pageSizeChange.emit(Number(value));
  }
}
