import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-loader',
  template: ` <div class="loader"></div> `,
  styles: `.loader {
        width: 148px;
        height: 148px;
        border-radius: 50%;
        animation: rotate 1s linear infinite;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
  
      }
      .loader::before , .loader::after {
        content: "";
        box-sizing: border-box;
        position: absolute;
        inset: 0px;
        border-radius: 50%;
        border: 10px solid #FFF;
        border-color: var(--color-primary);
        animation: prixClipFix 2s linear infinite ;
      }
      .loader::after{
        border-color: var(--color-secondary);
        animation: prixClipFix 2s linear infinite , rotate 0.5s linear infinite reverse;
        inset: 12px;
      }

      @keyframes rotate {
        0%   {transform: rotate(0deg)}
        100%   {transform: rotate(360deg)}
      }

      @keyframes prixClipFix {
          0%   {clip-path:polygon(50% 50%,0 0,0 0,0 0,0 0,0 0)}
          25%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 0,100% 0,100% 0)}
          50%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,100% 100%,100% 100%)}
          75%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 100%)}
          100% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 0)}
      }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Loader {}
