import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import {
  ButtonCloseDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  FormControlDirective,
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
import {
  ApplicationRecord,
  DataTypeRecord,
  ParameterRecord,
  dataTypeName
} from '../../../models/parameters';
import { Page } from '../../../models/ticket.models';
import { ApplicationsService, DataTypesService, ParametersService } from '../../../services/parameters.service';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { DataTableAction, DataTableColumn, DataTableSort } from '../../shared/data-table/data-table.models';
import { JsonEditorComponent } from '../../shared/json-editor/json-editor.component';

interface ListState<T> {
  page: number;
  size: number;
  sort: string;
}

@Component({
  selector: 'app-parameters',
  templateUrl: './parameters.component.html',
  imports: [
    ReactiveFormsModule,
    ButtonCloseDirective,
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    ColComponent,
    FormControlDirective,
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
    JsonEditorComponent
  ]
})
export class ParametersComponent implements OnInit {
  private readonly applicationsService = inject(ApplicationsService);
  private readonly parametersService = inject(ParametersService);
  private readonly dataTypesService = inject(DataTypesService);
  private readonly fb = inject(FormBuilder);

  readonly pageSizes = [5, 10, 25, 50];

  // ---- Applications ----
  readonly apps = signal<Page<ApplicationRecord> | null>(null);
  readonly appsLoading = signal(false);
  readonly appsError = signal('');
  readonly appsState = signal<ListState<ApplicationRecord>>({ page: 0, size: 10, sort: '' });
  readonly appsSort = computed(() => this.toSort(this.appsState().sort));

  readonly appColumns: DataTableColumn<ApplicationRecord>[] = [
    { field: 'key', header: 'Clave', sortable: true, cellClass: 'fw-semibold' },
    { field: 'description', header: 'Descripción', sortable: true },
    {
      field: 'active',
      header: 'Estado',
      type: 'badge',
      badge: a => ({ label: a.active ? 'Activa' : 'Inactiva', color: a.active ? 'success' : 'secondary' })
    },
    { field: 'createdAt', header: 'Creada', type: 'date', sortable: true }
  ];
  readonly appActions: DataTableAction<ApplicationRecord>[] = [
    { label: 'Ver parámetros', handler: a => this.openApp(a) }
  ];
  readonly appKey = (a: ApplicationRecord) => a.id;

  // ---- Parameters of the selected application ----
  readonly selectedApp = signal<ApplicationRecord | null>(null);
  readonly params = signal<Page<ParameterRecord> | null>(null);
  readonly paramsLoading = signal(false);
  readonly paramsError = signal('');
  readonly paramsState = signal<ListState<ParameterRecord>>({ page: 0, size: 10, sort: '' });
  readonly paramsSort = computed(() => this.toSort(this.paramsState().sort));

  readonly paramColumns: DataTableColumn<ParameterRecord>[] = [
    { field: 'key', header: 'Clave', sortable: true, cellClass: 'fw-semibold' },
    {
      field: 'dataType',
      header: 'Tipo',
      type: 'badge',
      badge: p => ({ label: p.dataType, color: 'info' })
    },
    { field: 'value', header: 'Valor', cellClass: 'text-break param-value' , value: p => {
        if (p.dataType === 'JSON') {
          return 'JSON';
        }
        return p.value;
    } },
    { field: 'description', header: 'Descripción' },
    { field: 'createdAt', header: 'Creado', type: 'date', sortable: true }
  ];
  readonly paramActions: DataTableAction<ParameterRecord>[] = [
    { label: 'Editar', handler: p => this.openForm(p) },
    { label: 'Eliminar', color: 'danger', handler: p => this.deleteTarget.set(p) }
  ];
  readonly paramKey = (p: ParameterRecord) => p.id;

  // ---- Parameter form modal ----
  readonly dataTypes = signal<DataTypeRecord[]>([]);
  readonly formVisible = signal(false);
  readonly editing = signal<ParameterRecord | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal('');
  @ViewChild(JsonEditorComponent) jsonEditor?: JsonEditorComponent;

  readonly form = this.fb.nonNullable.group({
    dataTypeId: ['', Validators.required],
    key: ['', [Validators.required, Validators.maxLength(150)]],
    value: ['', (c: AbstractControl) => this.validateValue(c)],
    description: ['', Validators.maxLength(255)]
  });

  // ---- Delete ----
  readonly deleteTarget = signal<ParameterRecord | null>(null);
  readonly deleting = signal(false);

  ngOnInit(): void {
    this.loadApps();
    this.form.controls.dataTypeId.valueChanges.subscribe(() => this.onTypeChanged());
  }

  private toSort(sort: string): DataTableSort | null {
    if (!sort) return null;
    const [field, direction] = sort.split(',');
    return { field, direction: direction as 'asc' | 'desc' };
  }

  // ---- Applications ----

  loadApps(): void {
    const { page, size, sort } = this.appsState();
    this.appsLoading.set(true);
    this.appsError.set('');
    this.applicationsService.list({ page, size, sort }).subscribe({
      next: p => {
        this.apps.set(p);
        this.appsLoading.set(false);
      },
      error: () => {
        this.appsError.set('No se pudo cargar la lista de aplicaciones.');
        this.appsLoading.set(false);
      }
    });
  }

  appsPage(page: number): void {
    this.appsState.update(s => ({ ...s, page }));
    this.loadApps();
  }

  appsSize(size: number): void {
    this.appsState.update(s => ({ ...s, size, page: 0 }));
    this.loadApps();
  }

  appsSortChange(s: DataTableSort): void {
    this.appsState.update(st => ({ ...st, sort: `${s.field},${s.direction}`, page: 0 }));
    this.loadApps();
  }

  openApp(app: ApplicationRecord): void {
    this.selectedApp.set(app);
    this.params.set(null);
    this.paramsState.set({ page: 0, size: 10, sort: '' });
    this.loadParams();
    if (this.dataTypes().length === 0) this.loadDataTypes();
  }

  backToApps(): void {
    this.selectedApp.set(null);
    this.params.set(null);
  }

  // ---- Parameters ----

  loadParams(): void {
    const app = this.selectedApp();
    if (!app) return;
    const { page, size, sort } = this.paramsState();
    this.paramsLoading.set(true);
    this.paramsError.set('');
    this.parametersService.list(app.id, { page, size, sort }).subscribe({
      next: p => {
        this.params.set(p);
        this.paramsLoading.set(false);
      },
      error: () => {
        this.paramsError.set('No se pudieron cargar los parámetros.');
        this.paramsLoading.set(false);
      }
    });
  }

  paramsPage(page: number): void {
    this.paramsState.update(s => ({ ...s, page }));
    this.loadParams();
  }

  paramsSize(size: number): void {
    this.paramsState.update(s => ({ ...s, size, page: 0 }));
    this.loadParams();
  }

  paramsSortChange(s: DataTableSort): void {
    this.paramsState.update(st => ({ ...st, sort: `${s.field},${s.direction}`, page: 0 }));
    this.loadParams();
  }

  private loadDataTypes(): void {
    this.dataTypesService.list().subscribe({
      next: types => this.dataTypes.set(types),
      error: () => this.saveError.set('No se pudieron cargar los tipos de dato.')
    });
  }

  // ---- Form ----

  typeLabel(t: DataTypeRecord): string {
    return dataTypeName(t);
  }

  get currentType(): string {
    try {
      const id = this.form.controls.dataTypeId.value;
      const t = this.dataTypes().find(d => d.id === id);
      return t ? dataTypeName(t) : '';
    } catch (e){
        console.error(e);
      return '';
    }
  }

  openForm(param: ParameterRecord | null): void {
    if (this.dataTypes().length === 0) this.loadDataTypes();
    this.editing.set(param);
    this.saveError.set('');
    this.form.reset(
      {
        dataTypeId: param?.dataTypeId ?? '',
        key: param?.key ?? '',
        value: param?.value ?? '',
        description: param?.description ?? ''
      },
      { emitEvent: false }
    );
    if (param?.dataType === 'JSON') this.prettyValue();
    this.form.controls.value.updateValueAndValidity();
    this.formVisible.set(true);
  }

  closeForm(): void {
    if (!this.saving()) this.formVisible.set(false);
  }

  private onTypeChanged(): void {
    const control = this.form.controls.value;
    if (this.currentType === 'BOOLEAN' && control.value !== 'true' && control.value !== 'false') {
      control.setValue('false');
    }
    control.updateValueAndValidity();
  }

  private validateValue(c: AbstractControl): ValidationErrors | null {
    const v = String(c.value ?? '');
    switch (this.currentType) {
      case 'INTEGER':
        return /^[+-]?\d+$/.test(v.trim()) ? null : { integer: true };
      case 'FLOAT':
        return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(v.trim()) ? null : { float: true };
      case 'BOOLEAN':
        return v === 'true' || v === 'false' ? null : { boolean: true };
      case 'JSON':
        if (!v.trim()) return { required: true };
        try {
          JSON.parse(v);
          return null;
        } catch {
          return { json: true };
        }
      default:
        return null;
    }
  }

  errorMessage(): string {
    const e = this.form.controls.value.errors;
    if (!e) return '';
    if (e['integer']) return 'Debe ser un número entero.';
    if (e['float']) return 'Debe ser un número válido (ej. 12.5).';
    if (e['json']) return 'El JSON no es válido.';
    if (e['boolean']) return 'Selecciona true o false.';
    return 'Este campo es obligatorio.';
  }

  prettyValue(): void {
    const control = this.form.controls.value;
    try {
      control.setValue(JSON.stringify(JSON.parse(control.value), null, 2));
    } catch {
      control.markAsTouched();
    }
  }

  save(): void {
    const app = this.selectedApp();
    this.form.markAllAsTouched();
    if (!app || this.form.invalid) return;
    const v = this.form.getRawValue();
    // JSON travels minified
    const value = this.currentType === 'JSON' ? JSON.stringify(JSON.parse(v.value)) : v.value.trim();
    const payload = {
      applicationId: app.id,
      dataTypeId: v.dataTypeId,
      key: v.key.trim(),
      value,
      description: v.description.trim()
    };
    const editing = this.editing();
    this.saving.set(true);
    this.saveError.set('');
    const request$ = editing
      ? this.parametersService.update(editing.id, payload)
      : this.parametersService.create(payload);
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.formVisible.set(false);
        this.loadParams();
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('No se pudo guardar el parámetro. Intenta de nuevo.');
      }
    });
  }

  // ---- Delete ----

  confirmDelete(): void {
    const target = this.deleteTarget();
    const app = this.selectedApp();
    if (!target || !app) return;
    this.deleting.set(true);
    this.parametersService.delete(app.id, target.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        const p = this.params();
        if (p && p.content.length === 1 && p.number > 0) this.paramsState.update(s => ({ ...s, page: p.number - 1 }));
        this.loadParams();
      },
      error: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.paramsError.set('No se pudo eliminar el parámetro.');
      }
    });
  }
}
