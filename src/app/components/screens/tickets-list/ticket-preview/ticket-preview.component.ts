import { Component, computed, signal } from '@angular/core';

interface PreviewSegment {
  text: string;
  bold: boolean;
}

interface PreviewLine {
  alignment: 'left' | 'center' | 'right';
  segments: PreviewSegment[];
}

export function parseTicketPreview(text: string): PreviewLine[] {
  if (!text) return [];

  const alignments = { L: 'left', C: 'center', R: 'right' } as const;
  return text.split(/\r\n|\n|\r/).map(line => {
    const marker = /^[ \t]*\[([LCR])\]/.exec(line);
    const alignment = marker ? alignments[marker[1] as keyof typeof alignments] : 'left';
    const content = marker ? line.slice(marker[0].length) : line;
    const segments: PreviewSegment[] = [];
    const boldTag = /<b>(.*?)<\/b>/g;
    let offset = 0;
    for (const match of content.matchAll(boldTag)) {
      if (match.index > offset) segments.push({ text: content.slice(offset, match.index), bold: false });
      segments.push({ text: match[1], bold: true });
      offset = match.index + match[0].length;
    }
    if (offset < content.length) segments.push({ text: content.slice(offset), bold: false });
    return { alignment, segments };
  });
}

@Component({
  selector: 'app-ticket-preview',
  templateUrl: './ticket-preview.component.html',
  styleUrl: './ticket-preview.component.scss'
})
export class TicketPreviewComponent {
  readonly source = signal('');
  readonly lines = computed(() => parseTicketPreview(this.source()));
}
