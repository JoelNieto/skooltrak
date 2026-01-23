import { Transform } from 'class-transformer';

/**
 * Transforms date-only values to noon UTC to prevent
 * timezone shifts from changing the day.
 *
 * GraphQL parses date strings before class-transformer runs,
 * so we handle both Date objects (at midnight) and strings.
 */
export function TransformDateToNoon() {
  return Transform(({ value }) => {
    if (!value) return value;

    // If it's already a Date object (GraphQL already parsed it)
    // Shift to noon UTC to prevent timezone day shifts
    if (value instanceof Date) {
      // Extract the UTC date components and create a new date at noon
      const year = value.getUTCFullYear();
      const month = value.getUTCMonth();
      const day = value.getUTCDate();
      return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
    }

    // If it's a date-only string (yyyy-MM-dd), add noon time
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T12:00:00.000Z`);
    }

    // Otherwise parse as-is and shift to noon
    const date = new Date(value);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
  });
}
