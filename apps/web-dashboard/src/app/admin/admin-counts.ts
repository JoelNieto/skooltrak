import { httpResource } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { toFetchQueryRecord } from '../core/fetch-query-params';
import { PaginatedResponse } from '../core/pagination-meta';
import Store from '../core/store';

/**
 * Counts the admin shell and the overview show: how far the school's setup has come and what waits
 * for the admin. Provided by the admin shell, so its pages share one set of requests.
 * Each list endpoint is asked for a single row; only `meta.total` is read.
 */
@Injectable()
export class AdminCounts {
  #store = inject(Store);

  readonly #schoolId = computed(() => this.#store.currentSchoolId());

  #total(url: string) {
    return httpResource<PaginatedResponse<unknown>>(() => {
      const schoolId = this.#schoolId();
      if (!schoolId) return undefined;
      return { url, params: toFetchQueryRecord({ schoolId, page: 1, pageSize: 1 }) };
    });
  }

  readonly #schools = httpResource<unknown[]>(() => '/api/v1/schools');
  readonly #degrees = httpResource<number>(() => {
    const schoolId = this.#schoolId();
    if (!schoolId) return undefined;
    return { url: '/api/v1/degrees/by-school/count', params: { schoolId } };
  });
  readonly #studyPlans = this.#total('/api/v1/study-plans');
  readonly #subjects = this.#total('/api/v1/subjects');
  readonly #courses = this.#total('/api/v1/courses');
  readonly #classGroups = this.#total('/api/v1/class-groups');
  readonly #joinRequests = httpResource<unknown[]>(() => '/api/v1/auth/pending-join-requests');

  /** `undefined` while loading or when the request failed, so callers can tell "0" from "unknown". */
  readonly schools = computed(() => this.#schools.value()?.length);
  readonly degrees = computed(() => this.#degrees.value());
  readonly studyPlans = computed(() => this.#studyPlans.value()?.meta.total);
  readonly subjects = computed(() => this.#subjects.value()?.meta.total);
  readonly courses = computed(() => this.#courses.value()?.meta.total);
  readonly classGroups = computed(() => this.#classGroups.value()?.meta.total);
  readonly joinRequests = computed(() => this.#joinRequests.value()?.length);

  /** Re-reads the pending join requests, e.g. after one was approved or rejected. */
  reloadJoinRequests(): void {
    this.#joinRequests.reload();
  }
}
