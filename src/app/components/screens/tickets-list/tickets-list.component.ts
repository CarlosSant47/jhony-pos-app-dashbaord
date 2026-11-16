import { Component, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonCloseDirective, ButtonDirective, CardBodyComponent, CardComponent, CardHeaderComponent, ColComponent, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, FormControlDirective, FormDirective, FormLabelDirective, ModalBodyComponent, ModalComponent, ModalFooterComponent, ModalHeaderComponent, ModalTitleDirective, RowComponent, SpinnerComponent, TabsComponent, TabsListComponent, TabsContentComponent, TabPanelComponent, Tabs2Module } from '@coreui/angular';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Page, PageRequest, TicketRecord, TicketTemplate, createDefaultTemplate } from '../../../models/ticket.models';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { DataTableAction, DataTableColumn, DataTableSort } from '../../shared/data-table/data-table.models';
import { TicketsEditorComponent } from '../tickets-editor/tickets-editor.component';
import { TicketsService } from '../../../services/tickets.service';
import { TicketTemplateListComponent } from './ticket-template-list/ticket-template-list-component';
import { TicketTemplateSellPointComponent } from './ticket-template-sell-point/ticket-template-sell-point.component';
import { TicketPreviewComponent } from './ticket-preview/ticket-preview.component';

type CloseAction = 'save' | 'discard' | 'keep';

@Component({
  selector: 'app-tickets-list',
  templateUrl: './tickets-list.component.html',
  styleUrl: './tickets-list.component.scss',
  imports: [
    ReactiveFormsModule,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    ColComponent,
    Tabs2Module,
    RowComponent,
    TabsComponent,
    TabsListComponent,
    TabsContentComponent,
    TabPanelComponent,
    TicketTemplateListComponent,
    TicketTemplateSellPointComponent,
    TicketPreviewComponent
]
})
export class TicketsListComponent implements OnInit, OnDestroy {

  ngOnDestroy(): void {
  }

  ngOnInit(): void {
  }

  public handleChange($event: string | number | undefined) {
    console.log('handleChange', $event);
  }
}
