import { effect, signal, Signal } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';

export const markGroupDirty = (formGroup: FormGroup) =>
  Object.keys(formGroup.controls).forEach((key) => {
    switch (formGroup.get(key)?.constructor.name) {
      case 'FormGroup':
        markGroupDirty(formGroup.get(key) as FormGroup);
        break;
      case 'FormArray':
        markArrayDirty(formGroup.get(key) as FormArray);
        break;
      case 'FormControl':
        markControlDirty(formGroup.get(key) as FormControl);
        break;
      case 'FormControl2':
        markControlDirty(formGroup.get(key) as FormControl);
        break;
    }
  });

export const markArrayDirty = (formArray: FormArray) =>
  formArray.controls.forEach((control) => {
    switch (control.constructor.name) {
      case 'FormGroup':
        markGroupDirty(control as FormGroup);
        break;
      case 'FormArray':
        markArrayDirty(control as FormArray);
        break;
      case 'FormControl':
        markControlDirty(control as FormControl);
        break;
    }
  });
export const markControlDirty = (formControl: FormControl) =>
  formControl.markAsDirty();

export const getDatesFromWeek = (week: string) => {
  // Parse year and week number
  const [year, weekNumber] = week.split('-W').map(Number);

  // Get the first day of the year
  const firstDayOfYear = new Date(year, 0, 1);

  // Calculate the first Monday of the year (ISO weeks start on Monday)
  const firstMonday = new Date(firstDayOfYear);
  const dayOfWeek = firstMonday.getDay(); // 0 (Sun) to 6 (Sat)
  const daysToMonday = dayOfWeek <= 4 ? 1 - dayOfWeek : 8 - dayOfWeek;
  firstMonday.setDate(firstMonday.getDate() + daysToMonday);

  // Calculate the first day of the target week (Monday)
  const firstDayOfWeek = new Date(firstMonday);
  firstDayOfWeek.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);

  // Get all 7 days (Monday to Sunday)
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(firstDayOfWeek);
    date.setDate(firstDayOfWeek.getDate() + i);
    weekDates.push(date);
  }

  return weekDates;
};

export function debounceSignal<T>(source: Signal<T>, delay: number) {
  const debounced = signal(source());
  effect((onCleanup) => {
    const value = source();
    const timeoutId = setTimeout(() => {
      debounced.set(value);
    }, delay);
    onCleanup(() => {
      clearTimeout(timeoutId);
    });
  });
  return debounced;
}
