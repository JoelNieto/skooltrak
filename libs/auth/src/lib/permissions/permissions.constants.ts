/**
 * All platform permission descriptiveIds.
 * These are stored in the Permission table and referenced by roles.
 */
export enum Perm {
  // Schools
  MANAGE_SCHOOLS = 'MANAGE_SCHOOLS',
  VIEW_SCHOOLS = 'VIEW_SCHOOLS',

  // Teachers
  MANAGE_TEACHERS = 'MANAGE_TEACHERS',
  VIEW_TEACHERS = 'VIEW_TEACHERS',

  // Students
  MANAGE_STUDENTS = 'MANAGE_STUDENTS',
  VIEW_STUDENTS = 'VIEW_STUDENTS',

  // Parents
  MANAGE_PARENTS = 'MANAGE_PARENTS',
  VIEW_PARENTS = 'VIEW_PARENTS',

  // Courses
  MANAGE_COURSES = 'MANAGE_COURSES',
  VIEW_COURSES = 'VIEW_COURSES',

  // Subjects
  MANAGE_SUBJECTS = 'MANAGE_SUBJECTS',
  VIEW_SUBJECTS = 'VIEW_SUBJECTS',

  // Class Groups
  MANAGE_CLASS_GROUPS = 'MANAGE_CLASS_GROUPS',
  VIEW_CLASS_GROUPS = 'VIEW_CLASS_GROUPS',

  // Assignments
  MANAGE_ASSIGNMENTS = 'MANAGE_ASSIGNMENTS',
  VIEW_ASSIGNMENTS = 'VIEW_ASSIGNMENTS',
  SUBMIT_ASSIGNMENTS = 'SUBMIT_ASSIGNMENTS',

  // Attendance
  MANAGE_ATTENDANCE = 'MANAGE_ATTENDANCE',
  VIEW_ATTENDANCE = 'VIEW_ATTENDANCE',

  // Grades
  MANAGE_GRADES = 'MANAGE_GRADES',
  VIEW_GRADES = 'VIEW_GRADES',

  // Messages
  MANAGE_MESSAGES = 'MANAGE_MESSAGES',
  VIEW_MESSAGES = 'VIEW_MESSAGES',

  // Files
  MANAGE_FILES = 'MANAGE_FILES',
  VIEW_FILES = 'VIEW_FILES',

  // Quizzes
  MANAGE_QUIZZES = 'MANAGE_QUIZZES',
  VIEW_QUIZZES = 'VIEW_QUIZZES',

  // Schedules
  MANAGE_SCHEDULES = 'MANAGE_SCHEDULES',
  VIEW_SCHEDULES = 'VIEW_SCHEDULES',

  // Study Plans
  MANAGE_STUDY_PLANS = 'MANAGE_STUDY_PLANS',
  VIEW_STUDY_PLANS = 'VIEW_STUDY_PLANS',

  // Periods
  MANAGE_PERIODS = 'MANAGE_PERIODS',
  VIEW_PERIODS = 'VIEW_PERIODS',

  // Newsletters
  MANAGE_NEWSLETTER = 'MANAGE_NEWSLETTER',
  VIEW_NEWSLETTER = 'VIEW_NEWSLETTER',

  // Roles & Permissions management
  MANAGE_ROLES = 'MANAGE_ROLES',
  MANAGE_PERMISSIONS = 'MANAGE_PERMISSIONS',
}

/**
 * Human-readable descriptions for each permission.
 */
