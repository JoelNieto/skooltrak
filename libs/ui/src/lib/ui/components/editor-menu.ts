import { Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorCodeBold,
  phosphorHighlighterBold,
  phosphorListBulletsBold,
  phosphorListNumbersBold,
  phosphorQuotesBold,
  phosphorTextAUnderlineBold,
  phosphorTextBBold,
  phosphorTextHFiveBold,
  phosphorTextHFourBold,
  phosphorTextHOneBold,
  phosphorTextHSixBold,
  phosphorTextHThreeBold,
  phosphorTextHTwoBold,
  phosphorTextItalicBold,
  phosphorTextStrikethroughBold,
} from '@ng-icons/phosphor-icons/bold';

@Component({
  selector: 'lib-editor-menu',
  imports: [NgIcon],
  viewProviders: [
    provideIcons({
      phosphorTextBBold,
      phosphorTextItalicBold,
      phosphorTextStrikethroughBold,
      phosphorTextAUnderlineBold,
      phosphorCodeBold,
      phosphorListBulletsBold,
      phosphorListNumbersBold,
      phosphorTextHOneBold,
      phosphorTextHTwoBold,
      phosphorTextHThreeBold,
      phosphorTextHFourBold,
      phosphorTextHFiveBold,
      phosphorTextHSixBold,
      phosphorQuotesBold,
      phosphorHighlighterBold,
    }),
  ],
  template: `<div class="flex gap-2 flex-wrap">
    <div class="tooltip" data-tip="Negrita">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('bold')"
        (click)="editor().chain().focus().toggleBold().run()"
      >
        <ng-icon name="phosphorTextBBold" />
      </button>
    </div>
    <div class="tooltip" data-tip="Cursiva">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('italic')"
        (click)="editor().chain().focus().toggleItalic().run()"
      >
        <ng-icon name="phosphorTextItalicBold" />
      </button>
    </div>
    <div class="tooltip" data-tip="Tachado">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('strike')"
        (click)="editor().chain().focus().toggleStrike().run()"
      >
        <ng-icon name="phosphorTextStrikethroughBold" />
      </button>
    </div>
    <div class="tooltip" data-tip="Subrayado">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('underline')"
        (click)="editor().chain().focus().toggleUnderline().run()"
      >
        <ng-icon name="phosphorTextAUnderlineBold" />
      </button>
    </div>
    <div class="tooltip" data-tip="Destacado">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm "
        [class.btn-soft]="editor().isActive('highlight')"
        (click)="editor().chain().focus().toggleHighlight().run()"
      >
        <ng-icon name="phosphorHighlighterBold" />
      </button>
    </div>
    <div class="tooltip" data-tip="Código">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('code')"
        (click)="editor().chain().focus().toggleCode().run()"
      >
        <ng-icon name="phosphorCodeBold" />
      </button>
    </div>
    <div class="tooltip" data-tip="Lista desordenada">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('bulletList')"
        (click)="editor().chain().focus().toggleBulletList().run()"
      >
        <ng-icon name="phosphorListBulletsBold" />
      </button>
    </div>
    <div class="tooltip" data-tip="Lista ordenada">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('orderedList')"
        (click)="editor().chain().focus().toggleOrderedList().run()"
      >
        <ng-icon name="phosphorListNumbersBold" />
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 1">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('heading', { level: 1 })"
        (click)="editor().chain().focus().toggleHeading({ level: 1 }).run()"
      >
        <ng-icon name="phosphorTextHOneBold" />
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 2">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('heading', { level: 2 })"
        (click)="editor().chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <ng-icon name="phosphorTextHTwoBold" />
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 3">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('heading', { level: 3 })"
        (click)="editor().chain().focus().toggleHeading({ level: 3 }).run()"
      >
        <ng-icon name="phosphorTextHThreeBold" />
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 4">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('heading', { level: 4 })"
        (click)="editor().chain().focus().toggleHeading({ level: 4 }).run()"
      >
        <ng-icon name="phosphorTextHFourBold" />
      </button>
    </div>
    <div class="tooltip" data-tip="Encabezado 5">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('heading', { level: 5 })"
        (click)="editor().chain().focus().toggleHeading({ level: 5 }).run()"
      >
        <ng-icon name="phosphorTextHFiveBold" />
      </button>
    </div>
    <div class="tooltip" data-tip="Cita">
      <button
        type="button"
        class="btn btn-ghost btn-primary btn-sm"
        [class.btn-soft]="editor().isActive('blockquote')"
        (click)="editor().chain().focus().toggleBlockquote().run()"
      >
        <ng-icon name="phosphorQuotesBold" />
      </button>
    </div>
  </div>`,
})
export class EditorMenu {
  public editor = input.required<any>();
}
