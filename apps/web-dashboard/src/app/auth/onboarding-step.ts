/**
 * Mirror of `OnboardingStep` in `libs/auth/src/lib/onboarding-step.ts`.
 *
 * The web dashboard cannot import the server `libs/auth` module graph, so the
 * small set of onboarding-step string constants is duplicated here. Keep the
 * two in sync — they are plain strings with no logic.
 */
export const OnboardingStep = {
  CHOOSE_PATH: 'choose-path',
  SCHOOL_SETUP: 'school-setup',
  WAITING_APPROVAL: 'waiting-approval',
  COMPLETED: 'completed',
} as const;

export type OnboardingStep = (typeof OnboardingStep)[keyof typeof OnboardingStep];
