import { Component, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Modal } from './modal';

@Component({ selector: 'lib-test-modal-content', template: '' })
class TestContent {
  static last: TestContent | null = null;
  public closeModal = output<string>();
  constructor() {
    TestContent.last = this;
  }
}

describe('Modal', () => {
  let service: Modal;

  beforeEach(() => {
    // jsdom does not implement <dialog> methods
    HTMLDialogElement.prototype.showModal ??= function () {};
    HTMLDialogElement.prototype.close ??= function () {};
    TestBed.configureTestingModule({});
    service = TestBed.inject(Modal);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('closes and emits the result when the content emits closeModal', () => {
    const ref = service.open<string, TestContent>(TestContent);
    const results: string[] = [];
    ref.closed.subscribe((r) => results.push(r));

    TestContent.last?.closeModal.emit('done');

    expect(results).toEqual(['done']);
    expect(document.body.querySelector('lib-test-modal-content')).toBeNull();
  });
});
