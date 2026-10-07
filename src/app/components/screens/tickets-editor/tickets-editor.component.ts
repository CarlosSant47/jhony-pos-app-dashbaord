import { Component, OnInit } from '@angular/core';
import { CardBodyComponent, CardHeaderComponent, CardComponent, ColComponent, RowComponent } from '@coreui/angular';

@Component({
    selector: 'app-tickets-editor',
    templateUrl: './tickets-editor.component.html',
    imports: [CardBodyComponent, CardHeaderComponent, CardComponent, ColComponent, RowComponent]
})
export class TicketsEditorComponent implements OnInit {
    
    ngOnInit(): void {
    }
}