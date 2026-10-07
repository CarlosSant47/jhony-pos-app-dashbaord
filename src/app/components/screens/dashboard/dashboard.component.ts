
import { Component, OnInit } from '@angular/core';
import { CardComponent, CardBodyComponent, RowComponent, CardHeaderComponent, ColComponent } from '@coreui/angular';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    imports: [CardComponent, CardBodyComponent, RowComponent, CardHeaderComponent, ColComponent]
})
export class DashboardComponent implements OnInit {

    ngOnInit(): void {
    }
}