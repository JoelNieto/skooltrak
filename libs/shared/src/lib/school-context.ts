import { Injectable, signal } from '@angular/core';

/**
 * Shared school selection for host + federated remotes (e.g. school store).
 * The dashboard host syncs this from its local Store when the user switches schools.
 */
@Injectable({ providedIn: 'root' })
export class SchoolContext {
  /** Active school id for GraphQL queries scoped to the selected school. */
  readonly currentSchoolId = signal<string | null>(null);

  /** ISO currency code for price display (synced from dashboard school). */
  readonly currencyCode = signal<string>('USD');
}
