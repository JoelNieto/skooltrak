import { Pipe, PipeTransform } from '@angular/core';
import { format, isSameDay, isSameYear } from 'date-fns';

@Pipe({
  name: 'timeAgo',
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string): string {
    if (isSameDay(new Date(value), new Date())) {
      return format(new Date(value), 'h:mm a');
    }

    if (isSameYear(new Date(value), new Date())) {
      return format(new Date(value), 'dd MMM');
    }
    return format(new Date(value), 'dd/MM/yyyy');
  }
}
