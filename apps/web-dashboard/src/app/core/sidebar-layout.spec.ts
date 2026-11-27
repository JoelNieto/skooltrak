import { TestBed } from '@angular/core/testing';
import { SidebarLayout } from './sidebar-layout';

describe('SidebarLayout', () => {
  beforeEach(() => localStorage.clear());

  it('starts collapsed to the icon rail', () => {
    const layout = TestBed.inject(SidebarLayout);
    expect(layout.collapsed()).toBe(true);
  });

  it('remembers the choice', () => {
    TestBed.inject(SidebarLayout).toggle();
    expect(localStorage.getItem('skooltrak-sidebar-collapsed')).toBe('0');

    TestBed.resetTestingModule();
    expect(TestBed.inject(SidebarLayout).collapsed()).toBe(false);
  });
});