export const PERMISSION_DESCRIPTIONS: Record<Perm, string> = {
  [Perm.MANAGE_SCHOOLS]: 'Create, update, and delete schools',
  [Perm.VIEW_SCHOOLS]: 'View school information',
  [Perm.MANAGE_TEACHERS]: 'Create, update, and delete teachers',
  [Perm.VIEW_TEACHERS]: 'View teacher information',
  [Perm.MANAGE_STUDENTS]: 'Create, update, and delete students',
  [Perm.VIEW_STUDENTS]: 'View student information',
  [Perm.MANAGE_PARENTS]: 'Create, update, and delete parents',
  [Perm.VIEW_PARENTS]: 'View parent information',
  [Perm.MANAGE_COURSES]: 'Create, update, and delete courses',
  [Perm.VIEW_COURSES]: 'View course information',
  [Perm.MANAGE_SUBJECTS]: 'Create, update, and delete subjects',
  [Perm.VIEW_SUBJECTS]: 'View subject information',
  [Perm.MANAGE_CLASS_GROUPS]: 'Create, update, and delete class groups',
  [Perm.VIEW_CLASS_GROUPS]: 'View class group information',
  [Perm.MANAGE_ASSIGNMENTS]: 'Create, update, and delete assignments',
  [Perm.VIEW_ASSIGNMENTS]: 'View assignment information',
  [Perm.SUBMIT_ASSIGNMENTS]: 'Submit assignment responses',
  [Perm.MANAGE_ATTENDANCE]: 'Record and manage attendance',
  [Perm.VIEW_ATTENDANCE]: 'View attendance records',
  [Perm.MANAGE_GRADES]: 'Create, update, and delete grades',
  [Perm.VIEW_GRADES]: 'View grade information',
  [Perm.MANAGE_MESSAGES]: 'Send and manage messages',
  [Perm.VIEW_MESSAGES]: 'View messages',
  [Perm.MANAGE_FILES]: 'Upload and manage files',
  [Perm.VIEW_FILES]: 'View and download files',
  [Perm.MANAGE_QUIZZES]: 'Create, update, and delete quizzes',
  [Perm.VIEW_QUIZZES]: 'View quizzes',
  [Perm.MANAGE_SCHEDULES]: 'Create, update, and delete schedules',
  [Perm.VIEW_SCHEDULES]: 'View schedules',
  [Perm.MANAGE_STUDY_PLANS]: 'Create, update, and delete study plans',
  [Perm.VIEW_STUDY_PLANS]: 'View study plans',
  [Perm.MANAGE_PERIODS]: 'Create, update, and delete periods',
  [Perm.VIEW_PERIODS]: 'View periods',
  [Perm.MANAGE_NEWSLETTER]: 'Create, update, and delete newsletters',
  [Perm.VIEW_NEWSLETTER]: 'View newsletters',
  [Perm.MANAGE_ROLES]: 'Create, update, and delete roles',
  [Perm.MANAGE_PERMISSIONS]: 'Manage permission assignments',
};

/** All permission values as an array */
export const ALL_PERMISSIONS = Object.values(Perm);

/**
 * Default role names used by the platform.
 */
export enum DefaultRole {
  ORG_ADMIN = 'ORG_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

/**
 * Default role-permission mapping.
 * ORG_ADMIN gets everything; other roles get a subset.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<DefaultRole, Perm[]> = {
  [DefaultRole.ORG_ADMIN]: ALL_PERMISSIONS as Perm[],

  [DefaultRole.TEACHER]: [
    // View
    Perm.VIEW_SCHOOLS,
    Perm.VIEW_TEACHERS,
    Perm.VIEW_STUDENTS,
    Perm.VIEW_PARENTS,
    Perm.VIEW_COURSES,
    Perm.VIEW_SUBJECTS,
    Perm.VIEW_CLASS_GROUPS,
    Perm.VIEW_STUDY_PLANS,
    Perm.VIEW_PERIODS,
    Perm.VIEW_SCHEDULES,
    Perm.VIEW_ASSIGNMENTS,
    Perm.VIEW_ATTENDANCE,
    Perm.VIEW_GRADES,
    Perm.VIEW_MESSAGES,
    Perm.VIEW_FILES,
    Perm.VIEW_QUIZZES,
    // Manage
    Perm.MANAGE_ASSIGNMENTS,
    Perm.MANAGE_ATTENDANCE,
    Perm.MANAGE_GRADES,
    Perm.MANAGE_MESSAGES,
    Perm.MANAGE_FILES,
    Perm.MANAGE_QUIZZES,
    Perm.VIEW_NEWSLETTER,
  ],

  [DefaultRole.STUDENT]: [
    Perm.VIEW_COURSES,
    Perm.VIEW_SUBJECTS,
    Perm.VIEW_CLASS_GROUPS,
    Perm.VIEW_ASSIGNMENTS,
    Perm.SUBMIT_ASSIGNMENTS,
    Perm.VIEW_ATTENDANCE,
    Perm.VIEW_GRADES,
    Perm.VIEW_MESSAGES,
    Perm.MANAGE_MESSAGES,
    Perm.VIEW_FILES,
    Perm.VIEW_QUIZZES,
    Perm.VIEW_SCHEDULES,
    Perm.VIEW_STUDY_PLANS,
    Perm.VIEW_PERIODS,
    Perm.VIEW_NEWSLETTER,
  ],

  [DefaultRole.PARENT]: [
    Perm.VIEW_COURSES,
    Perm.VIEW_ASSIGNMENTS,
    Perm.VIEW_ATTENDANCE,
    Perm.VIEW_GRADES,
    Perm.VIEW_MESSAGES,
    Perm.VIEW_SCHEDULES,
    Perm.VIEW_NEWSLETTER,
  ],
};

/**
 * Human-readable descriptions for each default role.
 */
export const DEFAULT_ROLE_DESCRIPTIONS: Record<DefaultRole, string> = {
  [DefaultRole.ORG_ADMIN]: 'Organization Administrator',
  [DefaultRole.TEACHER]: 'Teacher',
  [DefaultRole.STUDENT]: 'Student',
  [DefaultRole.PARENT]: 'Parent or Guardian',
};
