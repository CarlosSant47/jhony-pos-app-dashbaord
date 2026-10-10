import { Component, ElementRef, OnDestroy, afterNextRender, forwardRef, inject, input, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';

/** JSON code editor (CodeMirror) usable with formControlName / ngModel. Underlines syntax errors. */
@Component({
  selector: 'app-json-editor',
  template: `<div #host class="json-editor" [class.is-invalid]="invalid()"></div>`,
  styleUrl: './json-editor.component.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => JsonEditorComponent), multi: true }]
})
export class JsonEditorComponent implements ControlValueAccessor, OnDestroy {
  readonly invalid = input(false);
  readonly minHeight = input('180px');

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private view?: EditorView;
  private value = '';
  private disabled = false;
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    afterNextRender(() => {
      const el = this.host().nativeElement;
      el.style.setProperty('--editor-min-height', this.minHeight());
      this.view = new EditorView({
        parent: el,
        state: EditorState.create({
          doc: this.value,
          extensions: [
            basicSetup,
            json(),
            linter(jsonParseLinter()),
            lintGutter(),
            EditorState.readOnly.of(this.disabled),
            EditorView.updateListener.of(u => {
              if (u.docChanged) {
                this.value = u.state.doc.toString();
                this.onChange(this.value);
              }
              if (u.focusChanged && !u.view.hasFocus) this.onTouched();
            })
          ]
        })
      });
    });
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
    if (this.view && this.view.state.doc.toString() !== this.value) {
      this.view.dispatch({ changes: { from: 0, to: this.view.state.doc.length, insert: this.value } });
    }
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  ngOnDestroy(): void {
    this.view?.destroy();
  }
}
