/**
 * Central, typed definition of the `onboardingStep` state machine.
 *
 * Values intentionally match the legacy free-form strings so no data migration
 * or frontend route/switch changes are required. All writes to
 * `User.onboardingStep` should use these constants (and ideally go through
 * `canTransition` / `assertTransition`) so the state machine cannot drift.
 */
export const OnboardingStep = {
  CHOOSE_PATH: 'choose-path',
  SCHOOL_SETUP: 'school-setup',
  WAITING_APPROVAL: 'waiting-approval',
  COMPLETED: 'completed',
} as const;

export type OnboardingStep = (typeof OnboardingStep)[keyof typeof OnboardingStep];

/** Allowed transitions per current step. `null` = not yet set. */
const ALLOWED_TRANSITIONS: Record<OnboardingStep | 'null', OnboardingStep[]> = {
  null: [OnboardingStep.CHOOSE_PATH],
  [OnboardingStep.CHOOSE_PATH]: [
    OnboardingStep.SCHOOL_SETUP,
    OnboardingStep.COMPLETED,
    OnboardingStep.WAITING_APPROVAL,
  ],
  [OnboardingStep.SCHOOL_SETUP]: [OnboardingStep.COMPLETED],
  [OnboardingStep.WAITING_APPROVAL]: [OnboardingStep.COMPLETED, OnboardingStep.CHOOSE_PATH],
  [OnboardingStep.COMPLETED]: [OnboardingStep.COMPLETED],
};

/** Whether a transition from `from` to `to` is permitted by the state machine. */
export function canTransition(
  from: OnboardingStep | null | undefined,
  to: OnboardingStep,
): boolean {
  const key = (from ?? null) as OnboardingStep | 'null';
  return ALLOWED_TRANSITIONS[key]?.includes(to) ?? false;
}

/** Throws if the transition is not allowed. */
export function assertTransition(
  from: OnboardingStep | null | undefined,
  to: OnboardingStep,
): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Transición de onboarding inválida: '${from ?? 'null'}' -> '${to}'`,
    );
  }
}
