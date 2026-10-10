import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonDirective, CardBodyComponent, CardComponent, CardHeaderComponent, SpinnerComponent } from '@coreui/angular';
import * as L from 'leaflet';
import { DayOpening, RouteTrackingPoint } from '../../../models/route-tracking';
import { RouteTrackingService } from '../../../services/route-tracking.service';

interface MarkerStyle {
    color: string;
    symbol: string;
}

/** Only these transaction types get a marker; other points just form the path. */
const TRANSACTION_STYLES: Record<string, MarkerStyle> = {
    SELL: { color: '#2eb85c', symbol: '$' },
    REFUND: { color: '#f9b115', symbol: '↩' },
    PAYMENT: { color: '#3399ff', symbol: '✓' }
};

const styleFor = (type: string | null): MarkerStyle | undefined =>
    type ? TRANSACTION_STYLES[type.toUpperCase()] : undefined;

const todayIso = (): string => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

@Component({
    selector: 'app-route-tracking',
    templateUrl: './route-tracking.component.html',
    styleUrl: './route-tracking.component.scss',
    imports: [FormsModule, DatePipe, ButtonDirective, CardBodyComponent, CardComponent, CardHeaderComponent, SpinnerComponent]
})
export class RouteTrackingComponent implements OnInit, OnDestroy {
    private readonly service = inject(RouteTrackingService);

    @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

    readonly date = signal(todayIso());
    readonly openings = signal<DayOpening[]>([]);
    readonly selected = signal<DayOpening | null>(null);
    readonly points = signal<RouteTrackingPoint[]>([]);
    readonly loadingList = signal(false);
    readonly loadingPoints = signal(false);
    readonly error = signal<string | null>(null);

    private map?: L.Map;
    private layer?: L.LayerGroup;

    ngOnInit(): void {
        this.map = L.map(this.mapContainer.nativeElement).setView([23.2, -106.4], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
        this.layer = L.layerGroup().addTo(this.map);
        this.loadOpenings();
    }

    ngOnDestroy(): void {
        this.map?.remove();
    }

    onDateChange(value: string): void {
        if (!value) return;
        this.date.set(value);
        this.loadOpenings();
    }

    loadOpenings(): void {
        this.loadingList.set(true);
        this.error.set(null);
        this.selected.set(null);
        this.points.set([]);
        this.draw();
        this.service.listByDate(this.date()).subscribe({
            next: list => {
                this.openings.set(list);
                this.loadingList.set(false);
            },
            error: () => {
                this.openings.set([]);
                this.error.set('No se pudieron cargar las rutas aperturadas.');
                this.loadingList.set(false);
            }
        });
    }

    select(opening: DayOpening): void {
        this.selected.set(opening);
        this.loadPoints(true);
    }

    refresh(): void {
        this.loadPoints(false);
    }

    private loadPoints(fit: boolean): void {
        const opening = this.selected();
        if (!opening) return;
        this.loadingPoints.set(true);
        this.error.set(null);
        this.service.getTrackings(opening.id).subscribe({
            next: points => {
                if (this.selected()?.id !== opening.id) return;
                this.points.set([...points].sort((a, b) => a.locationTimestamp.localeCompare(b.locationTimestamp)));
                this.loadingPoints.set(false);
                this.draw(fit);
            },
            error: () => {
                this.error.set('No se pudo cargar el recorrido de la ruta.');
                this.loadingPoints.set(false);
            }
        });
    }

    private draw(fit = false): void {
        if (!this.map || !this.layer) return;
        this.layer.clearLayers();
        const points = this.points();
        if (!points.length) return;

        const latLngs = points.map(p => L.latLng(p.latitude, p.longitude));
        L.polyline(latLngs, { color: '#ae0204', weight: 4, opacity: 0.7 }).addTo(this.layer);
        const finished = this.selected()?.finished ?? false;

        points.forEach((p, i) => {
            const isStart = i === 0;
            const isLast = i === points.length - 1;
            const isEnd = isLast && finished;
            const isCurrent = isLast && !finished;
            const isEdge = isStart || isEnd || isCurrent;
            const txStyle = styleFor(p.transactionType);
            if (!isEdge && !txStyle) return;
            const style = isStart
                ? { color: '#198754', symbol: 'I' }
                : isEnd
                    ? { color: '#e55353', symbol: 'F' }
                    : isCurrent
                        ? { color: '#f9b115', symbol: '➤' }
                        : txStyle!;
            const color = style.color;
            const size = 20;
            const rotation = isCurrent ? `transform:rotate(${p.bearing - 90}deg);` : '';
            const icon = L.divIcon({
                className: '',
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
                html: `<div class="rt-marker" style="background:${color};width:${size}px;height:${size}px;${rotation}">${style.symbol}</div>`
            });
            const el = document.createElement('div');
            const lines: [string, string][] = [
                ['Hora', new Date(p.locationTimestamp).toLocaleString()],
                ...(isCurrent ? [['Estado', 'En proceso'] as [string, string]] : []),

                ... (p.transactionType ? [['Tipo', p.transactionType] as [string, string]] : []),
                ... (p.transactionId ? [['Transacción', p.transactionId] as [string, string]] : []),
                ['Precisión', `${p.accuracy} m`],
                ['Velocidad', `${this.speedMetersPerSecondToKmH(p.speed)} km/h`],
            ];
            lines.forEach(([k, v]) => {
                const row = document.createElement('div');
                const b = document.createElement('strong');
                b.textContent = `${k}: `;
                row.append(b, document.createTextNode(v));
                el.appendChild(row);
            });
            L.marker(latLngs[i], { icon, zIndexOffset: isEdge ? 1000 : 500 }).bindPopup(el).addTo(this.layer!);
        });

        if (fit) this.map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40], maxZoom: 17 });
    }

    private speedMetersPerSecondToKmH(speed: number): number {
        return speed * 3.6;
    }


}
