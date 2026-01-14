import { Component, input } from '@angular/core';

@Component({
  selector: 'lib-editor-menu',
  imports: [],
  template: `<div class="flex gap-2 flex-wrap">
    <div class="tooltip" data-tip="Negrita">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('bold')"
        (click)="editor().chain().focus().toggleBold().run()"
      >
        <span class="material-symbols-outlined">format_bold</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Cursiva">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('italic')"
        (click)="editor().chain().focus().toggleItalic().run()"
      >
        <span class="material-symbols-outlined">format_italic</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Tachado">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('strike')"
        (click)="editor().chain().focus().toggleStrike().run()"
      >
        <span class="material-symbols-outlined">format_strikethrough</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Subrayado">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('underline')"
        (click)="editor().chain().focus().toggleUnderline().run()"
      >
        <span class="material-symbols-outlined">format_underlined</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Destacado">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm "
        [class.btn-soft]="editor().isActive('highlight')"
        (click)="editor().chain().focus().toggleHighlight().run()"
      >
        <span class="material-symbols-outlined">highlight</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Código">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('code')"
        (click)="editor().chain().focus().toggleCode().run()"
      >
        <span class="material-symbols-outlined">code</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Lista desordenada">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('bulletList')"
        (click)="editor().chain().focus().toggleBulletList().run()"
      >
        <span class="material-symbols-outlined">format_list_bulleted</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Lista ordenada">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('orderedList')"
        (click)="editor().chain().focus().toggleOrderedList().run()"
      >
        <span class="material-symbols-outlined">format_list_numbered</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 1">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('heading', { level: 1 })"
        (click)="editor().chain().focus().toggleHeading({ level: 1 }).run()"
      >
        <span class="material-symbols-outlined">format_h1</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 2">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('heading', { level: 2 })"
        (click)="editor().chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <span class="material-symbols-outlined">format_h2</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 3">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('heading', { level: 3 })"
        (click)="editor().chain().focus().toggleHeading({ level: 3 }).run()"
      >
        <span class="material-symbols-outlined">format_h3</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 4">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('heading', { level: 4 })"
        (click)="editor().chain().focus().toggleHeading({ level: 4 }).run()"
      >
        <span class="material-symbols-outlined">format_h4</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 5">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('heading', { level: 5 })"
        (click)="editor().chain().focus().toggleHeading({ level: 5 }).run()"
      >
        <span class="material-symbols-outlined">format_h5</span>
      </button>
    </div>
    <div class="tooltip" data-tip="Cita">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('blockquote')"
        (click)="editor().chain().focus().toggleBlockquote().run()"
      >
        <span class="material-symbols-outlined">format_quote</span>
      </button>
    </div>
  </div>`,
})
export class EditorMenu {
  public editor = input.required<any>();
}
