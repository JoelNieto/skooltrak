import {
  Component,
  forwardRef,
  input,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { Editor } from '@tiptap/core';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { EditorMenu } from './editor-menu';

@Component({
  selector: 'lib-text-editor',
  imports: [TiptapEditorDirective, EditorMenu, FormsModule],
  template: `<div
    class="flex flex-col"
    [class]="bordered() ? 'textarea textarea-primary' : ''"
  >
    <div class="flex gap-2">
      <lib-editor-menu [editor]="editor" />
    </div>
    <tiptap-editor
      class="min-h-[10rem]"
      [editor]="editor"
      [ngModel]="value"
      (ngModelChange)="changeValue($event)"
    />
  </div>`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextEditor),
      multi: true,
    },
  ],
  styles: `
    lib-text-editor {
      width: 100%;
    }
    @reference "tailwindcss";

      .ProseMirror p.is-editor-empty:first-child::before {
        @apply text-neutral-400 float-left pointer-events-none h-0;
        content: attr(data-placeholder);
      }
      .tiptap ul,
      .tiptap ol {
        list-style: unset;
        padding: 0 1rem;
        margin:1.25rem 1rem 1.25rem .4rem;
      }
      .tiptap ol {
        list-style-type: decimal !important;
      }
      .tiptap {
        font-family: 'Momo Trust Sans', sans-serif;
        font-size: .85rem;
      }
      .tiptap > p > code {
        @apply bg-neutral-500 text-neutral-50;
      }

      .tiptap h1 {
        @apply text-2xl font-bold;
      }
      .tiptap h2 {
        @apply text-xl font-bold;
      }
      .tiptap h3 {
        @apply text-lg font-bold;
      }
      .tiptap h4 {
        @apply text-base font-bold;
      }
      .tiptap h5 {
        @apply text-sm font-bold;
      }
      .tiptap h6 {
        @apply text-xs font-bold;
      }
      .tiptap blockquote {
        @apply border-l-2 border-neutral-500 pl-2;
      }
    `,
  encapsulation: ViewEncapsulation.None,
})
export class TextEditor implements ControlValueAccessor, OnDestroy {
  bordered = input<boolean>();
  value = '';
  onChange: any = () => {
    /* empty */
  };
  onTouched: any = () => {
    /* empty */
  };
  disabled = false;
  writeValue(value: string): void {
    this.value = value;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  public editor = new Editor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Escribe algo...',
      }),
      Highlight,
    ],
    editorProps: {
      attributes: {
        class: 'p-2 focus:border-none outline-none',
        spellcheck: 'false',
      },
    },
  });

  changeValue(value: string) {
    if (!this.disabled) {
      this.value = value;
      this.onChange(value);

      this.onTouched();
    }
  }

  ngOnDestroy() {
    this.editor.destroy();
  }
}
