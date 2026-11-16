import { TestBed } from '@angular/core/testing';
import { parseTicketPreview, TicketPreviewComponent } from './ticket-preview.component';

describe('parseTicketPreview', () => {
  it('interprets alignment, bold text, spaces and empty lines from printer output', () => {
    const lines = parseTicketPreview(
      '    [C]<b>TICKET DE VENTA</b>\r\n[L]\r\n[L]CODIGO  CANT  PRECIO   IMPORTE  \r\n[R]TOTAL: $203.00'
    );

    expect(lines).toEqual([
      { alignment: 'center', segments: [{ text: 'TICKET DE VENTA', bold: true }] },
      { alignment: 'left', segments: [] },
      { alignment: 'left', segments: [{ text: 'CODIGO  CANT  PRECIO   IMPORTE  ', bold: false }] },
      { alignment: 'right', segments: [{ text: 'TOTAL: $203.00', bold: false }] }
    ]);
  });

  it('preserves unrecognized and incomplete markup as text', () => {
    expect(parseTicketPreview('[L]A <b>negrita</b> <img src=x> <b>incompleta')).toEqual([
      {
        alignment: 'left',
        segments: [
          { text: 'A ', bold: false },
          { text: 'negrita', bold: true },
          { text: ' <img src=x> <b>incompleta', bold: false }
        ]
      }
    ]);
    expect(parseTicketPreview('')).toEqual([]);
  });
});

describe('TicketPreviewComponent', () => {
  it('updates the preview as text is edited without rendering arbitrary HTML', async () => {
    await TestBed.configureTestingModule({ imports: [TicketPreviewComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TicketPreviewComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const textarea = host.querySelector('textarea')!;
    textarea.value = '[C]<b>VENTA</b>\n[R]TOTAL: $203.00\n[L]<img src=x>';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const lines = host.querySelectorAll<HTMLElement>('.ticket-line');
    expect(lines.length).toBe(3);
    expect(lines[0].style.textAlign).toBe('center');
    expect(lines[0].querySelector('.bold')?.textContent).toBe('VENTA');
    expect(lines[1].style.textAlign).toBe('right');
    expect(lines[1].textContent).toBe('TOTAL: $203.00');
    expect(lines[2].textContent).toBe('<img src=x>');
    expect(lines[2].querySelector('img')).toBeNull();
  });
});
