import { Component, computed, input } from '@angular/core';
import { CourseColorKey, DEFAULT_SUBJECT_ICON, isCourseColor } from '@/shared';
import { UI_ICONS, UiIconName } from '../icons/icons';
import { Icon } from './icon';

export type CourseCoverVariant = 'card' | 'banner' | 'tile';

/** The CSS color of a course color tag, e.g. for the color dot next to a course name. */
export function courseColorVar(color: CourseColorKey | string | null | undefined): string {
  const key: CourseColorKey = isCourseColor(color) ? color : 'SLATE';
  return `var(--color-course-${key.toLowerCase()})`;
}

/**
 * A course's cover: its color tag with its subject's icon (ACA-001 FR .1), or its photo when it has
 * one (`[image]`, FR .3).
 *
 *   <ui-course-cover [color]="course.color" [icon]="course.subject?.icon" />           card: full width, 128px
 *   <ui-course-cover variant="banner" [color]="course.color" [icon]="course.icon" />          full width, 184px
 *   <ui-course-cover variant="tile" [color]="course.color" [icon]="course.subject?.icon" />  72px square
 *
 * The banner heads the course page (FR .10). Content projected into the card and banner variants sits on top of the cover (e.g. a study-plan badge).
 * The cover is decorative: the course name next to it says what it is. An unknown icon falls back
 * to "book-open", an unknown color to slate; the API already resolves a missing color.
 */
@Component({
  selector: 'ui-course-cover',
  imports: [Icon],
  host: {
    class: 'ui-course-cover relative block shrink-0 overflow-hidden',
    '[class.h-32]': "variant() === 'card'",
    '[class.w-full]': "variant() !== 'tile'",
    '[class.h-46]': "variant() === 'banner'",
    '[class.size-18]': "variant() === 'tile'",
    '[class.rounded-lg]': "variant() === 'tile'",
    '[style.background-color]': 'background()',
    '[style.color]': 'foreground()',
    '[attr.data-color]': 'colorKey()',
  },
  template: `
    @if (image()) {
      <!-- FR .3: a cover photo replaces the color cover; the color stays as the course's dot. -->
      <img [src]="image()" alt="" class="ui-course-cover__photo absolute inset-0 size-full object-cover" />
    } @else if (variant() === 'banner') {
      <ui-icon
        [name]="iconName()"
        class="ui-course-cover__watermark pointer-events-none absolute -bottom-20 right-10 text-[280px] opacity-20"
      />
      <ui-icon [name]="iconName()" class="ui-course-cover__icon absolute bottom-6 left-8 text-5xl" />
    } @else if (variant() === 'card') {
      <ui-icon
        [name]="iconName()"
        class="ui-course-cover__watermark pointer-events-none absolute -right-7 -bottom-16 text-[200px] opacity-20"
      />
      <ui-icon [name]="iconName()" class="ui-course-cover__icon absolute bottom-[18px] left-5 text-4xl" />
    } @else {
      <ui-icon [name]="iconName()" class="ui-course-cover__icon absolute inset-0 m-auto text-3xl" />
    }
    <ng-content />
  `,
})
export class CourseCover {
  /** One of the 8 course color tags (COURSE_COLORS). */
  readonly color = input<CourseColorKey | string | null | undefined>(null);
  /** The subject's icon (SUBJECT_ICONS); null or unknown shows "book-open". */
  readonly icon = input<string | null | undefined>(null);
  readonly variant = input<CourseCoverVariant>('card');
  /** The course's cover photo URL (ACA-001 FR .3); when set it replaces the color and icon. */
  readonly image = input<string | null | undefined>(null);

  protected readonly colorKey = computed<CourseColorKey>(() => {
    const color = this.color();
    return isCourseColor(color) ? color : 'SLATE';
  });
  protected readonly background = computed(() => courseColorVar(this.colorKey()));
  protected readonly foreground = computed(() => `var(--color-course-${this.colorKey().toLowerCase()}-content)`);
  protected readonly iconName = computed<UiIconName>(() => {
    const icon = this.icon();
    return icon && icon in UI_ICONS ? (icon as UiIconName) : (DEFAULT_SUBJECT_ICON as UiIconName);
  });
}
