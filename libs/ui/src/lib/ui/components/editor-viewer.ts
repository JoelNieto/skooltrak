import { Component } from '@angular/core';

@Component({
  selector: 'lib-editor-viewer',
  template: `<div><ng-content></ng-content></div>`,
  styles: `
    @reference "tailwindcss";
    :host ::ng-deep ul,
    :host ::ng-deep ol {
      list-style: unset;
      padding: 0 1rem;
      margin: 1.25rem 1rem 1.25rem 0.4rem;
    }
    :host ::ng-deep ol {
      list-style-type: decimal !important;
    }
    :host ::ng-deep p > code {
      @apply bg-neutral-200 text-neutral-600;
    }
  `,
})
export class EditorViewer {}
