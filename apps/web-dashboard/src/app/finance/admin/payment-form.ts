import { Button, Toast, UiCheckbox, UiField, UiInput, UiSelect } from '#/ui';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  apiError,
  FinanceAccountDetail,
  localToday,
  money,
  PaymentReceipt,
  shortDate,
  suggestAllocation,
  toCents,
} from '../finance.types';

interface OpenCharge {
  id: string;
  description: string;
  student: string | null;
  dueDate: string;
  outstandingCents: number;
}

/**
 * "Registrar pago" (FR-FIN-001.14): a transfer/ACH or Yappy received outside the app. The amount is
 * spread over the account's open charges oldest due first; staff can change it. What is left
 * becomes saldo a favor (BR-FIN-001.15). The server re-checks every amount (BR-FIN-001.3).
 */
@Component({
  selector: 'app-finance-payment-form',
  imports: [Button, FormsModule, UiCheckbox, UiField, UiInput, UiSelect],
  template: `
    <form class="flex flex-col gap-4" (submit)="onSubmit($event)">
      <div class="grid grid-cols-2 gap-4">
        <ui-field label="Método">
          <select uiSelect name="method" [ngModel]="method()" (ngModelChange)="method.set($event)">
            <option value="BANK_TRANSFER">Transferencia / ACH</option>
            <option value="YAPPY">Yappy</option>
          </select>
        </ui-field>
        <ui-field label="Monto">
          <input
            uiInput
            type="number"
            step="0.01"
            inputmode="decimal"
            name="amount"
            [ngModel]="amount()"
            (ngModelChange)="setAmount($event)"
          />
        </ui-field>
        <ui-field label="Fecha de recepción">
          <input uiInput type="date" name="receivedAt" [max]="today" [ngModel]="receivedAt()" (ngModelChange)="receivedAt.set($event)" />
        </ui-field>
        <ui-field label="Referencia" hint="Número de transferencia o de transacción Yappy.">
          <input uiInput type="text" name="reference" maxlength="80" [ngModel]="reference()" (ngModelChange)="reference.set($event)" />
        </ui-field>
      </div>

      <fieldset class="flex flex-col gap-2">
        <legend class="text-sm font-medium text-ink-strong mb-1">Aplicar a</legend>
        @if (!openCharges().length) {
          <p class="text-sm text-ink-muted">La cuenta no tiene cargos pendientes: todo el monto quedará como saldo a favor.</p>
        } @else {
          <ul class="flex flex-col border border-line rounded-box divide-y divide-line max-h-72 overflow-auto">
            @for (c of openCharges(); track c.id) {
              <li class="flex items-center gap-3 px-3 py-2" data-testid="allocation-row">
                <input
                  uiCheckbox
                  type="checkbox"
                  [attr.aria-label]="'Pagar ' + c.description"
                  [checked]="allocations().has(c.id)"
                  (change)="toggle(c, $any($event.target).checked)"
                />
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-ink-strong truncate">{{ c.description }}</div>
                  <div class="text-xs text-ink-muted">
                    {{ c.student ?? 'Cuenta' }} · vence {{ date(c.dueDate) }} · debe {{ fmt(c.outstandingCents) }}
                  </div>
                </div>
                <input
                  uiInput
                  type="number"
                  step="0.01"
                  inputmode="decimal"
                  class="w-28 text-right"
                  [attr.aria-label]="'Monto para ' + c.description"
                  [disabled]="!allocations().has(c.id)"
                  [value]="allocations().has(c.id) ? (allocations().get(c.id)! / 100).toFixed(2) : ''"
                  (change)="setRow(c, $any($event.target).value)"
                />
              </li>
            }
          </ul>
        }
        <div class="flex justify-between text-sm mt-1">
          <span class="text-ink-muted">Aplicado {{ fmt(allocatedCents()) }}</span>
          @if (overAllocated()) {
            <span class="text-danger font-semibold" role="alert">Lo aplicado supera el monto del pago</span>
          } @else {
            <span data-testid="payment-credit" [class.text-success]="creditCents() > 0" [class.font-semibold]="creditCents() > 0">
              Saldo a favor {{ fmt(creditCents()) }}
            </span>
          }
        </div>
      </fieldset>

      <ui-field label="Nota (opcional)">
        <input uiInput type="text" name="note" maxlength="500" [ngModel]="note()" (ngModelChange)="note.set($event)" />
      </ui-field>

      <div class="flex justify-end gap-2">
        <button uiButton variant="ghost" type="button" (click)="closeModal.emit()">Cancelar</button>
        <button uiButton variant="primary" type="submit" [disabled]="saving() || overAllocated()">Registrar pago</button>
      </div>
    </form>
  `,
})
export default class PaymentForm {
  readonly data = input.required<{ account: FinanceAccountDetail }>();
  readonly closeModal = output<void>();

