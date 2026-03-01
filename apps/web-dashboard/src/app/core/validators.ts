/**
 * Validates route param IDs before making API calls.
 * Rejects empty, undefined, and invalid string values.
 */
export function isValidId(id: unknown): id is string {
  return (
    typeof id === 'string' &&
    id.trim() !== '' &&
    id !== 'undefined' &&
    id !== 'null'
  );
}
