import { Component, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ButtonCloseDirective,
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
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  RowComponent,
  SpinnerComponent,
} from '@coreui/angular';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Page, PageRequest, TicketRecord, TicketTemplate, createDefaultTemplate } from '../../../models/ticket.models';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { DataTableAction, DataTableColumn, DataTableSort } from '../../shared/data-table/data-table.models';
import { TicketsEditorComponent } from '../tickets-editor/tickets-editor.component';
import { TicketsService } from '../../../services/tickets.service';

type CloseAction = 'save' | 'discard' | 'keep';

@Component({
  selector: 'app-tickets-list',
  templateUrl: './tickets-list.component.html',
  styleUrl: './tickets-list.component.scss',
  imports: [
    ReactiveFormsModule,
    ButtonCloseDirective,
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
    ModalBodyComponent,
    ModalComponent,
    ModalFooterComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    RowComponent,
    SpinnerComponent,
    DataTableComponent,
    TicketsEditorComponent
  ]
})
export class TicketsListComponent implements OnInit, OnDestroy {
  private readonly service = inject(TicketsService);
  private readonly fb = inject(FormBuilder);
  private readonly search$ = new Subject<string>();
  private searchSub?: Subscription;

  @ViewChild(TicketsEditorComponent) editor?: TicketsEditorComponent;

  readonly pageSizes = [10, 25];
  readonly columns: DataTableColumn<TicketRecord>[] = [
    { field: 'name', header: 'Nombre', sortable: true, cellClass: 'fw-semibold' },
    { field: 'description', header: 'Descripción', sortable: true, cellClass: 'text-body-secondary' },
    {
      field: 'active',
      header: 'Estado',
      type: 'badge',
      sortable: true,
      badge: t => ({ label: t.active ? 'Activo' : 'Inactivo', color: t.active ? 'success' : 'secondary' })
    },
    { field: 'updatedAt', header: 'Última modificación', type: 'date', sortable: true }
  ];
  readonly actions: DataTableAction<TicketRecord>[] = [
    { label: 'Editar', handler: t => this.openEdit(t) },
    { label: 'Eliminar', color: 'danger', handler: t => this.confirmDelete(t) }
  ];
  readonly rowKey = (t: TicketRecord) => t.id;

  // List state
  readonly page = signal<Page<TicketRecord> | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly request = signal<PageRequest>({ page: 0, size: 10, sort: 'createdAt,desc', search: '' });

  readonly sort = computed(() => {
    const [field, direction] = this.request().sort.split(',');
    return { field, direction: direction as 'asc' | 'desc' };
  });

  // Editor modal state
  readonly editorVisible = signal(false);
  readonly confirmCloseVisible = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly editingId = signal<number | null>(null);
  readonly editorTemplate = signal<TicketTemplate | null>(null);
  readonly submitted = signal(false);
  private initialMetaSnapshot = '';

  readonly metaForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(255)],
    active: [true]
  });

  // Delete state
  readonly deleteTarget = signal<TicketRecord | null>(null);
  readonly deleting = signal(false);

  ngOnInit(): void {
    this.searchSub = this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(search => this.updateRequest({ search, page: 0 }));
    this.load();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  // ---- List ----

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.list(this.request()).subscribe({
      next: page => {
        this.page.set(page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de tickets.');
        this.loading.set(false);
      }
    });
  }

  private updateRequest(changes: Partial<PageRequest>): void {
    this.request.update(r => ({ ...r, ...changes }));
    this.load();
  }

  onSearch(value: string): void {
    this.search$.next(value);
  }

  goTo(page: number): void {
    this.updateRequest({ page });
  }

  changeSize(size: number): void {
    this.updateRequest({ size, page: 0 });
  }

  changeSort(sort: DataTableSort): void {
    this.updateRequest({ sort: `${sort.field},${sort.direction}`, page: 0 });
  }

  // ---- Create / edit ----

  openNew(): void {
    this.startEditing(null, createDefaultTemplate(), { name: '', description: '', active: true });
  }

  openEdit(record: TicketRecord): void {
    this.startEditing(record.id, record.template, {
      name: record.name,
      description: record.description,
      active: record.active
    });
  }

  private startEditing(id: number | null, template: TicketTemplate, meta: { name: string; description: string; active: boolean }): void {
    this.editingId.set(id);
    this.editorTemplate.set(template);
    this.metaForm.reset(meta);
    this.initialMetaSnapshot = JSON.stringify(this.metaForm.getRawValue());
    this.saveError.set('');
    this.submitted.set(false);
    this.confirmCloseVisible.set(false);
    this.editorVisible.set(true);
  }

  private hasChanges(): boolean {
    const metaChanged = JSON.stringify(this.metaForm.getRawValue()) !== this.initialMetaSnapshot;
    return metaChanged || (this.editor?.isDirty() ?? false);
  }

  /** Called by the X / Cancel buttons; the modal itself is not dismissible. */
  requestClose(): void {
    if (this.saving()) return;
    if (this.hasChanges()) this.confirmCloseVisible.set(true);
    else this.closeEditor();
  }

  resolveClose(action: CloseAction): void {
    if (action === 'keep') {
      this.confirmCloseVisible.set(false);
    } else if (action === 'discard') {
      this.closeEditor();
    } else {
      this.confirmCloseVisible.set(false);
      this.save();
    }
  }

  private closeEditor(): void {
    this.confirmCloseVisible.set(false);
    this.editorVisible.set(false);
    this.editorTemplate.set(null);
    this.editingId.set(null);
  }

  save(): void {
    this.submitted.set(true);
    if (this.metaForm.invalid || !this.editor) {
      this.metaForm.markAllAsTouched();
      return;
    }
    const payload = { ...this.metaForm.getRawValue(), template: this.editor.getTemplate() };
    const id = this.editingId();
    this.saving.set(true);
    this.saveError.set('');
    const request$ = id === null ? this.service.create(payload) : this.service.update(id, payload);
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeEditor();
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('No se pudo guardar el ticket. Intenta de nuevo.');
      }
    });
  }

  // ---- Delete ----

  confirmDelete(record: TicketRecord): void {
    this.deleteTarget.set(record);
  }

  cancelDelete(): void {
    if (!this.deleting()) this.deleteTarget.set(null);
  }

  delete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    this.service.delete(target.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        // Go back a page if the last row of the current page was removed
        const p = this.page();
        if (p && p.content.length === 1 && p.number > 0) this.request.update(r => ({ ...r, page: p.number - 1 }));
        this.load();
      },
      error: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.error.set('No se pudo eliminar el ticket.');
      }
    });
  }
}
