import { Component, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { TicketSellPointService } from '../../../../services/ticket-sell-point.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
    ButtonCloseDirective,
    ButtonDirective,
    ColComponent,
    FormControlDirective,
    FormDirective,
    FormLabelDirective,
    FormSelectDirective,
    ModalBodyComponent,
    ModalComponent,
    ModalFooterComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    RowComponent,
    SpinnerComponent
} from '@coreui/angular';
import { Page, PageRequest, SellPoint, TicketElement, TicketLayout, TicketTemplateSellPoint } from '../../../../models/ticket.models';
import { DataTableAction, DataTableColumn, DataTableSort } from '../../../shared/data-table/data-table.models';
import { TicketsEditorComponent } from '../../tickets-editor/tickets-editor.component';
import { CloseAction } from '../../../../utils/types';
import { DataTableComponent } from '../../../shared/data-table/data-table.component';
import { SellPointsService } from '../../../../services/sell-points.service';

@Component({
    selector: 'app-ticket-template-sell-point',
    templateUrl: './ticket-template-sell-point.component.html',
    imports: [
        ReactiveFormsModule,
        ButtonCloseDirective,
        ButtonDirective,
        ColComponent,
        FormControlDirective,
        FormDirective,
        FormLabelDirective,
        FormSelectDirective,
        ModalBodyComponent,
        ModalComponent,
        ModalFooterComponent,
        ModalHeaderComponent,
        ModalTitleDirective,
        RowComponent,
        SpinnerComponent,
        DataTableComponent,
        TicketsEditorComponent
    ],
})
export class TicketTemplateSellPointComponent implements OnInit, OnDestroy {

    private readonly service = inject(TicketSellPointService);
    private readonly sellPointsService = inject(SellPointsService);
    private readonly fb = inject(FormBuilder);

    @ViewChild(TicketsEditorComponent) editor?: TicketsEditorComponent;

    readonly pageSizes = [10, 25];
    readonly columns: DataTableColumn<TicketTemplateSellPoint>[] = [
        { field: 'sellPointName', header: 'Agencia', sortable: true },
    ];
    readonly actions: DataTableAction<TicketTemplateSellPoint>[] = [
        { label: 'Editar', handler: t => this.openEdit(t) }
    ];
    readonly rowKey = (t: TicketTemplateSellPoint) => t.id;

    readonly sellPoints = signal<SellPoint[]>([]);
    readonly sellPointsLoading = signal(false);
    readonly sellPointsError = signal('');

    // List state
    readonly page = signal<Page<TicketTemplateSellPoint> | null>(null);
    readonly loading = signal(false);
    readonly error = signal('');
    readonly request = signal<PageRequest>({ page: 0, size: 10, sort: 'createdAt,asc', search: '' });

    readonly sort = computed(() => {
        const [field, direction] = this.request().sort.split(',');
        return { field, direction: direction as 'asc' | 'desc' };
    });

    // Editor modal state
    readonly editorVisible = signal(false);
    readonly confirmCloseVisible = signal(false);
    readonly saving = signal(false);
    readonly saveError = signal('');
    readonly editingId = signal<string | null>(null);
    readonly editorTemplate = signal<Partial<TicketLayout> | null>(null);
    readonly submitted = signal(false);
    private initialMetaSnapshot = '';

    readonly metaForm = this.fb.nonNullable.group({
        sellPointId: [null as number | null, [Validators.required, Validators.min(0)]]
    });

    ngOnInit(): void {
        this.load();
        this.loadSellPoints();
    }

    loadSellPoints(): void {
        this.sellPointsLoading.set(true);
        this.sellPointsError.set('');
        this.sellPointsService.list().subscribe({
            next: points => {
                this.sellPoints.set(points);
                this.sellPointsLoading.set(false);
            },
            error: () => {
                this.sellPointsError.set('No se pudieron cargar los puntos de venta.');
                this.sellPointsLoading.set(false);
            }
        });
    }

    selectedSellPoint(): SellPoint | null {
        const selectedId = this.metaForm.controls.sellPointId.value;
        return this.sellPoints().find(point => point.sellPointId === selectedId) ?? null;
    }

    ngOnDestroy(): void {
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
                this.error.set('No se pudo cargar la lista de plantillas.');
                this.loading.set(false);
            }
        });
    }

    private updateRequest(changes: Partial<PageRequest>): void {
        this.request.update(r => ({ ...r, ...changes }));
        this.load();
    }

    onSearch(value: string): void {
        this.updateRequest({ search: value, page: 0 });
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
        this.startEditing(null, null, { sellPointId: null });
    }

    openEdit(record: TicketTemplateSellPoint): void {
        this.startEditing(record.id, {
            header: this.parseElements(record.header),
            footer: this.parseElements(record.footer)
        }, { sellPointId: record.sellPointId });
    }

    private parseElements(json: string): TicketElement[] {
        try {
            const value = JSON.parse(json);
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    private startEditing(id: string | null, template: Partial<TicketLayout> | null, meta: { sellPointId: number | null }): void {
        this.editingId.set(id);
        this.editorTemplate.set(template);
        this.metaForm.reset(meta);
        // The sell point of an existing template cannot change
        if (id === null) this.metaForm.controls.sellPointId.enable();
        else this.metaForm.controls.sellPointId.disable();
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
        const { header, footer } = this.editor.getSellPointLayout();
        const payload = {
            sellPointId: Number(this.metaForm.getRawValue().sellPointId),
            header: JSON.stringify(header),
            footer: JSON.stringify(footer)
        };
        const id = this.editingId();
        this.saving.set(true);
        this.saveError.set('');
        const request$ = id === null ? this.service.create(payload) : this.service.update({ id, ...payload });
        request$.subscribe({
            next: () => {
                this.saving.set(false);
                this.closeEditor();
                this.load();
            },
            error: () => {
                this.saving.set(false);
                this.saveError.set('No se pudo guardar la plantilla. Intenta de nuevo.');
            }
        });
    }
}