  private http = inject(HttpClient);
  private toast = inject(Toast);
  private router = inject(Router);

  protected readonly today = localToday();
  protected readonly method = signal<'BANK_TRANSFER' | 'YAPPY'>('BANK_TRANSFER');
  protected readonly amount = signal<number | null>(null);
  protected readonly receivedAt = signal(this.today);
  protected readonly reference = signal('');
  protected readonly note = signal('');
  protected readonly allocations = signal(new Map<string, number>());
  protected readonly saving = signal(false);

  protected readonly openCharges = computed<OpenCharge[]>(() => {
    const a = this.data().account;
    const names = new Map(a.students.map((s) => [s.id, s.name]));
    return a.charges
      .filter((c) => c.status !== 'CANCELLED' && c.outstanding > 0)
      .map((c) => ({
        id: c.id,
        description: c.description,
        student: c.studentId ? (names.get(c.studentId) ?? null) : null,
        dueDate: c.dueDate,
        outstandingCents: toCents(c.outstanding),
      }))
      .sort((x, y) => x.dueDate.localeCompare(y.dueDate));
  });

  protected readonly amountCents = computed(() => toCents(this.amount() ?? 0));
  protected readonly allocatedCents = computed(() => [...this.allocations().values()].reduce((s, v) => s + v, 0));
  protected readonly overAllocated = computed(() => this.allocatedCents() > this.amountCents());
  protected readonly creditCents = computed(() => Math.max(0, this.amountCents() - this.allocatedCents()));

  /** A new amount re-suggests the allocation, oldest due first. */
  protected setAmount(value: number | null) {
    this.amount.set(value);
    this.allocations.set(suggestAllocation(toCents(value ?? 0), this.openCharges()));
  }

  protected toggle(c: OpenCharge, checked: boolean) {
    const next = new Map(this.allocations());
    if (checked) {
      const left = this.amountCents() - this.allocatedCents();
      next.set(c.id, Math.max(0, Math.min(c.outstandingCents, left)) || c.outstandingCents);
    } else {
      next.delete(c.id);
    }
    this.allocations.set(next);
  }

  protected setRow(c: OpenCharge, value: string) {
    const next = new Map(this.allocations());
    const v = Math.min(toCents(Number(value)), c.outstandingCents);
    if (v > 0) next.set(c.id, v);
    else next.delete(c.id);
    this.allocations.set(next);
  }

  protected fmt(cents: number) {
    return money(cents / 100, this.data().account.school.currencyCode);
  }

  protected date(d: string) {
    return shortDate(d);
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    if (!(this.amountCents() > 0)) return this.toast.showError('Indica el monto');
    if (!this.reference().trim()) return this.toast.showError('Indica la referencia');
    if (!this.receivedAt()) return this.toast.showError('Indica la fecha de recepción');
    if (this.overAllocated()) return;
    this.saving.set(true);
    try {
      const receipt = await firstValueFrom(
        this.http.post<PaymentReceipt>('/api/v1/finance/payments', {
          accountId: this.data().account.id,
          method: this.method(),
          amount: this.amountCents() / 100,
          receivedAt: this.receivedAt(),
          reference: this.reference().trim(),
          ...(this.note().trim() ? { note: this.note().trim() } : {}),
          allocations: [...this.allocations()].map(([chargeId, cents]) => ({ chargeId, amount: cents / 100 })),
        }),
      );
      this.toast.showSuccess(`Pago registrado · ${receipt.receiptNumber}`);
      this.closeModal.emit();
      await this.router.navigate(['/financial-module/payments', receipt.id]);
    } catch (err) {
      this.toast.showError(apiError(err, 'No se pudo registrar el pago'));
    } finally {
      this.saving.set(false);
    }
  }
}
