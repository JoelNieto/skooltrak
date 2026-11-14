import '@angular/compiler';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

// The apps run zoneless (provideZonelessChangeDetection) and zone.js is not installed.
setupTestBed({ zoneless: true });
