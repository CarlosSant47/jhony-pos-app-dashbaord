import { TemplateRef } from '@angular/core';

export type DataTableColumnType = 'text' | 'date' | 'money' | 'number' | 'badge' | 'template';

export interface DataTableBadge {
  label: string;
  /** CoreUI color: 'success', 'secondary', 'danger', ... */
  color: string;
}

export interface DataTableCellContext<T> {
  $implicit: T;
  value: unknown;
}

export interface DataTableColumn<T> {
  /** Property name of the row; also the sort field sent to `sortChange`. */
  field: string;
  header: string;
  /** Defaults to 'text'. */
  type?: DataTableColumnType;
  sortable?: boolean;
  /** Extra classes for the cell, e.g. 'fw-semibold text-end'. */
  cellClass?: string;
  /** Custom value extraction (otherwise `row[field]`). */
  value?: (row: T) => unknown;
  /** Text shown when the value is empty. Defaults to '—'. */
  emptyText?: string;
  /** Date format for type 'date'. Defaults to 'dd/MM/yyyy HH:mm'. */
  dateFormat?: string;
  /** Currency for type 'money'. Defaults to 'MXN'. */
  currency?: string;
  /** Required for type 'badge'. */
  badge?: (row: T) => DataTableBadge;
  /** Required for type 'template'. Context: { $implicit: row, value }. */
  template?: TemplateRef<DataTableCellContext<T>>;
}

export interface DataTableAction<T> {
  label: string;
  /** CoreUI color. Defaults to 'primary'. */
  color?: string;
  handler: (row: T) => void;
  hidden?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}

/** Generic page shape (Spring Data Page<T>). */
export interface DataTablePage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  /** Zero-based current page */
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface DataTableSort {
  field: string;
  direction: 'asc' | 'desc';
}
