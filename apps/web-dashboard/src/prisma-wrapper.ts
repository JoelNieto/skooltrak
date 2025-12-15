// Custom Prisma wrapper for frontend - exports enums and types only
// This avoids bundling the Prisma runtime which uses dynamic requires

// Import types using a path that bypasses the Vite alias
// TypeScript will resolve this, but Vite won't process it due to the plugin
import type {
  $Enums as $EnumsNamespace,
  Prisma,
} from '../../../generated/prisma/index.d.ts';

// Re-export Prisma types (compile-time only, stripped by TypeScript)
export type { $EnumsNamespace as $Enums, Prisma };

// Export enum values (runtime values needed in components)
// These are extracted from the generated Prisma index.js
// TypeScript allows both a type and a value with the same name
export const $Enums = {
  Gender: {
    FEMALE: 'FEMALE' as const,
    MALE: 'MALE' as const,
  },
  AssignmentType: {
    HOMEWORK: 'HOMEWORK' as const,
    EXAM: 'EXAM' as const,
    QUIZ: 'QUIZ' as const,
    PROJECT: 'PROJECT' as const,
    PAPER: 'PAPER' as const,
    NEW: 'NEW' as const,
  },
  QuizQuestionType: {
    TEXT: 'TEXT' as const,
    SINGLE_CHOICE: 'SINGLE_CHOICE' as const,
    MULTIPLE_CHOICE: 'MULTIPLE_CHOICE' as const,
    TRUE_FALSE: 'TRUE_FALSE' as const,
    MATCH: 'MATCH' as const,
  },
} as const;
