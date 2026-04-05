/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: any; output: any; }
};

export type AddChatParticipantsInput = {
  /** Chat ID */
  chatId: Scalars['String']['input'];
  /** User IDs to add */
  userIds: Array<Scalars['String']['input']>;
};

export type AddToCartInput = {
  productId: Scalars['String']['input'];
  quantity?: Scalars['Int']['input'];
};

export type Assignment = {
  __typename?: 'Assignment';
  /** Course of the assignment */
  course: Course;
  /** Course ID of the assignment */
  courseId: Scalars['String']['output'];
  /** Created at */
  createdAt: Scalars['DateTime']['output'];
  /** Default date of the assignment */
  date: Scalars['DateTime']['output'];
  /** Group-specific due dates */
  dates?: Maybe<Array<AssignmentDate>>;
  /** Details of the assignment */
  details: Scalars['String']['output'];
  /** ID of the assignment (auto-generated) */
  id: Scalars['String']['output'];
  /** Require submission of the assignment */
  requireSubmission: Scalars['Boolean']['output'];
  /** School ID of the assignment */
  schoolId: Scalars['String']['output'];
  /** Teacher of the assignment */
  teacher: Teacher;
  /** Teacher ID of the assignment */
  teacherId: Scalars['String']['output'];
  /** Title of the assignment */
  title: Scalars['String']['output'];
  /** Type of the assignment */
  type: Scalars['String']['output'];
  /** Updated at */
  updatedAt: Scalars['DateTime']['output'];
};

export type AssignmentDate = {
  __typename?: 'AssignmentDate';
  /** Assignment ID */
  assignmentId: Scalars['String']['output'];
  /** Class group */
  classGroup?: Maybe<ClassGroup>;
  /** Class group ID */
  classGroupId: Scalars['String']['output'];
  /** Due date for this group */
  date: Scalars['DateTime']['output'];
  /** ID of the assignment date */
  id: Scalars['String']['output'];
};

export type AssignmentDateInput = {
  /** Class group ID */
  classGroupId: Scalars['String']['input'];
  /** Due date for this group */
  date: Scalars['DateTime']['input'];
};

export type AssignmentDateWithDetails = {
  __typename?: 'AssignmentDateWithDetails';
  /** Assignment details */
  assignment: AssignmentDetails;
  /** Assignment ID */
  assignmentId: Scalars['String']['output'];
  /** Class group */
  classGroup: ClassGroup;
  /** Class group ID */
  classGroupId: Scalars['String']['output'];
  /** Due date for this group */
  date: Scalars['DateTime']['output'];
  /** ID of the assignment date */
  id: Scalars['String']['output'];
};

export type AssignmentDetails = {
  __typename?: 'AssignmentDetails';
  /** Course of the assignment */
  course: Course;
  /** Details of the assignment */
  details: Scalars['String']['output'];
  /** ID of the assignment */
  id: Scalars['String']['output'];
  /** Require submission */
  requireSubmission: Scalars['Boolean']['output'];
  /** Teacher of the assignment */
  teacher: Teacher;
  /** Title of the assignment */
  title: Scalars['String']['output'];
  /** Type of the assignment */
  type: Scalars['String']['output'];
};

export type AssignmentSubmission = {
  __typename?: 'AssignmentSubmission';
  /** Assignment of the submission */
  assignment: Assignment;
  /** Assignment ID */
  assignmentId: Scalars['String']['output'];
  /** Submitted file */
  file: File;
  /** File ID */
  fileId: Scalars['String']['output'];
  /** ID of the submission */
  id: Scalars['String']['output'];
  /** Student who submitted */
  student: Student;
  /** Student ID */
  studentId: Scalars['String']['output'];
  /** Submission date */
  submittedAt: Scalars['DateTime']['output'];
  /** Updated at */
  updatedAt: Scalars['DateTime']['output'];
};

export type AttendanceRecord = {
  __typename?: 'AttendanceRecord';
  /** Attendance session */
  attendanceSession?: Maybe<AttendanceSession>;
  /** Attendance session ID */
  attendanceSessionId: Scalars['String']['output'];
  /** Optional comment */
  comment?: Maybe<Scalars['String']['output']>;
  /** Created at */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the attendance record */
  id: Scalars['String']['output'];
  /** Attendance status */
  status: AttendanceStatus;
  /** Student of this record */
  student: Student;
  /** Student ID */
  studentId: Scalars['String']['output'];
  /** Updated at */
  updatedAt: Scalars['DateTime']['output'];
};

export type AttendanceSession = {
  __typename?: 'AttendanceSession';
  /** Class group of this session */
  classGroup: ClassGroup;
  /** Class group ID */
  classGroupId: Scalars['String']['output'];
  /** Course of this session */
  course: Course;
  /** Course ID */
  courseId: Scalars['String']['output'];
  /** Created at */
  createdAt: Scalars['DateTime']['output'];
  /** Date of the attendance session */
  date: Scalars['DateTime']['output'];
  /** ID of the attendance session */
  id: Scalars['String']['output'];
  /** Organization ID */
  organizationId: Scalars['String']['output'];
  /** Attendance records for this session */
  records: Array<AttendanceRecord>;
  /** Teacher who created this session */
  teacher: Teacher;
  /** Teacher ID */
  teacherId: Scalars['String']['output'];
  /** Updated at */
  updatedAt: Scalars['DateTime']['output'];
};

export type AttendanceStats = {
  __typename?: 'AttendanceStats';
  /** Absent count */
  absent: Scalars['Int']['output'];
  /** Absent percentage */
  absentPercentage: Scalars['Int']['output'];
  /** Excused count */
  excused: Scalars['Int']['output'];
  /** Late count */
  late: Scalars['Int']['output'];
  /** Present count */
  present: Scalars['Int']['output'];
  /** Present percentage */
  presentPercentage: Scalars['Int']['output'];
  /** Sick leave count */
  sickLeave: Scalars['Int']['output'];
  /** Total attendance records */
  total: Scalars['Int']['output'];
};

/** Status of attendance for a student */
export enum AttendanceStatus {
  Absent = 'ABSENT',
  Excused = 'EXCUSED',
  Late = 'LATE',
  Present = 'PRESENT',
  SickLeave = 'SICK_LEAVE'
}

export type AuthPayload = {
  __typename?: 'AuthPayload';
  accessToken: Scalars['String']['output'];
};

export type AvailableSchool = {
  __typename?: 'AvailableSchool';
  city?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  logo?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  organizationName?: Maybe<Scalars['String']['output']>;
  shortName: Scalars['String']['output'];
  studentCount: Scalars['Int']['output'];
};

export type Charge = {
  __typename?: 'Charge';
  amount: Scalars['Float']['output'];
  chargeType: ChargeType;
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  dueDate: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  school: School;
  schoolId: Scalars['String']['output'];
  status: ChargeStatus;
  student: Student;
  studentId: Scalars['String']['output'];
  studyPlan?: Maybe<StudyPlan>;
  studyPlanId?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  year: Scalars['Int']['output'];
};

export enum ChargeStatus {
  Overdue = 'OVERDUE',
  Paid = 'PAID',
  Partial = 'PARTIAL',
  Pending = 'PENDING'
}

export enum ChargeType {
  Custom = 'CUSTOM',
  Enrollment = 'ENROLLMENT',
  Tuition = 'TUITION'
}

export type Chat = {
  __typename?: 'Chat';
  assignmentId?: Maybe<Scalars['String']['output']>;
  classGroupId?: Maybe<Scalars['String']['output']>;
  courseId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<User>;
  createdById?: Maybe<Scalars['String']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  organizationId: Scalars['String']['output'];
  participants: Array<ChatParticipant>;
  type: ChatType;
  updatedAt: Scalars['DateTime']['output'];
};

export type ChatMessage = {
  __typename?: 'ChatMessage';
  chatId: Scalars['String']['output'];
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['String']['output'];
  replyToId?: Maybe<Scalars['String']['output']>;
  sender?: Maybe<User>;
  senderId?: Maybe<Scalars['String']['output']>;
};

export type ChatMessagesInput = {
  /** Chat ID */
  chatId: Scalars['String']['input'];
  /** Cursor for pagination (message ID) */
  cursor?: InputMaybe<Scalars['String']['input']>;
  /** Number of messages to fetch */
  limit?: Scalars['Int']['input'];
};

export type ChatParticipant = {
  __typename?: 'ChatParticipant';
  chatId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  joinedAt: Scalars['DateTime']['output'];
  lastReadAt?: Maybe<Scalars['DateTime']['output']>;
  role: ChatParticipantRole;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['String']['output'];
};

export enum ChatParticipantRole {
  Admin = 'ADMIN',
  Member = 'MEMBER'
}

export enum ChatType {
  Assignment = 'ASSIGNMENT',
  ClassGroup = 'CLASS_GROUP',
  Course = 'COURSE',
  Direct = 'DIRECT',
  Group = 'GROUP'
}

export type CheckPendingInvitationResult = {
  __typename?: 'CheckPendingInvitationResult';
  hasPendingInvitation: Scalars['Boolean']['output'];
  organizationName?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
};

export type CheckoutStoreInput = {
  notes?: InputMaybe<Scalars['String']['input']>;
  schoolId: Scalars['String']['input'];
};

export type ClassGroup = {
  __typename?: 'ClassGroup';
  /** Active status of the class group */
  active: Scalars['Boolean']['output'];
  /** Courses of the class group */
  courses: Array<Course>;
  /** Created at of the class group */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the class group */
  id: Scalars['String']['output'];
  /** Name of the class group */
  name: Scalars['String']['output'];
  /** Organization ID of the class group */
  organizationId: Scalars['String']['output'];
  /** School ID of the class group */
  schoolId: Scalars['String']['output'];
  /** Students of the class group */
  students: Array<Student>;
  /** Study plan of the class group */
  studyPlan: StudyPlan;
  /** Study plan ID of the class group */
  studyPlanId: Scalars['String']['output'];
  /** Teacher of the class group */
  teacher?: Maybe<Teacher>;
  /** Teacher ID of the class group */
  teacherId?: Maybe<Scalars['String']['output']>;
  /** Updated at of the class group */
  updatedAt: Scalars['DateTime']['output'];
};

export type ClassGroupRef = {
  __typename?: 'ClassGroupRef';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type Course = {
  __typename?: 'Course';
  /** Code of the course */
  code: Scalars['String']['output'];
  /** Created at */
  createdAt: Scalars['DateTime']['output'];
  /** Grades of the course */
  grades: Array<Grade>;
  /** ID of the course (auto-generated) */
  id: Scalars['String']['output'];
  /** Name of the course */
  name: Scalars['String']['output'];
  /** Organization ID of the course */
  organizationId: Scalars['String']['output'];
  /** School of the course */
  school: School;
  /** School ID of the course */
  schoolId: Scalars['String']['output'];
  /** Short name of the course */
  shortName: Scalars['String']['output'];
  /** Study plan of the course */
  studyPlan: StudyPlan;
  /** Study plan ID of the course */
  studyPlanId: Scalars['String']['output'];
  /** Subject of the course */
  subject: Subject;
  /** Subject ID of the course */
  subjectId: Scalars['String']['output'];
  /** Teacher of the course */
  teacher?: Maybe<Teacher>;
  /** Teacher ID of the course */
  teacherId?: Maybe<Scalars['String']['output']>;
  /** Updated at */
  updatedAt: Scalars['DateTime']['output'];
};

export type CreateAssignmentInput = {
  /** Id del curso */
  courseId: Scalars['String']['input'];
  /** Fecha de la asignacion */
  date: Scalars['String']['input'];
  /** Detalles de la asignacion */
  details: Scalars['String']['input'];
  /** Fechas de la asignacion */
  groupDates?: InputMaybe<Array<AssignmentDateInput>>;
  /** Requiere envio */
  requireSubmission: Scalars['Boolean']['input'];
  /** Id de la escuela */
  schoolId: Scalars['String']['input'];
  /** Id del profesor */
  teacherId: Scalars['String']['input'];
  /** Titulo de la asignacion */
  title: Scalars['String']['input'];
  /** Tipo de la asignacion */
  type: Scalars['String']['input'];
};

export type CreateAssignmentSubmissionInput = {
  /** Assignment ID */
  assignmentId: Scalars['String']['input'];
  /** File name */
  fileName: Scalars['String']['input'];
  /** Size of the file in bytes */
  fileSize: Scalars['Int']['input'];
  /** MIME type of the file */
  mimeType: Scalars['String']['input'];
  /** Storage key from the upload */
  storageKey: Scalars['String']['input'];
};

export type CreateAttendanceRecordInput = {
  /** Optional comment */
  comment?: InputMaybe<Scalars['String']['input']>;
  /** Attendance status */
  status: AttendanceStatus;
  /** Student ID */
  studentId: Scalars['String']['input'];
};

export type CreateAttendanceSessionInput = {
  /** Class group ID */
  classGroupId: Scalars['String']['input'];
  /** Course ID */
  courseId: Scalars['String']['input'];
  /** Date of the attendance session */
  date: Scalars['DateTime']['input'];
  /** Attendance records for each student */
  records: Array<CreateAttendanceRecordInput>;
};

export type CreateChargeInput = {
  amount: Scalars['Float']['input'];
  chargeType?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate: Scalars['DateTime']['input'];
  schoolId: Scalars['String']['input'];
  studentId?: InputMaybe<Scalars['String']['input']>;
  /** If provided, creates charges for all students in class groups using this study plan */
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  year: Scalars['Int']['input'];
};

export type CreateClassGroupInput = {
  /** Active status of the class group */
  active?: Scalars['Boolean']['input'];
  /** Name of the class group */
  name: Scalars['String']['input'];
  /** Organization ID of the class group */
  organizationId: Scalars['String']['input'];
  /** School ID of the class group */
  schoolId: Scalars['String']['input'];
  /** Study plan ID of the class group */
  studyPlanId: Scalars['String']['input'];
  /** Teacher ID of the class group */
  teacherId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateContextualChatInput = {
  /** ID of the course, assignment, or class group */
  contextId: Scalars['String']['input'];
  /** Context type: COURSE, ASSIGNMENT, or CLASS_GROUP */
  contextType: ChatType;
};

export type CreateCourseInput = {
  /** Code of the course */
  code: Scalars['String']['input'];
  /** Name of the course */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Organization ID of the course */
  organizationId: Scalars['String']['input'];
  /** School ID of the course */
  schoolId: Scalars['String']['input'];
  /** Short name of the course */
  shortName?: InputMaybe<Scalars['String']['input']>;
  /** Study plan ID of the course */
  studyPlanId: Scalars['String']['input'];
  /** Subject ID of the course */
  subjectId: Scalars['String']['input'];
  /** Teacher ID of the course */
  teacherId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateDegreeInput = {
  /** Name of the degree */
  name: Scalars['String']['input'];
  /** School ID */
  schoolId: Scalars['String']['input'];
  /** Short name of the degree */
  shortName: Scalars['String']['input'];
};

export type CreateFileDownloadInput = {
  /** File ID to download */
  fileId: Scalars['String']['input'];
};

export type CreateFileInput = {
  /** MIME type of the file */
  mimeType: Scalars['String']['input'];
  /** Name of the file */
  name: Scalars['String']['input'];
  /** Size of the file in bytes */
  size: Scalars['Int']['input'];
  /** Storage key for the file */
  storageKey: Scalars['String']['input'];
};

export type CreateFileUploadInput = {
  /** Course ID for the upload */
  courseId: Scalars['String']['input'];
  /** Original file name */
  fileName: Scalars['String']['input'];
  /** MIME type of the file */
  mimeType: Scalars['String']['input'];
};

export type CreateGradeBucketInput = {
  /** Id del curso */
  courseId: Scalars['String']['input'];
  /** Nombre del bucket */
  name: Scalars['String']['input'];
  /** Peso del bucket */
  weight: Scalars['Float']['input'];
};

export type CreateGradeInput = {
  /** Id del bucket */
  bucketId: Scalars['String']['input'];
  /** Comentarios */
  comments: Scalars['String']['input'];
  /** Id del curso */
  courseId: Scalars['String']['input'];
  /** Fecha de la calificacion */
  date: Scalars['DateTime']['input'];
  /** Id del periodo */
  periodId: Scalars['String']['input'];
  /** ¿Publicada? */
  published?: Scalars['Boolean']['input'];
  /** Titulo de la calificacion   */
  title: Scalars['String']['input'];
};

export type CreateGroupChatInput = {
  /** Name of the group chat */
  name: Scalars['String']['input'];
  /** User IDs of initial participants (excluding creator) */
  participantIds: Array<Scalars['String']['input']>;
};

export type CreateGroupsScheduleInput = {
  /** Class group ID */
  classGroupId: Scalars['String']['input'];
  /** Course ID */
  courseId: Scalars['String']['input'];
  /** End time */
  endTime: Scalars['String']['input'];
  /** Location */
  location: Scalars['String']['input'];
  /** Remote */
  remote: Scalars['Boolean']['input'];
  /** Remote link */
  remoteLink: Scalars['String']['input'];
  /** Start time */
  startTime: Scalars['String']['input'];
  /** Week day */
  weekday: Scalars['String']['input'];
};

export type CreateInvitationAccessLinkResult = {
  __typename?: 'CreateInvitationAccessLinkResult';
  url: Scalars['String']['output'];
};

export type CreateMessageInput = {
  /** The content of the message. */
  content: Scalars['String']['input'];
  /** The ID of the parent message (for replies). */
  parentMessageId?: InputMaybe<Scalars['String']['input']>;
  /** The IDs of the recipients associated with the message. */
  recipientIds: Array<Scalars['String']['input']>;
  /** The subject of the message. */
  subject: Scalars['String']['input'];
};

export type CreateNewsletterInput = {
  /** Content of the newsletter (HTML) */
  content: Scalars['String']['input'];
  /** Whether to publish immediately */
  published?: InputMaybe<Scalars['Boolean']['input']>;
  /** School ID the newsletter belongs to */
  schoolId: Scalars['String']['input'];
  /** Title of the newsletter */
  title: Scalars['String']['input'];
};

export type CreateOrganizationInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type CreateParentInput = {
  /** Address of the parent */
  address?: Scalars['String']['input'];
  /** Document ID of the parent */
  documentId: Scalars['String']['input'];
  /** Email of the parent */
  email: Scalars['String']['input'];
  /** Father name (paternal last name) of the parent */
  fatherName: Scalars['String']['input'];
  /** First name of the parent */
  firstName: Scalars['String']['input'];
  /** Middle name of the parent */
  middleName?: Scalars['String']['input'];
  /** Mother name (maternal last name) of the parent */
  motherName?: Scalars['String']['input'];
  /** Occupation of the parent */
  occupation?: Scalars['String']['input'];
  /** Organization ID of the parent */
  organizationId: Scalars['String']['input'];
  /** Phone number of the parent */
  phone: Scalars['String']['input'];
  /** Relationship to student (Father, Mother, Guardian, etc.) */
  relationship: Scalars['String']['input'];
  /** IDs of students to associate with this parent */
  studentIds?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Work phone number of the parent */
  workPhone?: Scalars['String']['input'];
};

export type CreatePaymentInput = {
  amount: Scalars['Float']['input'];
  createdBy?: InputMaybe<Scalars['String']['input']>;
  paidAt: Scalars['DateTime']['input'];
  reference?: InputMaybe<Scalars['String']['input']>;
  studentId: Scalars['String']['input'];
};

export type CreatePeriodInput = {
  /** End date of the period */
  endDate: Scalars['DateTime']['input'];
  /** Name of the period */
  name: Scalars['String']['input'];
  /** Short name of the period */
  shortName?: Scalars['String']['input'];
  /** Start date of the period */
  startDate: Scalars['DateTime']['input'];
  /** Year of the period */
  year: Scalars['Int']['input'];
};

export type CreatePermissionInput = {
  description: Scalars['String']['input'];
  descriptiveId: Scalars['String']['input'];
};

export type CreateQuizInput = {
  /** Course ID */
  courseId: Scalars['String']['input'];
  /** Details */
  details: Scalars['String']['input'];
  /** Organization ID */
  organizationId: Scalars['String']['input'];
  /** Questions */
  questions: Array<CreateQuizQuestionInput>;
  /** Teacher ID */
  teacherId: Scalars['String']['input'];
  /** Title */
  title: Scalars['String']['input'];
};

export type CreateQuizQuestionInput = {
  /** Options */
  options: Array<CreateQuizQuestionOptionInput>;
  /** Question */
  question: Scalars['String']['input'];
  /** Time Limit */
  timeLimit?: Scalars['Float']['input'];
  /** Type */
  type: Scalars['String']['input'];
  /** Value */
  value: Scalars['String']['input'];
};

export type CreateQuizQuestionOptionInput = {
  /** Is Correct */
  isCorrect: Scalars['Boolean']['input'];
  /** Option */
  option: Scalars['String']['input'];
};

export type CreateRoleInput = {
  /** Description of the role */
  description: Scalars['String']['input'];
  /** Name of the role */
  name: Scalars['String']['input'];
  /** Organization ID of the role */
  organizationId?: InputMaybe<Scalars['String']['input']>;
  /** Permissions of the role */
  permissionIds: Array<Scalars['String']['input']>;
};

export type CreateSchoolInput = {
  /** Address of the school */
  address?: Scalars['String']['input'];
  /** City of the school */
  city?: Scalars['String']['input'];
  /** Country of the school */
  country?: Scalars['String']['input'];
  /** Current year of the school */
  currentYear?: Scalars['Int']['input'];
  /** Email of the school */
  email?: Scalars['String']['input'];
  /** Logo of the school */
  logo?: Scalars['String']['input'];
  /** Name of the school */
  name: Scalars['String']['input'];
  /** Organization ID of the school */
  organizationId?: InputMaybe<Scalars['String']['input']>;
  /** Phone number of the school */
  phone?: Scalars['String']['input'];
  /** Primary brand color (hex, e.g. #3b82f6) */
  primaryColor?: InputMaybe<Scalars['String']['input']>;
  /** Secondary brand color (hex) */
  secondaryColor?: InputMaybe<Scalars['String']['input']>;
  /** Short name of the school */
  shortName: Scalars['String']['input'];
  /** URL slug for the school store (optional; auto-generated if omitted) */
  slug?: InputMaybe<Scalars['String']['input']>;
  /** State of the school */
  state?: Scalars['String']['input'];
  /** Tertiary/accent brand color (hex) */
  tertiaryColor?: InputMaybe<Scalars['String']['input']>;
  /** Website of the school */
  website?: Scalars['String']['input'];
  /** Zip code of the school */
  zip?: Scalars['String']['input'];
};

export type CreateSchoolResult = {
  __typename?: 'CreateSchoolResult';
  accessToken: Scalars['String']['output'];
  schoolId: Scalars['String']['output'];
};

export type CreateSchoolWithOrgInput = {
  /** Name of the school */
  schoolName: Scalars['String']['input'];
  /** Short name of the school */
  schoolShortName: Scalars['String']['input'];
};

export type CreateStoreCategoryInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  schoolId: Scalars['String']['input'];
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateStoreProductInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  price: Scalars['Float']['input'];
  schoolId: Scalars['String']['input'];
  stock: Scalars['Int']['input'];
};

export type CreateStudentGradeInput = {
  /** Comments for the student grade */
  comments: Scalars['String']['input'];
  /** Grade ID for the student grade */
  gradeId: Scalars['String']['input'];
  /** Score for the student grade */
  score: Scalars['Float']['input'];
  /** Student ID for the student grade */
  studentId: Scalars['String']['input'];
};

export type CreateStudentInput = {
  /** Address of the student */
  address: Scalars['String']['input'];
  /** Allergies of the student */
  allergies?: InputMaybe<Scalars['String']['input']>;
  /** Birth date of the student */
  birthDate: Scalars['DateTime']['input'];
  /** Blood type of the student */
  bloodType?: InputMaybe<Scalars['String']['input']>;
  /** Class group ID of the student */
  classGroupId?: InputMaybe<Scalars['String']['input']>;
  /** Document ID of the student */
  documentId: Scalars['String']['input'];
  /** Email of the student */
  email: Scalars['String']['input'];
  /** Emergency contact name */
  emergencyContactName?: InputMaybe<Scalars['String']['input']>;
  /** Emergency contact phone */
  emergencyContactPhone?: InputMaybe<Scalars['String']['input']>;
  /** Enrollment status of the student */
  enrollmentStatus?: InputMaybe<Scalars['String']['input']>;
  /** Father name of the student */
  fatherName: Scalars['String']['input'];
  /** First name of the student */
  firstName: Scalars['String']['input'];
  /** Gender of the student */
  gender: Scalars['String']['input'];
  /** Medical notes of the student */
  medicalNotes?: InputMaybe<Scalars['String']['input']>;
  /** Middle name of the student */
  middleName: Scalars['String']['input'];
  /** Mother name of the student */
  motherName: Scalars['String']['input'];
  /** Organization ID of the student */
  organizationId: Scalars['String']['input'];
  /** IDs of parents to associate with this student */
  parentIds?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Phone of the student */
  phone: Scalars['String']['input'];
  /** School ID of the student */
  schoolId: Scalars['String']['input'];
};

export type CreateStudyPlanInput = {
  /** Degree ID of the study plan */
  degreeId: Scalars['String']['input'];
  /** Description of the study plan */
  description: Scalars['String']['input'];
  /** Grade metric ID of the study plan */
  gradeMetricId: Scalars['String']['input'];
  /** Level of the study plan */
  level: Scalars['Int']['input'];
  /** Name of the study plan */
  name: Scalars['String']['input'];
  /** School ID of the study plan */
  schoolId: Scalars['String']['input'];
  /** Short name of the study plan */
  shortName: Scalars['String']['input'];
};

export type CreateSubjectInput = {
  /** Code of the subject */
  code: Scalars['String']['input'];
  /** Name of the subject */
  name: Scalars['String']['input'];
};

export type CreateSubmissionUploadInput = {
  /** Assignment ID */
  assignmentId: Scalars['String']['input'];
  /** File name */
  fileName: Scalars['String']['input'];
  /** MIME type of the file */
  mimeType: Scalars['String']['input'];
};

export type CreateTeacherInput = {
  about?: InputMaybe<Scalars['String']['input']>;
  address?: InputMaybe<Scalars['String']['input']>;
  /** Birth date of the teacher */
  birthDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** Document ID of the teacher */
  documentId: Scalars['String']['input'];
  /** Email of the teacher */
  email: Scalars['String']['input'];
  /** Father name of the teacher */
  fatherName: Scalars['String']['input'];
  /** First name of the teacher */
  firstName: Scalars['String']['input'];
  /** Gender of the teacher */
  gender: Scalars['String']['input'];
  memberSince?: InputMaybe<Scalars['DateTime']['input']>;
  /** Middle name of the teacher */
  middleName?: InputMaybe<Scalars['String']['input']>;
  /** Mother name of the teacher */
  motherName?: InputMaybe<Scalars['String']['input']>;
  /** Organization ID of the teacher */
  organizationId: Scalars['String']['input'];
  personalEmail?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  teacherSince?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateUserInput = {
  /** Email of the user */
  email: Scalars['String']['input'];
  /** First name of the user */
  firstName: Scalars['String']['input'];
  /** Last name of the user */
  lastName: Scalars['String']['input'];
  /** Organization ID of the user */
  organizationId?: InputMaybe<Scalars['String']['input']>;
  /** Password of the user */
  password: Scalars['String']['input'];
  /** Role ID of the user */
  roleId: Scalars['String']['input'];
};

export type Degree = {
  __typename?: 'Degree';
  /** Created at of the degree */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the degree */
  id: Scalars['String']['output'];
  /** Name of the degree */
  name: Scalars['String']['output'];
  /** School of the degree */
  school: School;
  /** School ID of the degree */
  schoolId: Scalars['String']['output'];
  /** Short name of the degree */
  shortName: Scalars['String']['output'];
  /** Study plans of the degree */
  studyPlans: Array<StudyPlan>;
  /** Updated at of the degree */
  updatedAt: Scalars['DateTime']['output'];
};

export type EnrollmentCostInput = {
  amount: Scalars['Float']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  order?: Scalars['Int']['input'];
};

/** The enrollment status of a student */
export enum EnrollmentStatus {
  Active = 'ACTIVE',
  Candidate = 'CANDIDATE',
  Retired = 'RETIRED'
}

export type File = {
  __typename?: 'File';
  /** Effective access for the current user */
  access?: Maybe<Scalars['String']['output']>;
  /** Created at */
  createdAt: Scalars['DateTime']['output'];
  /** Deleted at */
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** ID of the file */
  id: Scalars['String']['output'];
  /** MIME type of the file */
  mimeType: Scalars['String']['output'];
  /** Name of the file */
  name: Scalars['String']['output'];
  /** Organization ID of the file */
  organizationId: Scalars['String']['output'];
  /** Owner of the file */
  owner: User;
  /** Owner ID of the file */
  ownerId: Scalars['String']['output'];
  /** Class group shares for the file */
  sharesClassGroups: Array<FileShareClassGroup>;
  /** Course shares for the file */
  sharesCourses: Array<FileShareCourse>;
  /** School shares for the file */
  sharesSchools: Array<FileShareSchool>;
  /** User shares for the file */
  sharesUsers: Array<FileShareUser>;
  /** Size of the file in bytes */
  size: Scalars['Int']['output'];
  /** Storage key for the file */
  storageKey: Scalars['String']['output'];
  /** Updated at */
  updatedAt: Scalars['DateTime']['output'];
};

export type FileDownloadUrl = {
  __typename?: 'FileDownloadUrl';
  /** Presigned download URL */
  downloadUrl: Scalars['String']['output'];
};

export type FileShareClassGroup = {
  __typename?: 'FileShareClassGroup';
  /** Class group for the share */
  classGroup: ClassGroup;
  /** Class group ID of the share */
  classGroupId: Scalars['String']['output'];
  /** Created at */
  createdAt: Scalars['DateTime']['output'];
  /** File ID of the share */
  fileId: Scalars['String']['output'];
  /** ID of the file share */
  id: Scalars['String']['output'];
  /** Permission for the share */
  permission: Scalars['String']['output'];
  /** Updated at */
  updatedAt: Scalars['DateTime']['output'];
};

export type FileShareCourse = {
  __typename?: 'FileShareCourse';
  /** Course for the share */
  course: Course;
  /** Course ID of the share */
  courseId: Scalars['String']['output'];
  /** Created at */
  createdAt: Scalars['DateTime']['output'];
  /** File ID of the share */
  fileId: Scalars['String']['output'];
  /** ID of the file share */
  id: Scalars['String']['output'];
  /** Permission for the share */
  permission: Scalars['String']['output'];
  /** Updated at */
  updatedAt: Scalars['DateTime']['output'];
};

export type FileShareSchool = {
  __typename?: 'FileShareSchool';
  /** Created at */
  createdAt: Scalars['DateTime']['output'];
  /** File ID of the share */
  fileId: Scalars['String']['output'];
  /** ID of the file share */
  id: Scalars['String']['output'];
  /** Permission for the share */
  permission: Scalars['String']['output'];
  /** School for the share */
  school: School;
  /** School ID of the share */
  schoolId: Scalars['String']['output'];
  /** Updated at */
  updatedAt: Scalars['DateTime']['output'];
};

export type FileShareUser = {
  __typename?: 'FileShareUser';
  /** Created at */
  createdAt: Scalars['DateTime']['output'];
  /** File ID of the share */
  fileId: Scalars['String']['output'];
  /** ID of the file share */
  id: Scalars['String']['output'];
  /** Permission for the share */
  permission: Scalars['String']['output'];
  /** Updated at */
  updatedAt: Scalars['DateTime']['output'];
  /** User for the share */
  user: User;
  /** User ID of the share */
  userId: Scalars['String']['output'];
};

export type FileUploadUrl = {
  __typename?: 'FileUploadUrl';
  /** Storage key for the file */
  storageKey: Scalars['String']['output'];
  /** Presigned upload URL */
  uploadUrl: Scalars['String']['output'];
};

export type Grade = {
  __typename?: 'Grade';
  /** Bucket de la calificacion */
  bucket: GradeBucket;
  /** ID del bucket */
  bucketId: Scalars['String']['output'];
  /** Comentarios de la calificacion */
  comments?: Maybe<Scalars['String']['output']>;
  /** Curso de la calificacion */
  course: Course;
  /** ID del curso */
  courseId: Scalars['String']['output'];
  /** Fecha de creacion */
  createdAt: Scalars['DateTime']['output'];
  /** Fecha de la calificacion */
  date: Scalars['DateTime']['output'];
  /** ID de la calificacion */
  id: Scalars['String']['output'];
  /** Periodo de la calificacion */
  period: Period;
  /** ID del periodo */
  periodId: Scalars['String']['output'];
  /** ¿Publicada? */
  published: Scalars['Boolean']['output'];
  /** Estudiantes de la calificacion */
  studentGrades: Array<StudentGrade>;
  /** Titulo de la calificacion */
  title: Scalars['String']['output'];
  /** Fecha de actualizacion */
  updatedAt: Scalars['DateTime']['output'];
};

export type GradeBucket = {
  __typename?: 'GradeBucket';
  /** Id del curso */
  courseId: Scalars['String']['output'];
  /** Fecha de creación */
  createdAt: Scalars['DateTime']['output'];
  /** Id del bucket */
  id: Scalars['String']['output'];
  /** Nombre del bucket */
  name: Scalars['String']['output'];
  /** Fecha de actualización */
  updatedAt: Scalars['DateTime']['output'];
  /** Peso del bucket */
  weight: Scalars['Float']['output'];
};

export type GradeMetric = {
  __typename?: 'GradeMetric';
  /** Fecha de creacion */
  createdAt: Scalars['DateTime']['output'];
  /** ID */
  id: Scalars['String']['output'];
  /** Maximo */
  maximum: Scalars['Float']['output'];
  /** Minimo */
  minimum: Scalars['Float']['output'];
  /** Minimo de aprobacion */
  minimumApproval: Scalars['Float']['output'];
  /** Minimo de excelencia */
  minimumExcellence: Scalars['Float']['output'];
  /** Nombre */
  name: Scalars['String']['output'];
  /** Fecha de actualizacion */
  updatedAt: Scalars['DateTime']['output'];
};

export type GradeReport = {
  __typename?: 'GradeReport';
  /** Attendance per course per period */
  attendanceRows: Array<GradeReportAttendanceRow>;
  /** Class group name */
  classGroupName?: Maybe<Scalars['String']['output']>;
  /** Student document ID */
  documentId: Scalars['String']['output'];
  /** Grades per course */
  gradesRows: Array<GradeReportGradesRow>;
  /** Habit metrics so far */
  habitRows: Array<GradeReportHabitRow>;
  /** Study plan level */
  level?: Maybe<Scalars['Int']['output']>;
  /** Overall averages row */
  overallGradesRow?: Maybe<GradeReportOverallRow>;
  /** Period name for the report */
  periodName: Scalars['String']['output'];
  /** All periods in the school year */
  periods: Array<GradeReportPeriodInfo>;
  /** Presigned URL for the school logo */
  schoolLogoUrl?: Maybe<Scalars['String']['output']>;
  /** School name */
  schoolName: Scalars['String']['output'];
  /** Student full name */
  studentName: Scalars['String']['output'];
  /** Study plan name */
  studyPlanName?: Maybe<Scalars['String']['output']>;
  /** Teacher name (class group homeroom teacher) */
  teacherName?: Maybe<Scalars['String']['output']>;
};

export type GradeReportAttendanceRow = {
  __typename?: 'GradeReportAttendanceRow';
  /** Course ID */
  courseId: Scalars['String']['output'];
  /** Course name (subject name) */
  courseName: Scalars['String']['output'];
  /** Attendance per period */
  periodAttendance: Array<GradeReportPeriodAttendance>;
};

export type GradeReportGradesRow = {
  __typename?: 'GradeReportGradesRow';
  /** Course ID */
  courseId: Scalars['String']['output'];
  /** Course name (subject name) */
  courseName: Scalars['String']['output'];
  /** Cumulative average (periods 1 through selected) */
  cumulativeAverage?: Maybe<Scalars['Float']['output']>;
  /** Period averages - null for future periods */
  periodAverages: Array<Maybe<Scalars['Float']['output']>>;
};

export type GradeReportHabitRow = {
  __typename?: 'GradeReportHabitRow';
  /** Habit metric name */
  metricName: Scalars['String']['output'];
  /** Value: X (Deficiente), R (Regular), S (Satisfactorio) */
  value: Scalars['String']['output'];
};

export type GradeReportOverallRow = {
  __typename?: 'GradeReportOverallRow';
  /** Overall cumulative average */
  cumulativeAverage?: Maybe<Scalars['Float']['output']>;
  /** Overall average per period - null for future */
  periodAverages: Array<Maybe<Scalars['Float']['output']>>;
};

export type GradeReportPeriodAttendance = {
  __typename?: 'GradeReportPeriodAttendance';
  /** Absent count for this period */
  absent: Scalars['Int']['output'];
  /** Late count for this period */
  late: Scalars['Int']['output'];
  /** Period ID */
  periodId: Scalars['String']['output'];
};

export type GradeReportPeriodInfo = {
  __typename?: 'GradeReportPeriodInfo';
  /** Period ID */
  id: Scalars['String']['output'];
  /** Period name */
  name: Scalars['String']['output'];
  /** Period short name */
  shortName: Scalars['String']['output'];
};

export type GroupsSchedule = {
  __typename?: 'GroupsSchedule';
  /** Class group of the groups schedule */
  classGroup: ClassGroup;
  /** Class group ID of the groups schedule */
  classGroupId: Scalars['String']['output'];
  /** Course of the groups schedule */
  course: Course;
  /** Course ID of the groups schedule */
  courseId: Scalars['String']['output'];
  /** Created at of the groups schedule */
  createdAt: Scalars['DateTime']['output'];
  /** End time of the groups schedule */
  endTime: Scalars['String']['output'];
  /** ID of the groups schedule */
  id: Scalars['String']['output'];
  /** Location of the groups schedule */
  location: Scalars['String']['output'];
  /** Recess of the groups schedule */
  recess: Scalars['Boolean']['output'];
  /** Remote of the groups schedule */
  remote: Scalars['Boolean']['output'];
  /** Remote link of the groups schedule */
  remoteLink: Scalars['String']['output'];
  /** Start time of the groups schedule */
  startTime: Scalars['String']['output'];
  /** Updated at of the groups schedule */
  updatedAt: Scalars['DateTime']['output'];
  /** Week day of the groups schedule */
  weekday: Scalars['String']['output'];
};

export type HabitEvaluation = {
  __typename?: 'HabitEvaluation';
  classGroupId: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  habitMetricId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  periodId: Scalars['String']['output'];
  published: Scalars['Boolean']['output'];
  studentEvaluations: Array<StudentHabitEvaluation>;
  teacherId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type HabitMetric = {
  __typename?: 'HabitMetric';
  /** Estado activo del criterio */
  active: Scalars['Boolean']['output'];
  /** Fecha de creación */
  createdAt: Scalars['DateTime']['output'];
  /** Descripción del criterio */
  description?: Maybe<Scalars['String']['output']>;
  /** ID del criterio */
  id: Scalars['String']['output'];
  /** Nombre del criterio */
  name: Scalars['String']['output'];
  /** Orden de visualización */
  order: Scalars['Int']['output'];
  /** Fecha de actualización */
  updatedAt: Scalars['DateTime']['output'];
};

/** Valores de evaluación de hábitos */
export enum HabitValue {
  /** Desempeño regular */
  R = 'R',
  /** Desempeño satisfactorio */
  S = 'S',
  /** Desempeño deficiente */
  X = 'X'
}

export type Invitation = {
  __typename?: 'Invitation';
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  expiresAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  inviterId: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  role: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type JoinRequestResult = {
  __typename?: 'JoinRequestResult';
  message: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type JoinRequestStatus = {
  __typename?: 'JoinRequestStatus';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  requestedRole: Scalars['String']['output'];
  schoolName?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
};

export type LookupAccountForPasswordResetResult = {
  __typename?: 'LookupAccountForPasswordResetResult';
  displayName?: Maybe<Scalars['String']['output']>;
  found: Scalars['Boolean']['output'];
  organizationName?: Maybe<Scalars['String']['output']>;
  roleLabel?: Maybe<Scalars['String']['output']>;
};

export type Member = {
  __typename?: 'Member';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  role: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

export type Message = {
  __typename?: 'Message';
  /** The content of the message. */
  content: Scalars['String']['output'];
  /** The date and time the message was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The date and time the message was deleted. */
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The unique identifier for the message. */
  id: Scalars['String']['output'];
  /** The ID of the organization associated with the message. */
  organizationId: Scalars['String']['output'];
  /** The ID of the parent message (for replies). */
  parentMessageId?: Maybe<Scalars['String']['output']>;
  /** The recipients of the message. */
  recipients: Array<MessageRecipient>;
  replies: Array<Message>;
  /** The sender associated with the message. */
  sender: User;
  /** The ID of the sender associated with the message. */
  senderId?: Maybe<Scalars['String']['output']>;
  /** The subject of the message. */
  subject: Scalars['String']['output'];
  /** The date and time the message was last updated. */
  updatedAt: Scalars['DateTime']['output'];
};

export type MessageRecipient = {
  __typename?: 'MessageRecipient';
  /** The date and time the message recipient was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The date and time the message recipient was deleted. */
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The unique identifier for the message recipient. */
  id: Scalars['String']['output'];
  /** The message associated with the message recipient. */
  message: Message;
  /** The ID of the message associated with the message recipient. */
  messageId: Scalars['String']['output'];
  /** The date and time the message was read. */
  readAt?: Maybe<Scalars['DateTime']['output']>;
  /** The date and time the message recipient was last updated. */
  updatedAt: Scalars['DateTime']['output'];
  /** The user associated with the message recipient. */
  user: User;
  /** The ID of the user associated with the message recipient. */
  userId: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  acceptInvitation: Scalars['Boolean']['output'];
  addChatParticipants: Chat;
  addToStoreCart: StoreCartItem;
  approveJoinRequest: Scalars['Boolean']['output'];
  cancelInvitation: Scalars['Boolean']['output'];
  changePassword: Scalars['Boolean']['output'];
  checkoutStore: StoreOrder;
  clearStoreCart: Scalars['Boolean']['output'];
  completeOnboarding: Scalars['Boolean']['output'];
  createAssignment: Assignment;
  /** Create an assignment submission after file upload */
  createAssignmentSubmission: AssignmentSubmission;
  createAttendanceSession: AttendanceSession;
  createCharge: Array<Charge>;
  createClassGroup: ClassGroup;
  createContextualChat: Chat;
  createCourse: Course;
  createDegree: Degree;
  createDirectChat: Chat;
  createFile: File;
  createFileDownloadUrl: FileDownloadUrl;
  createFileUploadUrl: FileUploadUrl;
  createGrade: Grade;
  createGradeBucket: GradeBucket;
  createGroupChat: Chat;
  createGroupsSchedule: GroupsSchedule;
  createInvitationAccessLink: CreateInvitationAccessLinkResult;
  createMessage: Message;
  createNewsletter: Newsletter;
  createOrganization: Organization;
  createParent: Parent;
  createPayment: Payment;
  createPeriod: Period;
  createPermission: Permission;
  createQuiz: Quiz;
  createRole: Role;
  createSchool: School;
  /** Create a presigned URL for uploading a school logo */
  createSchoolLogoUploadUrl: SchoolLogoUploadUrl;
  createSchoolWithOrganization: CreateSchoolResult;
  createStoreCategory: StoreCategory;
  createStoreProduct: StoreProduct;
  createStudent: Student;
  createStudentGrade: StudentGrade;
  createStudyPlan: StudyPlan;
  createSubject: Subject;
  /** Create a presigned URL for downloading a submission file */
  createSubmissionDownloadUrl: SubmissionDownloadUrl;
  /** Create a presigned URL for uploading a submission file */
  createSubmissionUploadUrl: SubmissionUploadUrl;
  createTeacher: Teacher;
  createUser: User;
  /** Delete an assignment submission */
  deleteAssignmentSubmission: Scalars['Boolean']['output'];
  deleteAttendanceSession: AttendanceSession;
  deleteStoreCategory: Scalars['Boolean']['output'];
  deleteStoreProduct: Scalars['Boolean']['output'];
  inviteMember: Invitation;
  leaveChat: Scalars['Boolean']['output'];
  login: AuthPayload;
  markChatRead?: Maybe<ChatParticipant>;
  markMessageAsRead?: Maybe<MessageRecipient>;
  markNotificationRead: Scalars['Boolean']['output'];
  processStorePayment: StoreOrder;
  rejectInvitation: Scalars['Boolean']['output'];
  removeAssignment: Assignment;
  removeCharge?: Maybe<Charge>;
  removeClassGroup: ClassGroup;
  removeCourse: Course;
  removeDegree: Degree;
  removeGrade: Grade;
  removeGradeBucket: GradeBucket;
  removeGroupsSchedule: GroupsSchedule;
  removeMember: Scalars['Boolean']['output'];
  removeMessage: Message;
  removeMessageRecipient: MessageRecipient;
  removeNewsletter: Newsletter;
  removeOrganization: Organization;
  removeParent: Parent;
  removePeriod: Period;
  removePermission: Permission;
  removeQuiz: Quiz;
  removeRole: Role;
  removeSchool: School;
  removeShare: File;
  removeStoreCartItem: Scalars['Boolean']['output'];
  removeStudent: Student;
  removeStudentGrade: StudentGrade;
  removeStudyPlan: StudyPlan;
  removeSubject: Subject;
  removeTeacher: Teacher;
  removeUser: User;
  requestJoinSchool: JoinRequestResult;
  requestPasswordReset: Scalars['Boolean']['output'];
  resendUserInvitation: Scalars['Boolean']['output'];
  resetPassword: AuthPayload;
  saveHabitEvaluation: HabitEvaluation;
  sendMessage: ChatMessage;
  sendVerificationLink: Scalars['Boolean']['output'];
  setActiveOrganization: Scalars['Boolean']['output'];
  shareFile: File;
  signOut: Scalars['Boolean']['output'];
  signUp: AuthPayload;
  updateAssignment: Assignment;
  updateAttendanceRecord: AttendanceRecord;
  updateAttendanceRecords: Array<AttendanceRecord>;
  updateClassGroup: ClassGroup;
  updateCourse: Course;
  updateDegree: Degree;
  updateGrade: Grade;
  updateGradeBucket: GradeBucket;
  updateGroupsSchedule: GroupsSchedule;
  updateMemberRole: Scalars['Boolean']['output'];
  updateNewsletter: Newsletter;
  updateOrganization: Organization;
  updateParent: Parent;
  updatePeriod: Period;
  updatePermission: Permission;
  updateQuiz: Quiz;
  updateRole: Role;
  updateSchool: School;
  /** Update only the logo of a school */
  updateSchoolLogo: School;
  updateShare: File;
  updateStoreCartItem: StoreCartItem;
  updateStoreCategory: StoreCategory;
  updateStoreOrderStatus: StoreOrder;
  updateStoreProduct: StoreProduct;
  updateStudent: Student;
  updateStudentGrade: StudentGrade;
  updateStudyPlan: StudyPlan;
  updateStudyPlanFinancialConfig: StudyPlan;
  updateSubject: Subject;
  updateTeacher: Teacher;
  updateThemePreference: User;
  updateUser: User;
};


export type MutationAcceptInvitationArgs = {
  invitationId: Scalars['String']['input'];
};


export type MutationAddChatParticipantsArgs = {
  input: AddChatParticipantsInput;
};


export type MutationAddToStoreCartArgs = {
  input: AddToCartInput;
};


export type MutationApproveJoinRequestArgs = {
  approve: Scalars['Boolean']['input'];
  requestId: Scalars['String']['input'];
};


export type MutationCancelInvitationArgs = {
  invitationId: Scalars['String']['input'];
};


export type MutationChangePasswordArgs = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};


export type MutationCheckoutStoreArgs = {
  input: CheckoutStoreInput;
};


export type MutationClearStoreCartArgs = {
  schoolId: Scalars['String']['input'];
};


export type MutationCreateAssignmentArgs = {
  createAssignmentInput: CreateAssignmentInput;
};


export type MutationCreateAssignmentSubmissionArgs = {
  input: CreateAssignmentSubmissionInput;
};


export type MutationCreateAttendanceSessionArgs = {
  input: CreateAttendanceSessionInput;
};


export type MutationCreateChargeArgs = {
  input: CreateChargeInput;
};


export type MutationCreateClassGroupArgs = {
  createClassGroupInput: CreateClassGroupInput;
};


export type MutationCreateContextualChatArgs = {
  input: CreateContextualChatInput;
};


export type MutationCreateCourseArgs = {
  createCourseInput: CreateCourseInput;
};


export type MutationCreateDegreeArgs = {
  createDegreeInput: CreateDegreeInput;
};


export type MutationCreateDirectChatArgs = {
  recipientId: Scalars['String']['input'];
};


export type MutationCreateFileArgs = {
  createFileInput: CreateFileInput;
};


export type MutationCreateFileDownloadUrlArgs = {
  createFileDownloadInput: CreateFileDownloadInput;
};


export type MutationCreateFileUploadUrlArgs = {
  createFileUploadInput: CreateFileUploadInput;
};


export type MutationCreateGradeArgs = {
  createGradeInput: CreateGradeInput;
};


export type MutationCreateGradeBucketArgs = {
  createGradeBucketInput: CreateGradeBucketInput;
};


export type MutationCreateGroupChatArgs = {
  input: CreateGroupChatInput;
};


export type MutationCreateGroupsScheduleArgs = {
  createGroupsScheduleInput: CreateGroupsScheduleInput;
};


export type MutationCreateInvitationAccessLinkArgs = {
  email: Scalars['String']['input'];
};


export type MutationCreateMessageArgs = {
  createMessageInput: CreateMessageInput;
};


export type MutationCreateNewsletterArgs = {
  createNewsletterInput: CreateNewsletterInput;
};


export type MutationCreateOrganizationArgs = {
  createOrganizationInput: CreateOrganizationInput;
};


export type MutationCreateParentArgs = {
  createParentInput: CreateParentInput;
};


export type MutationCreatePaymentArgs = {
  input: CreatePaymentInput;
};


export type MutationCreatePeriodArgs = {
  createPeriodInput: CreatePeriodInput;
};


export type MutationCreatePermissionArgs = {
  createPermissionInput: CreatePermissionInput;
};


export type MutationCreateQuizArgs = {
  createQuizInput: CreateQuizInput;
};


export type MutationCreateRoleArgs = {
  createRoleInput: CreateRoleInput;
};


export type MutationCreateSchoolArgs = {
  createSchoolInput: CreateSchoolInput;
};


export type MutationCreateSchoolLogoUploadUrlArgs = {
  input: SchoolLogoUploadInput;
};


export type MutationCreateSchoolWithOrganizationArgs = {
  input: CreateSchoolWithOrgInput;
};


export type MutationCreateStoreCategoryArgs = {
  input: CreateStoreCategoryInput;
};


export type MutationCreateStoreProductArgs = {
  input: CreateStoreProductInput;
};


export type MutationCreateStudentArgs = {
  createStudentInput: CreateStudentInput;
};


export type MutationCreateStudentGradeArgs = {
  createStudentGradeInput: CreateStudentGradeInput;
};


export type MutationCreateStudyPlanArgs = {
  createStudyPlanInput: CreateStudyPlanInput;
};


export type MutationCreateSubjectArgs = {
  createSubjectInput: CreateSubjectInput;
};


export type MutationCreateSubmissionDownloadUrlArgs = {
  fileId: Scalars['String']['input'];
};


export type MutationCreateSubmissionUploadUrlArgs = {
  input: CreateSubmissionUploadInput;
};


export type MutationCreateTeacherArgs = {
  createTeacherInput: CreateTeacherInput;
};


export type MutationCreateUserArgs = {
  createUserInput: CreateUserInput;
};


export type MutationDeleteAssignmentSubmissionArgs = {
  submissionId: Scalars['String']['input'];
};


export type MutationDeleteAttendanceSessionArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteStoreCategoryArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteStoreProductArgs = {
  id: Scalars['String']['input'];
};


export type MutationInviteMemberArgs = {
  email: Scalars['String']['input'];
  organizationId?: InputMaybe<Scalars['String']['input']>;
  role: Scalars['String']['input'];
};


export type MutationLeaveChatArgs = {
  chatId: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationMarkChatReadArgs = {
  chatId: Scalars['String']['input'];
};


export type MutationMarkMessageAsReadArgs = {
  messageId: Scalars['String']['input'];
};


export type MutationMarkNotificationReadArgs = {
  notificationId: Scalars['String']['input'];
};


export type MutationProcessStorePaymentArgs = {
  input: ProcessStorePaymentInput;
};


export type MutationRejectInvitationArgs = {
  invitationId: Scalars['String']['input'];
};


export type MutationRemoveAssignmentArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveChargeArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveClassGroupArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveCourseArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveDegreeArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveGradeArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveGradeBucketArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveGroupsScheduleArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveMemberArgs = {
  memberIdOrEmail: Scalars['String']['input'];
  organizationId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRemoveMessageArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveMessageRecipientArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveNewsletterArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveOrganizationArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveParentArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemovePeriodArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemovePermissionArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveQuizArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveRoleArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveSchoolArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveShareArgs = {
  removeShareInput: RemoveShareInput;
};


export type MutationRemoveStoreCartItemArgs = {
  cartItemId: Scalars['String']['input'];
};


export type MutationRemoveStudentArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveStudentGradeArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveStudyPlanArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveSubjectArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveTeacherArgs = {
  id: Scalars['String']['input'];
};


export type MutationRemoveUserArgs = {
  id: Scalars['String']['input'];
};


export type MutationRequestJoinSchoolArgs = {
  input: RequestJoinSchoolInput;
};


export type MutationRequestPasswordResetArgs = {
  email: Scalars['String']['input'];
};


export type MutationResendUserInvitationArgs = {
  email: Scalars['String']['input'];
};


export type MutationResetPasswordArgs = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type MutationSaveHabitEvaluationArgs = {
  saveHabitEvaluationInput: SaveHabitEvaluationInput;
};


export type MutationSendMessageArgs = {
  input: SendMessageInput;
};


export type MutationSendVerificationLinkArgs = {
  email: Scalars['String']['input'];
};


export type MutationSetActiveOrganizationArgs = {
  organizationId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationShareFileArgs = {
  shareFileInput: ShareFileInput;
};


export type MutationSignUpArgs = {
  input: SignUpInput;
};


export type MutationUpdateAssignmentArgs = {
  updateAssignmentInput: UpdateAssignmentInput;
};


export type MutationUpdateAttendanceRecordArgs = {
  input: UpdateAttendanceRecordInput;
};


export type MutationUpdateAttendanceRecordsArgs = {
  inputs: Array<UpdateAttendanceRecordInput>;
};


export type MutationUpdateClassGroupArgs = {
  updateClassGroupInput: UpdateClassGroupInput;
};


export type MutationUpdateCourseArgs = {
  updateCourseInput: UpdateCourseInput;
};


export type MutationUpdateDegreeArgs = {
  updateDegreeInput: UpdateDegreeInput;
};


export type MutationUpdateGradeArgs = {
  updateGradeInput: UpdateGradeInput;
};


export type MutationUpdateGradeBucketArgs = {
  updateGradeBucketInput: UpdateGradeBucketInput;
};


export type MutationUpdateGroupsScheduleArgs = {
  updateGroupsScheduleInput: UpdateGroupsScheduleInput;
};


export type MutationUpdateMemberRoleArgs = {
  memberId: Scalars['String']['input'];
  organizationId?: InputMaybe<Scalars['String']['input']>;
  role: Scalars['String']['input'];
};


export type MutationUpdateNewsletterArgs = {
  updateNewsletterInput: UpdateNewsletterInput;
};


export type MutationUpdateOrganizationArgs = {
  updateOrganizationInput: UpdateOrganizationInput;
};


export type MutationUpdateParentArgs = {
  updateParentInput: UpdateParentInput;
};


export type MutationUpdatePeriodArgs = {
  updatePeriodInput: UpdatePeriodInput;
};


export type MutationUpdatePermissionArgs = {
  updatePermissionInput: UpdatePermissionInput;
};


export type MutationUpdateQuizArgs = {
  updateQuizInput: UpdateQuizInput;
};


export type MutationUpdateRoleArgs = {
  updateRoleInput: UpdateRoleInput;
};


export type MutationUpdateSchoolArgs = {
  updateSchoolInput: UpdateSchoolInput;
};


export type MutationUpdateSchoolLogoArgs = {
  id: Scalars['String']['input'];
  logo: Scalars['String']['input'];
};


export type MutationUpdateShareArgs = {
  updateShareInput: UpdateShareInput;
};


export type MutationUpdateStoreCartItemArgs = {
  input: UpdateCartItemInput;
};


export type MutationUpdateStoreCategoryArgs = {
  input: UpdateStoreCategoryInput;
};


export type MutationUpdateStoreOrderStatusArgs = {
  input: UpdateStoreOrderStatusInput;
};


export type MutationUpdateStoreProductArgs = {
  input: UpdateStoreProductInput;
};


export type MutationUpdateStudentArgs = {
  updateStudentInput: UpdateStudentInput;
};


export type MutationUpdateStudentGradeArgs = {
  updateStudentGradeInput: UpdateStudentGradeInput;
};


export type MutationUpdateStudyPlanArgs = {
  updateStudyPlanInput: UpdateStudyPlanInput;
};


export type MutationUpdateStudyPlanFinancialConfigArgs = {
  input: UpdateStudyPlanFinancialInput;
};


export type MutationUpdateSubjectArgs = {
  updateSubjectInput: UpdateSubjectInput;
};


export type MutationUpdateTeacherArgs = {
  updateTeacherInput: UpdateTeacherInput;
};


export type MutationUpdateThemePreferenceArgs = {
  themePreference: Scalars['String']['input'];
};


export type MutationUpdateUserArgs = {
  updateUserInput: UpdateUserInput;
};

export type Newsletter = {
  __typename?: 'Newsletter';
  /** Author of the newsletter */
  author: User;
  /** Author user ID */
  authorId: Scalars['String']['output'];
  /** Content of the newsletter (HTML) */
  content: Scalars['String']['output'];
  /** Created at */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the newsletter */
  id: Scalars['String']['output'];
  /** Organization of the newsletter */
  organization: Organization;
  /** Organization ID */
  organizationId: Scalars['String']['output'];
  /** Whether the newsletter is published */
  published: Scalars['Boolean']['output'];
  /** Date when the newsletter was published */
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  /** School of the newsletter */
  school: School;
  /** School ID */
  schoolId: Scalars['String']['output'];
  /** Title of the newsletter */
  title: Scalars['String']['output'];
  /** Updated at */
  updatedAt: Scalars['DateTime']['output'];
};

export type NotificationItem = {
  __typename?: 'NotificationItem';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
  read: Scalars['Boolean']['output'];
  relatedId?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type OnboardingStatus = {
  __typename?: 'OnboardingStatus';
  coursesCount: Scalars['Int']['output'];
  degreesCount: Scalars['Int']['output'];
  groupsCount: Scalars['Int']['output'];
  onboardingCompleted: Scalars['Boolean']['output'];
  schoolId?: Maybe<Scalars['String']['output']>;
  schoolName?: Maybe<Scalars['String']['output']>;
  studyPlansCount: Scalars['Int']['output'];
};

export type Organization = {
  __typename?: 'Organization';
  /** Organization active status */
  active: Scalars['Boolean']['output'];
  /** Organization created at */
  createdAt: Scalars['DateTime']['output'];
  /** Organization description */
  description: Scalars['String']['output'];
  /** Organization id */
  id: Scalars['String']['output'];
  /** Organization logo */
  logo?: Maybe<Scalars['String']['output']>;
  /** Organization metadata */
  metadata?: Maybe<Scalars['String']['output']>;
  /** Organization name */
  name: Scalars['String']['output'];
  /** Whether onboarding has been completed */
  onboardingCompleted: Scalars['Boolean']['output'];
  /** Organization slug */
  slug?: Maybe<Scalars['String']['output']>;
  /** Organization updated at */
  updatedAt: Scalars['DateTime']['output'];
};

export type Parent = {
  __typename?: 'Parent';
  /** Address of the parent */
  address: Scalars['String']['output'];
  /** Created at timestamp */
  createdAt: Scalars['DateTime']['output'];
  /** Document ID of the parent */
  documentId: Scalars['String']['output'];
  /** Email of the parent */
  email: Scalars['String']['output'];
  /** Father name (paternal last name) of the parent */
  fatherName: Scalars['String']['output'];
  /** First name of the parent */
  firstName: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  /** ID of the parent */
  id: Scalars['String']['output'];
  /** Middle name of the parent */
  middleName: Scalars['String']['output'];
  /** Mother name (maternal last name) of the parent */
  motherName: Scalars['String']['output'];
  name: Scalars['String']['output'];
  /** Occupation of the parent */
  occupation: Scalars['String']['output'];
  /** Organization ID of the parent */
  organizationId: Scalars['String']['output'];
  /** Phone number of the parent */
  phone: Scalars['String']['output'];
  /** Relationship to student (Father, Mother, Guardian, etc.) */
  relationship: Scalars['String']['output'];
  /** Updated at timestamp */
  updatedAt: Scalars['DateTime']['output'];
  /** User ID linked to this parent */
  userId?: Maybe<Scalars['String']['output']>;
  /** Work phone number of the parent */
  workPhone: Scalars['String']['output'];
};

export type Payment = {
  __typename?: 'Payment';
  amount: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  paidAt: Scalars['DateTime']['output'];
  reference?: Maybe<Scalars['String']['output']>;
  student: Student;
  studentId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type PendingJoinRequest = {
  __typename?: 'PendingJoinRequest';
  createdAt: Scalars['DateTime']['output'];
  documentId?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  requestedRole: Scalars['String']['output'];
  schoolId: Scalars['String']['output'];
  schoolName: Scalars['String']['output'];
  status: Scalars['String']['output'];
  userEmail: Scalars['String']['output'];
  userFirstName: Scalars['String']['output'];
  userId: Scalars['String']['output'];
  userImage?: Maybe<Scalars['String']['output']>;
  userLastName: Scalars['String']['output'];
};

export type Period = {
  __typename?: 'Period';
  /** Created at */
  createdAt: Scalars['DateTime']['output'];
  /** End date of the period */
  endDate: Scalars['DateTime']['output'];
  /** ID of the period */
  id: Scalars['String']['output'];
  /** Name of the period */
  name: Scalars['String']['output'];
  /** Short name of the period */
  shortName: Scalars['String']['output'];
  /** Start date of the period */
  startDate: Scalars['DateTime']['output'];
  /** Updated at */
  updatedAt: Scalars['DateTime']['output'];
  /** Year of the period */
  year: Scalars['Int']['output'];
};

export type Permission = {
  __typename?: 'Permission';
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  descriptiveId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ProcessStorePaymentInput = {
  orderId: Scalars['String']['input'];
  simulateSuccess?: InputMaybe<Scalars['Boolean']['input']>;
};

export type PublicSchoolDirectoryEntry = {
  __typename?: 'PublicSchoolDirectoryEntry';
  currencyCode: Scalars['String']['output'];
  id: Scalars['String']['output'];
  /** School logo URL when set */
  logoUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  assignment: Assignment;
  assignmentDatesByCourseId: Array<AssignmentDateWithDetails>;
  assignmentDatesBySchoolId: Array<AssignmentDateWithDetails>;
  /** Get all submissions for an assignment (teachers/admins only) */
  assignmentSubmissions: Array<AssignmentSubmission>;
  assignments: Array<Assignment>;
  assignmentsByCourseId: Array<Assignment>;
  assignmentsBySchoolId: Array<Assignment>;
  attendanceRecordsByStudentId: Array<AttendanceRecord>;
  attendanceSession?: Maybe<AttendanceSession>;
  attendanceSessions: Array<AttendanceSession>;
  attendanceSessionsCount: Scalars['Int']['output'];
  availableSchools: Array<AvailableSchool>;
  averageCourseScoreForStudent: Scalars['Float']['output'];
  chargesBySchool: Array<Charge>;
  chargesByStudent: Array<Charge>;
  chat?: Maybe<Chat>;
  chatMessages: Array<ChatMessage>;
  chatUnreadCount: Scalars['Int']['output'];
  checkPendingInvitation: CheckPendingInvitationResult;
  classGroup: ClassGroup;
  classGroups: Array<ClassGroup>;
  classGroupsByCourseId: Array<ClassGroup>;
  classGroupsByOrganizationId: Array<ClassGroup>;
  classGroupsBySchoolId: Array<ClassGroup>;
  classGroupsCount: Scalars['Float']['output'];
  course: Course;
  courses: Array<Course>;
  coursesByGroupId: Array<Course>;
  coursesBySchoolId: Array<Course>;
  coursesByStudyPlanId: Array<Course>;
  coursesBySubjectId: Array<Course>;
  coursesCount: Scalars['Int']['output'];
  degree: Degree;
  degrees: Array<Degree>;
  degreesBySchoolId: Array<Degree>;
  degreesBySchoolIdCount: Scalars['Int']['output'];
  fileById: File;
  filesAccessible: Array<File>;
  filesForCourse: Array<File>;
  filesOwned: Array<File>;
  filesSharedWithMe: Array<File>;
  findContacts: Array<User>;
  findManyMessages: Array<MessageRecipient>;
  findManyMessagesCount: Scalars['Int']['output'];
  findManyNewslettersCount: Scalars['Int']['output'];
  findManyStudentsCount: Scalars['Int']['output'];
  findManySubjectsCount: Scalars['Int']['output'];
  findManyTeachersCount: Scalars['Int']['output'];
  findMessageById: Message;
  findMyMessages: Array<Message>;
  findSentMessagesCount: Scalars['Int']['output'];
  grade: Grade;
  gradeBucket: GradeBucket;
  gradeBucketsByCourseId: Array<GradeBucket>;
  gradeMetric: GradeMetric;
  gradeMetrics: Array<GradeMetric>;
  /** Get the grade report (Boletin de calificaciones) for a student and period */
  gradeReport: GradeReport;
  grades: Array<Grade>;
  gradesByCourseId: Array<Grade>;
  groupsSchedule: GroupsSchedule;
  groupsSchedules: Array<GroupsSchedule>;
  groupsSchedulesByClassGroupId: Array<GroupsSchedule>;
  groupsSchedulesByClassGroupIdGrouped: Array<GroupsSchedule>;
  habitEvaluation: HabitEvaluation;
  habitEvaluationsByGroup: Array<HabitEvaluation>;
  habitMetric: HabitMetric;
  habitMetrics: Array<HabitMetric>;
  isEmailVerified: Scalars['Boolean']['output'];
  linkedStudentsFinancialSummary: Array<StudentFinancialSummary>;
  listInvitations: Array<Invitation>;
  listMembers: Array<Member>;
  lookupAccountForPasswordReset: LookupAccountForPasswordResetResult;
  me: User;
  /** Get the current student submission for an assignment */
  myAssignmentSubmission?: Maybe<AssignmentSubmission>;
  myChats: Array<Chat>;
  myJoinRequestStatus?: Maybe<JoinRequestStatus>;
  myStoreCart: Array<StoreCartItem>;
  myStoreOrders: Array<StoreOrder>;
  newsletter?: Maybe<Newsletter>;
  newsletters: Array<Newsletter>;
  notifications: Array<NotificationItem>;
  onboardingStatus: OnboardingStatus;
  organization: Organization;
  organizations: Array<Organization>;
  parent: Parent;
  parents: Array<Parent>;
  parentsByStudentId: Array<Parent>;
  parentsCount: Scalars['Int']['output'];
  paymentsByStudent: Array<Payment>;
  pendingJoinRequests: Array<PendingJoinRequest>;
  period: Period;
  periods: Array<Period>;
  periodsByYear: Array<Period>;
  permission: Permission;
  permissions: Array<Permission>;
  permissionsCount: Scalars['Int']['output'];
  publicSchoolBySlug: PublicSchoolDirectoryEntry;
  publicSchoolsForStore: Array<PublicSchoolDirectoryEntry>;
  publicStoreCategories: Array<StoreCategory>;
  publicStoreProduct?: Maybe<StoreProduct>;
  publicStoreProducts: Array<StoreProduct>;
  publishedNewsletters: Array<Newsletter>;
  quiz: Quiz;
  quizzes: Array<Quiz>;
  role: Role;
  roles: Array<Role>;
  school: School;
  /** Get a presigned URL for downloading a school logo */
  schoolLogoDownloadUrl: SchoolLogoDownloadUrl;
  schools: Array<School>;
  storeCategories: Array<StoreCategory>;
  storeCategoriesAdmin: Array<StoreCategory>;
  storeOrder: StoreOrder;
  storeOrdersAdmin: Array<StoreOrder>;
  storeProduct?: Maybe<StoreProduct>;
  storeProducts: Array<StoreProduct>;
  storeProductsAdmin: Array<StoreProduct>;
  student: Student;
  studentAttendanceStats: AttendanceStats;
  studentBalance: StudentBalance;
  studentGrade: StudentGrade;
  studentGrades: Array<StudentGrade>;
  studentGradesByCourseId: Array<StudentGrade>;
  students: Array<Student>;
  studentsByCourseId: Array<Student>;
  studentsBySchoolId: Array<Student>;
  /** Get all students for an assignment with their submissions */
  studentsForAssignment: Array<Student>;
  studentsForAttendance: Array<Student>;
  studyPlan: StudyPlan;
  studyPlans: Array<StudyPlan>;
  studyPlansBySchoolId: Array<StudyPlan>;
  subject: Subject;
  subjects: Array<Subject>;
  teacher: Teacher;
  teachers: Array<Teacher>;
  teachersByOrganizationId: Array<Teacher>;
  unreadMessagesCount: Scalars['Int']['output'];
  user: User;
  users: Array<User>;
  usersCount: Scalars['Int']['output'];
  validateEmailToken: Scalars['Boolean']['output'];
};


export type QueryAssignmentArgs = {
  id: Scalars['String']['input'];
};


export type QueryAssignmentDatesByCourseIdArgs = {
  classGroupId?: InputMaybe<Scalars['String']['input']>;
  courseId: Scalars['String']['input'];
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};


export type QueryAssignmentDatesBySchoolIdArgs = {
  classGroupId?: InputMaybe<Scalars['String']['input']>;
  endDate: Scalars['String']['input'];
  schoolId: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};


export type QueryAssignmentSubmissionsArgs = {
  assignmentId: Scalars['String']['input'];
};


export type QueryAssignmentsByCourseIdArgs = {
  courseId: Scalars['String']['input'];
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};


export type QueryAssignmentsBySchoolIdArgs = {
  endDate: Scalars['String']['input'];
  schoolId: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
};


export type QueryAttendanceRecordsByStudentIdArgs = {
  studentId: Scalars['String']['input'];
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAttendanceSessionArgs = {
  id: Scalars['String']['input'];
};


export type QueryAttendanceSessionsArgs = {
  classGroupId?: InputMaybe<Scalars['String']['input']>;
  courseId: Scalars['String']['input'];
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAttendanceSessionsCountArgs = {
  classGroupId?: InputMaybe<Scalars['String']['input']>;
  courseId: Scalars['String']['input'];
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAverageCourseScoreForStudentArgs = {
  courseId: Scalars['String']['input'];
  periodId: Scalars['String']['input'];
  studentId: Scalars['String']['input'];
};


export type QueryChargesBySchoolArgs = {
  schoolId: Scalars['String']['input'];
  year?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryChargesByStudentArgs = {
  studentId: Scalars['String']['input'];
};


export type QueryChatArgs = {
  id: Scalars['String']['input'];
};


export type QueryChatMessagesArgs = {
  input: ChatMessagesInput;
};


export type QueryCheckPendingInvitationArgs = {
  email: Scalars['String']['input'];
};


export type QueryClassGroupArgs = {
  id: Scalars['String']['input'];
};


export type QueryClassGroupsArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryClassGroupsByCourseIdArgs = {
  courseId: Scalars['String']['input'];
};


export type QueryClassGroupsByOrganizationIdArgs = {
  organizationId: Scalars['String']['input'];
};


export type QueryClassGroupsBySchoolIdArgs = {
  schoolId: Scalars['String']['input'];
};


export type QueryClassGroupsCountArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCourseArgs = {
  id: Scalars['String']['input'];
};


export type QueryCoursesArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCoursesByGroupIdArgs = {
  groupId: Scalars['String']['input'];
};


export type QueryCoursesBySchoolIdArgs = {
  schoolId: Scalars['String']['input'];
};


export type QueryCoursesByStudyPlanIdArgs = {
  studyPlanId: Scalars['String']['input'];
};


export type QueryCoursesBySubjectIdArgs = {
  subjectId: Scalars['String']['input'];
};


export type QueryCoursesCountArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDegreeArgs = {
  id: Scalars['String']['input'];
};


export type QueryDegreesBySchoolIdArgs = {
  schoolId: Scalars['String']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDegreesBySchoolIdCountArgs = {
  schoolId: Scalars['String']['input'];
};


export type QueryFileByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryFilesAccessibleArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFilesForCourseArgs = {
  courseId: Scalars['String']['input'];
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFilesOwnedArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFilesSharedWithMeArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFindContactsArgs = {
  queryText?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFindManyMessagesArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFindManyNewslettersCountArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFindManyStudentsCountArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFindManySubjectsCountArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFindManyTeachersCountArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFindMessageByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryFindMyMessagesArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGradeArgs = {
  id: Scalars['String']['input'];
};


export type QueryGradeBucketArgs = {
  id: Scalars['String']['input'];
};


export type QueryGradeBucketsByCourseIdArgs = {
  courseId: Scalars['String']['input'];
};


export type QueryGradeMetricArgs = {
  id: Scalars['String']['input'];
};


export type QueryGradeReportArgs = {
  periodId: Scalars['String']['input'];
  studentId: Scalars['String']['input'];
};


export type QueryGradesByCourseIdArgs = {
  courseId: Scalars['String']['input'];
  periodId: Scalars['String']['input'];
};


export type QueryGroupsScheduleArgs = {
  id: Scalars['String']['input'];
};


export type QueryGroupsSchedulesByClassGroupIdArgs = {
  classGroupId: Scalars['String']['input'];
};


export type QueryGroupsSchedulesByClassGroupIdGroupedArgs = {
  classGroupId: Scalars['String']['input'];
};


export type QueryHabitEvaluationArgs = {
  id: Scalars['String']['input'];
};


export type QueryHabitEvaluationsByGroupArgs = {
  classGroupId: Scalars['String']['input'];
  periodId: Scalars['String']['input'];
};


export type QueryHabitMetricArgs = {
  id: Scalars['String']['input'];
};


export type QueryListInvitationsArgs = {
  organizationId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryListMembersArgs = {
  organizationId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryLookupAccountForPasswordResetArgs = {
  email: Scalars['String']['input'];
};


export type QueryMyAssignmentSubmissionArgs = {
  assignmentId: Scalars['String']['input'];
};


export type QueryMyStoreCartArgs = {
  schoolId: Scalars['String']['input'];
};


export type QueryMyStoreOrdersArgs = {
  schoolId: Scalars['String']['input'];
};


export type QueryNewsletterArgs = {
  id: Scalars['String']['input'];
};


export type QueryNewslettersArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryOrganizationArgs = {
  id: Scalars['String']['input'];
};


export type QueryParentArgs = {
  id: Scalars['String']['input'];
};


export type QueryParentsArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryParentsByStudentIdArgs = {
  studentId: Scalars['String']['input'];
};


export type QueryParentsCountArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPaymentsByStudentArgs = {
  studentId: Scalars['String']['input'];
};


export type QueryPeriodArgs = {
  id: Scalars['String']['input'];
};


export type QueryPeriodsByYearArgs = {
  year: Scalars['Int']['input'];
};


export type QueryPermissionArgs = {
  id: Scalars['String']['input'];
};


export type QueryPermissionsArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPermissionsCountArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPublicSchoolBySlugArgs = {
  slug: Scalars['String']['input'];
};


export type QueryPublicStoreCategoriesArgs = {
  schoolId: Scalars['String']['input'];
};


export type QueryPublicStoreProductArgs = {
  id: Scalars['String']['input'];
};


export type QueryPublicStoreProductsArgs = {
  categoryId?: InputMaybe<Scalars['String']['input']>;
  schoolId: Scalars['String']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPublishedNewslettersArgs = {
  schoolId: Scalars['String']['input'];
  take?: Scalars['Int']['input'];
};


export type QueryQuizArgs = {
  id: Scalars['String']['input'];
};


export type QueryQuizzesArgs = {
  organizationId: Scalars['String']['input'];
};


export type QueryRoleArgs = {
  id: Scalars['String']['input'];
};


export type QuerySchoolArgs = {
  id: Scalars['String']['input'];
};


export type QuerySchoolLogoDownloadUrlArgs = {
  schoolId: Scalars['String']['input'];
};


export type QueryStoreCategoriesArgs = {
  schoolId: Scalars['String']['input'];
};


export type QueryStoreCategoriesAdminArgs = {
  schoolId: Scalars['String']['input'];
};


export type QueryStoreOrderArgs = {
  id: Scalars['String']['input'];
};


export type QueryStoreOrdersAdminArgs = {
  schoolId: Scalars['String']['input'];
};


export type QueryStoreProductArgs = {
  id: Scalars['String']['input'];
};


export type QueryStoreProductsArgs = {
  categoryId?: InputMaybe<Scalars['String']['input']>;
  schoolId: Scalars['String']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryStoreProductsAdminArgs = {
  schoolId: Scalars['String']['input'];
};


export type QueryStudentArgs = {
  id: Scalars['String']['input'];
};


export type QueryStudentAttendanceStatsArgs = {
  studentId: Scalars['String']['input'];
};


export type QueryStudentBalanceArgs = {
  studentId: Scalars['String']['input'];
};


export type QueryStudentGradeArgs = {
  id: Scalars['String']['input'];
};


export type QueryStudentGradesByCourseIdArgs = {
  courseId: Scalars['String']['input'];
  periodId: Scalars['String']['input'];
  studentId: Scalars['String']['input'];
};


export type QueryStudentsArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryStudentsByCourseIdArgs = {
  courseId: Scalars['String']['input'];
};


export type QueryStudentsBySchoolIdArgs = {
  schoolId: Scalars['String']['input'];
};


export type QueryStudentsForAssignmentArgs = {
  assignmentId: Scalars['String']['input'];
};


export type QueryStudentsForAttendanceArgs = {
  classGroupId: Scalars['String']['input'];
  courseId: Scalars['String']['input'];
};


export type QueryStudyPlanArgs = {
  id: Scalars['String']['input'];
};


export type QueryStudyPlansBySchoolIdArgs = {
  degreeId?: InputMaybe<Scalars['String']['input']>;
  schoolId: Scalars['String']['input'];
};


export type QuerySubjectArgs = {
  id: Scalars['String']['input'];
};


export type QuerySubjectsArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTeacherArgs = {
  id: Scalars['String']['input'];
};


export type QueryTeachersArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTeachersByOrganizationIdArgs = {
  organizationId: Scalars['String']['input'];
};


export type QueryUserArgs = {
  id: Scalars['String']['input'];
};


export type QueryUsersArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryUsersCountArgs = {
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryValidateEmailTokenArgs = {
  email: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export type Quiz = {
  __typename?: 'Quiz';
  /** Course */
  course: Course;
  /** Course ID */
  courseId: Scalars['String']['output'];
  /** Created At */
  createdAt: Scalars['DateTime']['output'];
  /** Details */
  details: Scalars['String']['output'];
  /** ID */
  id: Scalars['String']['output'];
  /** Organization ID */
  organizationId: Scalars['String']['output'];
  /** Questions */
  questions: Array<QuizQuestion>;
  /** Teacher */
  teacher: Teacher;
  /** Teacher ID */
  teacherId: Scalars['String']['output'];
  /** Title */
  title: Scalars['String']['output'];
  /** Updated At */
  updatedAt: Scalars['DateTime']['output'];
};

export type QuizQuestion = {
  __typename?: 'QuizQuestion';
  /** ID */
  id: Scalars['String']['output'];
  /** Options */
  options: Array<QuizQuestionOption>;
  /** Question */
  question: Scalars['String']['output'];
  /** Quiz ID */
  quizId: Scalars['String']['output'];
  /** Time Limit */
  timeLimit: Scalars['Float']['output'];
  /** Type */
  type: Scalars['String']['output'];
  /** Value */
  value: Scalars['Float']['output'];
};

export type QuizQuestionOption = {
  __typename?: 'QuizQuestionOption';
  /** ID */
  id: Scalars['String']['output'];
  /** Is Correct */
  isCorrect: Scalars['Boolean']['output'];
  /** Option */
  option: Scalars['String']['output'];
  /** Question ID */
  questionId: Scalars['String']['output'];
};

export type RemoveShareInput = {
  /** File ID for the share */
  fileId: Scalars['String']['input'];
  /** Target ID for the share */
  targetId: Scalars['String']['input'];
  /** Target type for the share */
  targetType: Scalars['String']['input'];
};

export type RequestJoinSchoolInput = {
  /** Document ID (required for STUDENT and PARENT) */
  documentId?: InputMaybe<Scalars['String']['input']>;
  /** Requested role: ORG_ADMIN, TEACHER, STUDENT, PARENT */
  requestedRole: Scalars['String']['input'];
  /** ID of the school to join */
  schoolId: Scalars['String']['input'];
};

export type Role = {
  __typename?: 'Role';
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  organizationId?: Maybe<Scalars['String']['output']>;
  permissions: Array<Permission>;
  updatedAt: Scalars['DateTime']['output'];
};

export type SaveHabitEvaluationInput = {
  /** ID del grupo */
  classGroupId: Scalars['String']['input'];
  /** ID de la métrica de hábito */
  habitMetricId: Scalars['String']['input'];
  /** ID del período */
  periodId: Scalars['String']['input'];
  /** Si la evaluación está publicada */
  published?: InputMaybe<Scalars['Boolean']['input']>;
  /** Evaluaciones de estudiantes */
  studentEvaluations: Array<StudentHabitEvaluationInput>;
};

export type School = {
  __typename?: 'School';
  /** Address of the school */
  address: Scalars['String']['output'];
  /** City of the school */
  city: Scalars['String']['output'];
  /** Country of the school */
  country: Scalars['String']['output'];
  /** Created at */
  createdAt: Scalars['DateTime']['output'];
  /** Currency code (e.g. USD, MXN) */
  currencyCode: Scalars['String']['output'];
  /** Current year of the school */
  currentYear: Scalars['Float']['output'];
  /** Email of the school */
  email: Scalars['String']['output'];
  /** ID of the school */
  id: Scalars['String']['output'];
  /** Logo storage key of the school */
  logo: Scalars['String']['output'];
  /** Presigned URL for the school logo */
  logoUrl?: Maybe<Scalars['String']['output']>;
  /** Name of the school */
  name: Scalars['String']['output'];
  /** Organization of the school */
  organization: Organization;
  /** Organization ID of the school */
  organizationId: Scalars['String']['output'];
  /** Phone number of the school */
  phone: Scalars['String']['output'];
  /** Primary brand color (hex, e.g. #3b82f6) */
  primaryColor?: Maybe<Scalars['String']['output']>;
  /** Secondary brand color (hex) */
  secondaryColor?: Maybe<Scalars['String']['output']>;
  /** Short name of the school */
  shortName: Scalars['String']['output'];
  /** URL slug for public store routes */
  slug?: Maybe<Scalars['String']['output']>;
  /** State of the school */
  state: Scalars['String']['output'];
  /** Tertiary/accent brand color (hex) */
  tertiaryColor?: Maybe<Scalars['String']['output']>;
  /** Updated at */
  updatedAt: Scalars['DateTime']['output'];
  /** Website of the school */
  website: Scalars['String']['output'];
  /** Zip code of the school */
  zip: Scalars['String']['output'];
};

export type SchoolLogoDownloadUrl = {
  __typename?: 'SchoolLogoDownloadUrl';
  /** Presigned download URL for the logo */
  downloadUrl: Scalars['String']['output'];
};

export type SchoolLogoUploadInput = {
  /** MIME type of the image */
  mimeType: Scalars['String']['input'];
  /** School ID for the logo upload */
  schoolId: Scalars['String']['input'];
};

export type SchoolLogoUploadUrl = {
  __typename?: 'SchoolLogoUploadUrl';
  /** Storage key for the logo */
  storageKey: Scalars['String']['output'];
  /** Presigned upload URL */
  uploadUrl: Scalars['String']['output'];
};

export type SendMessageInput = {
  /** Chat ID */
  chatId: Scalars['String']['input'];
  /** Message content */
  content: Scalars['String']['input'];
  /** Optional reply to message ID */
  replyToId?: InputMaybe<Scalars['String']['input']>;
};

export type ShareFileInput = {
  /** File ID to share */
  fileId: Scalars['String']['input'];
  /** Permission for the share */
  permission: Scalars['String']['input'];
  /** Target ID for the share */
  targetId: Scalars['String']['input'];
  /** Target type for the share */
  targetType: Scalars['String']['input'];
};

export type SignUpInput = {
  /** Email of the user (must match token) */
  email: Scalars['String']['input'];
  /** First name of the user */
  firstName: Scalars['String']['input'];
  /** Last name of the user */
  lastName: Scalars['String']['input'];
  /** Password of the user */
  password: Scalars['String']['input'];
  /** Verification token from email link */
  token: Scalars['String']['input'];
};

export type StoreCartItem = {
  __typename?: 'StoreCartItem';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  product: StoreProduct;
  productId: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['String']['output'];
};

export type StoreCategory = {
  __typename?: 'StoreCategory';
  active: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  schoolId: Scalars['String']['output'];
  sortOrder: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type StoreOrder = {
  __typename?: 'StoreOrder';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  items: Array<StoreOrderItem>;
  notes?: Maybe<Scalars['String']['output']>;
  paymentStatus: StorePaymentStatus;
  schoolId: Scalars['String']['output'];
  status: StoreOrderStatus;
  total: Scalars['Float']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['String']['output'];
};

export type StoreOrderItem = {
  __typename?: 'StoreOrderItem';
  id: Scalars['String']['output'];
  orderId: Scalars['String']['output'];
  product: StoreProduct;
  productId: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  unitPrice: Scalars['Float']['output'];
};

export enum StoreOrderStatus {
  Cancelled = 'CANCELLED',
  Confirmed = 'CONFIRMED',
  Delivered = 'DELIVERED',
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  Ready = 'READY'
}

export enum StorePaymentStatus {
  Failed = 'FAILED',
  Paid = 'PAID',
  Pending = 'PENDING',
  Refunded = 'REFUNDED'
}

export type StoreProduct = {
  __typename?: 'StoreProduct';
  active: Scalars['Boolean']['output'];
  category?: Maybe<StoreCategory>;
  categoryId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  schoolId: Scalars['String']['output'];
  stock: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Student = {
  __typename?: 'Student';
  /** Address of the student */
  address: Scalars['String']['output'];
  /** Allergies of the student */
  allergies: Scalars['String']['output'];
  /** Assignment submissions by the student */
  assignmentSubmissions: Array<StudentAssignmentSubmission>;
  averageScoreForStudent: Scalars['Float']['output'];
  /** Birth date of the student */
  birthDate: Scalars['DateTime']['output'];
  /** Blood type of the student */
  bloodType: Scalars['String']['output'];
  /** Class group of the student */
  classGroup?: Maybe<ClassGroup>;
  /** Class group ID of the student */
  classGroupId?: Maybe<Scalars['String']['output']>;
  color: Scalars['String']['output'];
  /** Courses of the student */
  courses: Array<Course>;
  /** Created at of the student */
  createdAt: Scalars['DateTime']['output'];
  /** Document ID of the student */
  documentId: Scalars['String']['output'];
  email: Scalars['String']['output'];
  /** Emergency contact name */
  emergencyContactName: Scalars['String']['output'];
  /** Emergency contact phone */
  emergencyContactPhone: Scalars['String']['output'];
  /** Enrollment status of the student */
  enrollmentStatus: EnrollmentStatus;
  /** Father name of the student */
  fatherName: Scalars['String']['output'];
  /** First name of the student */
  firstName: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  /** Gender of the student */
  gender: Scalars['String']['output'];
  /** ID of the student */
  id: Scalars['String']['output'];
  initials: Scalars['String']['output'];
  /** Medical notes of the student */
  medicalNotes: Scalars['String']['output'];
  /** Middle name of the student */
  middleName: Scalars['String']['output'];
  /** Mother name of the student */
  motherName: Scalars['String']['output'];
  name: Scalars['String']['output'];
  /** Organization ID of the student */
  organizationId: Scalars['String']['output'];
  /** Parents of the student */
  parents: Array<Parent>;
  /** Phone of the student */
  phone: Scalars['String']['output'];
  /** School ID of the student */
  schoolId: Scalars['String']['output'];
  /** Student grades of the student */
  studentGrades: Array<StudentGrade>;
  /** Updated at of the student */
  updatedAt: Scalars['DateTime']['output'];
  /** User of the student */
  user: User;
  /** User ID of the student */
  userId: Scalars['String']['output'];
};


export type StudentAverageScoreForStudentArgs = {
  courseId: Scalars['String']['input'];
  periodId: Scalars['String']['input'];
};

/** Student assignment submission info */
export type StudentAssignmentSubmission = {
  __typename?: 'StudentAssignmentSubmission';
  file: StudentSubmissionFile;
  id: Scalars['String']['output'];
  submittedAt: Scalars['DateTime']['output'];
};

export type StudentBalance = {
  __typename?: 'StudentBalance';
  balance: Scalars['Float']['output'];
  studentId: Scalars['String']['output'];
  totalCharges: Scalars['Float']['output'];
  totalPayments: Scalars['Float']['output'];
};

export type StudentFinancialSummary = {
  __typename?: 'StudentFinancialSummary';
  balance: Scalars['Float']['output'];
  fatherName: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  studentId: Scalars['String']['output'];
  totalCharges: Scalars['Float']['output'];
  totalPayments: Scalars['Float']['output'];
};

export type StudentGrade = {
  __typename?: 'StudentGrade';
  /** Average score for the student */
  averageScoreForStudent: Scalars['Float']['output'];
  /** Comments for the student grade */
  comments?: Maybe<Scalars['String']['output']>;
  /** Created at of the student grade */
  createdAt: Scalars['DateTime']['output'];
  /** Grade of the student grade */
  grade: Grade;
  /** Grade ID of the student grade */
  gradeId: Scalars['String']['output'];
  /** ID of the student grade */
  id: Scalars['String']['output'];
  /** Score of the student grade */
  score?: Maybe<Scalars['Float']['output']>;
  /** Student of the student grade */
  student: Student;
  /** Student ID of the student grade */
  studentId: Scalars['String']['output'];
  /** Updated at of the student grade */
  updatedAt: Scalars['DateTime']['output'];
};

export type StudentHabitEvaluation = {
  __typename?: 'StudentHabitEvaluation';
  comments?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  habitEvaluationId: Scalars['String']['output'];
  id: Scalars['String']['output'];
  studentId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  value: HabitValue;
};

export type StudentHabitEvaluationInput = {
  /** Comentarios opcionales */
  comments?: InputMaybe<Scalars['String']['input']>;
  /** ID del estudiante */
  studentId: Scalars['String']['input'];
  /** Valor de la evaluación */
  value: HabitValue;
};

/** File info for student assignment submission */
export type StudentSubmissionFile = {
  __typename?: 'StudentSubmissionFile';
  id: Scalars['String']['output'];
  mimeType: Scalars['String']['output'];
  name: Scalars['String']['output'];
  size: Scalars['Int']['output'];
};

export type StudyPlan = {
  __typename?: 'StudyPlan';
  /** Created at of the study plan */
  createdAt: Scalars['DateTime']['output'];
  /** Degree of the study plan */
  degree: Degree;
  /** Degree ID of the study plan */
  degreeId: Scalars['String']['output'];
  /** Description of the study plan */
  description: Scalars['String']['output'];
  enrollmentCosts?: Maybe<Array<StudyPlanEnrollmentCost>>;
  /** Grade metric of the study plan */
  gradeMetric?: Maybe<GradeMetric>;
  /** Grade metric ID of the study plan */
  gradeMetricId?: Maybe<Scalars['String']['output']>;
  /** ID of the study plan */
  id: Scalars['String']['output'];
  /** Level of the study plan */
  level: Scalars['Int']['output'];
  monthlyTuitionAmount?: Maybe<Scalars['Float']['output']>;
  /** Name of the study plan */
  name: Scalars['String']['output'];
  /** School of the study plan */
  school: School;
  /** School ID of the study plan */
  schoolId: Scalars['String']['output'];
  /** Short name of the study plan */
  shortName: Scalars['String']['output'];
  tuitionMonths: Array<Scalars['Int']['output']>;
  /** Updated at of the study plan */
  updatedAt: Scalars['DateTime']['output'];
};

export type StudyPlanEnrollmentCost = {
  __typename?: 'StudyPlanEnrollmentCost';
  amount: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  studyPlanId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Subject = {
  __typename?: 'Subject';
  /** Code of the subject */
  code: Scalars['String']['output'];
  /** Created at */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the subject (auto-generated) */
  id: Scalars['String']['output'];
  /** Name of the subject */
  name: Scalars['String']['output'];
  /** Organization of the subject */
  organization: Organization;
  /** Organization ID of the subject */
  organizationId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type SubmissionDownloadUrl = {
  __typename?: 'SubmissionDownloadUrl';
  /** Presigned URL for downloading the file */
  downloadUrl: Scalars['String']['output'];
};

export type SubmissionUploadUrl = {
  __typename?: 'SubmissionUploadUrl';
  /** Storage key for the file */
  storageKey: Scalars['String']['output'];
  /** Presigned URL for uploading the file */
  uploadUrl: Scalars['String']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  messageReceived: ChatMessage;
};


export type SubscriptionMessageReceivedArgs = {
  chatId?: InputMaybe<Scalars['String']['input']>;
};

export type Teacher = {
  __typename?: 'Teacher';
  /** About the teacher */
  about: Scalars['String']['output'];
  /** Address of the teacher */
  address: Scalars['String']['output'];
  /** Birth date of the teacher */
  birthDate: Scalars['DateTime']['output'];
  /** Groups of the teacher */
  classGroups: Array<ClassGroup>;
  color?: Maybe<Scalars['String']['output']>;
  /** Courses of the teacher */
  courses: Array<Course>;
  /** Created at */
  createdAt: Scalars['DateTime']['output'];
  /** Document ID of the teacher */
  documentId: Scalars['String']['output'];
  /** Father name of the teacher */
  fatherName: Scalars['String']['output'];
  /** First name of the teacher */
  firstName: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  /** Gender of the teacher */
  gender: Scalars['String']['output'];
  /** ID of the teacher (auto-generated) */
  id: Scalars['String']['output'];
  initials: Scalars['String']['output'];
  /** Member since date */
  memberSince?: Maybe<Scalars['DateTime']['output']>;
  /** Middle name of the teacher */
  middleName: Scalars['String']['output'];
  /** Mother name of the teacher */
  motherName: Scalars['String']['output'];
  name: Scalars['String']['output'];
  /** Organization ID of the teacher */
  organizationId: Scalars['String']['output'];
  /** Personal email of the teacher */
  personalEmail: Scalars['String']['output'];
  /** Phone number of the teacher */
  phoneNumber: Scalars['String']['output'];
  /** Subject of the teacher */
  subjects: Array<Subject>;
  /** Teacher since year */
  teacherSince?: Maybe<Scalars['Int']['output']>;
  /** Updated at */
  updatedAt: Scalars['DateTime']['output'];
  /** User of the teacher */
  user?: Maybe<User>;
  /** User ID of the teacher */
  userId?: Maybe<Scalars['String']['output']>;
};

export type UpdateAssignmentInput = {
  /** Id del curso */
  courseId?: InputMaybe<Scalars['String']['input']>;
  /** Fecha de la asignacion */
  date?: InputMaybe<Scalars['String']['input']>;
  /** Detalles de la asignacion */
  details?: InputMaybe<Scalars['String']['input']>;
  /** Fechas de la asignacion */
  groupDates?: InputMaybe<Array<AssignmentDateInput>>;
  id: Scalars['String']['input'];
  /** Requiere envio */
  requireSubmission?: InputMaybe<Scalars['Boolean']['input']>;
  /** Id de la escuela */
  schoolId?: InputMaybe<Scalars['String']['input']>;
  /** Id del profesor */
  teacherId?: InputMaybe<Scalars['String']['input']>;
  /** Titulo de la asignacion */
  title?: InputMaybe<Scalars['String']['input']>;
  /** Tipo de la asignacion */
  type?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAttendanceRecordInput = {
  /** Optional comment */
  comment?: InputMaybe<Scalars['String']['input']>;
  /** ID of the attendance record */
  id: Scalars['String']['input'];
  /** Attendance status */
  status?: InputMaybe<AttendanceStatus>;
  /** Student ID */
  studentId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCartItemInput = {
  cartItemId: Scalars['String']['input'];
  quantity: Scalars['Int']['input'];
};

export type UpdateClassGroupInput = {
  /** Active status of the class group */
  active?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['String']['input'];
  /** Name of the class group */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Organization ID of the class group */
  organizationId?: InputMaybe<Scalars['String']['input']>;
  /** School ID of the class group */
  schoolId?: InputMaybe<Scalars['String']['input']>;
  /** Study plan ID of the class group */
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  /** Teacher ID of the class group */
  teacherId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCourseInput = {
  /** Code of the course */
  code?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  /** Name of the course */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Organization ID of the course */
  organizationId?: InputMaybe<Scalars['String']['input']>;
  /** School ID of the course */
  schoolId?: InputMaybe<Scalars['String']['input']>;
  /** Short name of the course */
  shortName?: InputMaybe<Scalars['String']['input']>;
  /** Study plan ID of the course */
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
  /** Subject ID of the course */
  subjectId?: InputMaybe<Scalars['String']['input']>;
  /** Teacher ID of the course */
  teacherId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDegreeInput = {
  id: Scalars['String']['input'];
  /** Name of the degree */
  name?: InputMaybe<Scalars['String']['input']>;
  /** School ID */
  schoolId?: InputMaybe<Scalars['String']['input']>;
  /** Short name of the degree */
  shortName?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateGradeBucketInput = {
  /** Id del curso */
  courseId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  /** Nombre del bucket */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Peso del bucket */
  weight?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateGradeInput = {
  /** Id del bucket */
  bucketId?: InputMaybe<Scalars['String']['input']>;
  /** Comentarios */
  comments?: InputMaybe<Scalars['String']['input']>;
  /** Id del curso */
  courseId?: InputMaybe<Scalars['String']['input']>;
  /** Fecha de la calificacion */
  date?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['String']['input'];
  /** Id del periodo */
  periodId?: InputMaybe<Scalars['String']['input']>;
  /** ¿Publicada? */
  published?: InputMaybe<Scalars['Boolean']['input']>;
  /** Titulo de la calificacion   */
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateGroupsScheduleInput = {
  /** Class group ID */
  classGroupId?: InputMaybe<Scalars['String']['input']>;
  /** Course ID */
  courseId?: InputMaybe<Scalars['String']['input']>;
  /** End time */
  endTime?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  /** Location */
  location?: InputMaybe<Scalars['String']['input']>;
  /** Remote */
  remote?: InputMaybe<Scalars['Boolean']['input']>;
  /** Remote link */
  remoteLink?: InputMaybe<Scalars['String']['input']>;
  /** Start time */
  startTime?: InputMaybe<Scalars['String']['input']>;
  /** Week day */
  weekday?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateNewsletterInput = {
  /** Content of the newsletter (HTML) */
  content?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  /** Whether to publish immediately */
  published?: InputMaybe<Scalars['Boolean']['input']>;
  /** School ID the newsletter belongs to */
  schoolId?: InputMaybe<Scalars['String']['input']>;
  /** Title of the newsletter */
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateOrganizationInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateParentInput = {
  /** Address of the parent */
  address?: InputMaybe<Scalars['String']['input']>;
  /** Document ID of the parent */
  documentId?: InputMaybe<Scalars['String']['input']>;
  /** Email of the parent */
  email?: InputMaybe<Scalars['String']['input']>;
  /** Father name (paternal last name) of the parent */
  fatherName?: InputMaybe<Scalars['String']['input']>;
  /** First name of the parent */
  firstName?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  /** Middle name of the parent */
  middleName?: InputMaybe<Scalars['String']['input']>;
  /** Mother name (maternal last name) of the parent */
  motherName?: InputMaybe<Scalars['String']['input']>;
  /** Occupation of the parent */
  occupation?: InputMaybe<Scalars['String']['input']>;
  /** Organization ID of the parent */
  organizationId?: InputMaybe<Scalars['String']['input']>;
  /** Phone number of the parent */
  phone?: InputMaybe<Scalars['String']['input']>;
  /** Relationship to student (Father, Mother, Guardian, etc.) */
  relationship?: InputMaybe<Scalars['String']['input']>;
  /** IDs of students to associate with this parent */
  studentIds?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Work phone number of the parent */
  workPhone?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePeriodInput = {
  /** End date of the period */
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** ID of the period */
  id: Scalars['String']['input'];
  /** Name of the period */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Short name of the period */
  shortName?: InputMaybe<Scalars['String']['input']>;
  /** Start date of the period */
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** Year of the period */
  year?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdatePermissionInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  descriptiveId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
};

export type UpdateQuizInput = {
  /** Course ID */
  courseId?: InputMaybe<Scalars['String']['input']>;
  /** Details */
  details?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  /** Organization ID */
  organizationId?: InputMaybe<Scalars['String']['input']>;
  /** Questions */
  questions?: InputMaybe<Array<CreateQuizQuestionInput>>;
  /** Teacher ID */
  teacherId?: InputMaybe<Scalars['String']['input']>;
  /** Title */
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRoleInput = {
  /** Description of the role */
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  /** Name of the role */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Organization ID of the role */
  organizationId?: InputMaybe<Scalars['String']['input']>;
  /** Permissions of the role */
  permissionIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateSchoolInput = {
  /** Address of the school */
  address?: InputMaybe<Scalars['String']['input']>;
  /** City of the school */
  city?: InputMaybe<Scalars['String']['input']>;
  /** Country of the school */
  country?: InputMaybe<Scalars['String']['input']>;
  currentYear?: InputMaybe<Scalars['Int']['input']>;
  /** Email of the school */
  email?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  /** Logo of the school */
  logo?: InputMaybe<Scalars['String']['input']>;
  /** Name of the school */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Organization ID of the school */
  organizationId?: InputMaybe<Scalars['String']['input']>;
  /** Phone number of the school */
  phone?: InputMaybe<Scalars['String']['input']>;
  /** Primary brand color (hex, e.g. #3b82f6) */
  primaryColor?: InputMaybe<Scalars['String']['input']>;
  /** Secondary brand color (hex) */
  secondaryColor?: InputMaybe<Scalars['String']['input']>;
  /** Short name of the school */
  shortName?: InputMaybe<Scalars['String']['input']>;
  /** URL slug for the school store (optional; auto-generated if omitted) */
  slug?: InputMaybe<Scalars['String']['input']>;
  /** State of the school */
  state?: InputMaybe<Scalars['String']['input']>;
  /** Tertiary/accent brand color (hex) */
  tertiaryColor?: InputMaybe<Scalars['String']['input']>;
  /** Website of the school */
  website?: InputMaybe<Scalars['String']['input']>;
  /** Zip code of the school */
  zip?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateShareInput = {
  /** File ID for the share */
  fileId: Scalars['String']['input'];
  /** Updated permission for the share */
  permission: Scalars['String']['input'];
  /** Target ID for the share */
  targetId: Scalars['String']['input'];
  /** Target type for the share */
  targetType: Scalars['String']['input'];
};

export type UpdateStoreCategoryInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateStoreOrderStatusInput = {
  orderId: Scalars['String']['input'];
  status: Scalars['String']['input'];
};

export type UpdateStoreProductInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  categoryId?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
  stock?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateStudentGradeInput = {
  /** Comments for the student grade */
  comments?: InputMaybe<Scalars['String']['input']>;
  /** Grade ID for the student grade */
  gradeId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  /** Score for the student grade */
  score?: InputMaybe<Scalars['Float']['input']>;
  /** Student ID for the student grade */
  studentId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateStudentInput = {
  /** Address of the student */
  address?: InputMaybe<Scalars['String']['input']>;
  /** Allergies of the student */
  allergies?: InputMaybe<Scalars['String']['input']>;
  /** Birth date of the student */
  birthDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** Blood type of the student */
  bloodType?: InputMaybe<Scalars['String']['input']>;
  /** Class group ID of the student */
  classGroupId?: InputMaybe<Scalars['String']['input']>;
  /** Document ID of the student */
  documentId?: InputMaybe<Scalars['String']['input']>;
  /** Email of the student */
  email?: InputMaybe<Scalars['String']['input']>;
  /** Emergency contact name */
  emergencyContactName?: InputMaybe<Scalars['String']['input']>;
  /** Emergency contact phone */
  emergencyContactPhone?: InputMaybe<Scalars['String']['input']>;
  /** Enrollment status of the student */
  enrollmentStatus?: InputMaybe<Scalars['String']['input']>;
  /** Father name of the student */
  fatherName?: InputMaybe<Scalars['String']['input']>;
  /** First name of the student */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** Gender of the student */
  gender?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  /** Medical notes of the student */
  medicalNotes?: InputMaybe<Scalars['String']['input']>;
  /** Middle name of the student */
  middleName?: InputMaybe<Scalars['String']['input']>;
  /** Mother name of the student */
  motherName?: InputMaybe<Scalars['String']['input']>;
  /** Organization ID of the student */
  organizationId?: InputMaybe<Scalars['String']['input']>;
  /** IDs of parents to associate with this student */
  parentIds?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Phone of the student */
  phone?: InputMaybe<Scalars['String']['input']>;
  /** School ID of the student */
  schoolId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateStudyPlanFinancialInput = {
  enrollmentCosts?: InputMaybe<Array<EnrollmentCostInput>>;
  monthlyTuitionAmount?: InputMaybe<Scalars['Float']['input']>;
  studyPlanId: Scalars['String']['input'];
  /** Month numbers 1-12 when tuition is due */
  tuitionMonths?: InputMaybe<Array<Scalars['Int']['input']>>;
};

export type UpdateStudyPlanInput = {
  /** Degree ID of the study plan */
  degreeId?: InputMaybe<Scalars['String']['input']>;
  /** Description of the study plan */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Grade metric ID of the study plan */
  gradeMetricId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  /** Level of the study plan */
  level?: InputMaybe<Scalars['Int']['input']>;
  /** Name of the study plan */
  name?: InputMaybe<Scalars['String']['input']>;
  /** School ID of the study plan */
  schoolId?: InputMaybe<Scalars['String']['input']>;
  /** Short name of the study plan */
  shortName?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSubjectInput = {
  /** Code of the subject */
  code?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  /** Name of the subject */
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTeacherInput = {
  about?: InputMaybe<Scalars['String']['input']>;
  address?: InputMaybe<Scalars['String']['input']>;
  /** Birth date of the teacher */
  birthDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** Document ID of the teacher */
  documentId?: InputMaybe<Scalars['String']['input']>;
  /** Email of the teacher */
  email?: InputMaybe<Scalars['String']['input']>;
  /** Father name of the teacher */
  fatherName?: InputMaybe<Scalars['String']['input']>;
  /** First name of the teacher */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** Gender of the teacher */
  gender?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  memberSince?: InputMaybe<Scalars['DateTime']['input']>;
  /** Middle name of the teacher */
  middleName?: InputMaybe<Scalars['String']['input']>;
  /** Mother name of the teacher */
  motherName?: InputMaybe<Scalars['String']['input']>;
  /** Organization ID of the teacher */
  organizationId?: InputMaybe<Scalars['String']['input']>;
  personalEmail?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  teacherSince?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateUserInput = {
  /** Email of the user */
  email?: InputMaybe<Scalars['String']['input']>;
  /** First name of the user */
  firstName?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  /** Last name of the user */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** Organization ID of the user */
  organizationId?: InputMaybe<Scalars['String']['input']>;
  /** Password of the user */
  password?: InputMaybe<Scalars['String']['input']>;
  /** Role ID of the user */
  roleId?: InputMaybe<Scalars['String']['input']>;
  /** Theme preference: light, dark, or system */
  themePreference?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  banExpires?: Maybe<Scalars['DateTime']['output']>;
  banReason?: Maybe<Scalars['String']['output']>;
  banned: Scalars['Boolean']['output'];
  color?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  emailVerified?: Maybe<Scalars['Boolean']['output']>;
  firstName: Scalars['String']['output'];
  id: Scalars['String']['output'];
  image?: Maybe<Scalars['String']['output']>;
  initials: Scalars['String']['output'];
  isBlocked: Scalars['Boolean']['output'];
  lastLogin?: Maybe<Scalars['DateTime']['output']>;
  lastName: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  onboardingStep?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Organization>;
  organizationId?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Role>;
  roleId?: Maybe<Scalars['String']['output']>;
  student?: Maybe<UserStudent>;
  teacher?: Maybe<UserTeacher>;
  themePreference?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type UserStudent = {
  __typename?: 'UserStudent';
  address: Scalars['String']['output'];
  allergies: Scalars['String']['output'];
  birthDate: Scalars['DateTime']['output'];
  bloodType: Scalars['String']['output'];
  classGroup?: Maybe<ClassGroupRef>;
  classGroupId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  documentId: Scalars['String']['output'];
  emergencyContactName: Scalars['String']['output'];
  emergencyContactPhone: Scalars['String']['output'];
  enrollmentStatus: Scalars['String']['output'];
  fatherName: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  gender: Scalars['String']['output'];
  id: Scalars['String']['output'];
  medicalNotes: Scalars['String']['output'];
  middleName: Scalars['String']['output'];
  motherName: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  phone: Scalars['String']['output'];
  schoolId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['String']['output'];
};

export type UserTeacher = {
  __typename?: 'UserTeacher';
  birthDate: Scalars['DateTime']['output'];
  createdAt: Scalars['DateTime']['output'];
  documentId: Scalars['String']['output'];
  fatherName: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  gender: Scalars['String']['output'];
  id: Scalars['String']['output'];
  middleName: Scalars['String']['output'];
  motherName: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['String']['output'];
};

export type WebAdminAuthMeQueryVariables = Exact<{ [key: string]: never; }>;


export type WebAdminAuthMeQuery = { __typename?: 'Query', me: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, color?: string | null, teacher?: { __typename?: 'UserTeacher', id: string, firstName: string, fatherName: string } | null, student?: { __typename?: 'UserStudent', id: string, firstName: string, fatherName: string } | null, role?: { __typename?: 'Role', name: string, permissions: Array<{ __typename?: 'Permission', id: string, descriptiveId: string, description: string }> } | null } };

export type WebAdminAuthLoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type WebAdminAuthLoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', accessToken: string } };

export type WebAdminGetGradeMetricsQueryVariables = Exact<{ [key: string]: never; }>;


export type WebAdminGetGradeMetricsQuery = { __typename?: 'Query', gradeMetrics: Array<{ __typename?: 'GradeMetric', id: string, name: string, minimum: number, maximum: number, minimumApproval: number, minimumExcellence: number, createdAt: any, updatedAt: any }> };

export type WebAdminGetHabitMetricsQueryVariables = Exact<{ [key: string]: never; }>;


export type WebAdminGetHabitMetricsQuery = { __typename?: 'Query', habitMetrics: Array<{ __typename?: 'HabitMetric', id: string, name: string, description?: string | null, active: boolean, order: number, createdAt: any, updatedAt: any }> };

export type WebAdminCreateOrganizationMutationVariables = Exact<{
  createOrganizationInput: CreateOrganizationInput;
}>;


export type WebAdminCreateOrganizationMutation = { __typename?: 'Mutation', createOrganization: { __typename?: 'Organization', id: string, name: string, description: string, createdAt: any, updatedAt: any } };

export type WebAdminUpdateOrganizationMutationVariables = Exact<{
  updateOrganizationInput: UpdateOrganizationInput;
}>;


export type WebAdminUpdateOrganizationMutation = { __typename?: 'Mutation', updateOrganization: { __typename?: 'Organization', id: string, name: string, description: string, createdAt: any, updatedAt: any } };

export type WebAdminGetOrganizationsQueryVariables = Exact<{ [key: string]: never; }>;


export type WebAdminGetOrganizationsQuery = { __typename?: 'Query', organizations: Array<{ __typename?: 'Organization', id: string, name: string, description: string, createdAt: any, updatedAt: any }> };

export type WebAdminRemoveOrganizationMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type WebAdminRemoveOrganizationMutation = { __typename?: 'Mutation', removeOrganization: { __typename?: 'Organization', id: string, name: string, description: string, createdAt: any, updatedAt: any } };

export type WebAdminCreatePeriodMutationVariables = Exact<{
  createPeriodInput: CreatePeriodInput;
}>;


export type WebAdminCreatePeriodMutation = { __typename?: 'Mutation', createPeriod: { __typename?: 'Period', id: string } };

export type WebAdminUpdatePeriodMutationVariables = Exact<{
  updatePeriodInput: UpdatePeriodInput;
}>;


export type WebAdminUpdatePeriodMutation = { __typename?: 'Mutation', updatePeriod: { __typename?: 'Period', id: string } };

export type WebAdminGetPeriodsQueryVariables = Exact<{ [key: string]: never; }>;


export type WebAdminGetPeriodsQuery = { __typename?: 'Query', periods: Array<{ __typename?: 'Period', id: string, name: string, shortName: string, year: number, startDate: any, endDate: any, createdAt: any, updatedAt: any }> };

export type WebAdminRemovePeriodMutationVariables = Exact<{
  removePeriodId: Scalars['String']['input'];
}>;


export type WebAdminRemovePeriodMutation = { __typename?: 'Mutation', removePeriod: { __typename?: 'Period', id: string } };

export type WebAdminCreatePermissionMutationVariables = Exact<{
  createPermissionInput: CreatePermissionInput;
}>;


export type WebAdminCreatePermissionMutation = { __typename?: 'Mutation', createPermission: { __typename?: 'Permission', id: string, descriptiveId: string, description: string, createdAt: any, updatedAt: any } };

export type WebAdminUpdatePermissionMutationVariables = Exact<{
  updatePermissionInput: UpdatePermissionInput;
}>;


export type WebAdminUpdatePermissionMutation = { __typename?: 'Mutation', updatePermission: { __typename?: 'Permission', id: string, descriptiveId: string, description: string, createdAt: any, updatedAt: any } };

export type WebAdminGetPermissionsQueryVariables = Exact<{
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
  search: Scalars['String']['input'];
}>;


export type WebAdminGetPermissionsQuery = { __typename?: 'Query', count: number, permissions: Array<{ __typename?: 'Permission', id: string, descriptiveId: string, description: string, createdAt: any, updatedAt: any }> };

export type WebAdminRemovePermissionMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type WebAdminRemovePermissionMutation = { __typename?: 'Mutation', removePermission: { __typename?: 'Permission', id: string } };

export type WebAdminGetPermissionsForRoleQueryVariables = Exact<{ [key: string]: never; }>;


export type WebAdminGetPermissionsForRoleQuery = { __typename?: 'Query', permissions: Array<{ __typename?: 'Permission', id: string, descriptiveId: string, description: string }> };

export type WebAdminGetOrganizationsForRoleQueryVariables = Exact<{ [key: string]: never; }>;


export type WebAdminGetOrganizationsForRoleQuery = { __typename?: 'Query', organizations: Array<{ __typename?: 'Organization', id: string, name: string }> };

export type WebAdminCreateRoleMutationVariables = Exact<{
  createRoleInput: CreateRoleInput;
}>;


export type WebAdminCreateRoleMutation = { __typename?: 'Mutation', createRole: { __typename?: 'Role', id: string, name: string, description: string, createdAt: any, updatedAt: any } };

export type WebAdminUpdateRoleMutationVariables = Exact<{
  updateRoleInput: UpdateRoleInput;
}>;


export type WebAdminUpdateRoleMutation = { __typename?: 'Mutation', updateRole: { __typename?: 'Role', id: string, name: string, description: string, createdAt: any, updatedAt: any } };

export type WebAdminGetRolesQueryVariables = Exact<{ [key: string]: never; }>;


export type WebAdminGetRolesQuery = { __typename?: 'Query', roles: Array<{ __typename?: 'Role', id: string, name: string, description: string, createdAt: any, updatedAt: any, organization?: { __typename?: 'Organization', id: string, name: string } | null, permissions: Array<{ __typename?: 'Permission', id: string, descriptiveId: string, description: string }> }> };

export type WebAdminRemoveRoleMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type WebAdminRemoveRoleMutation = { __typename?: 'Mutation', removeRole: { __typename?: 'Role', id: string, name: string, description: string } };

export type WebAdminGetOrganizationsForSchoolQueryVariables = Exact<{ [key: string]: never; }>;


export type WebAdminGetOrganizationsForSchoolQuery = { __typename?: 'Query', organizations: Array<{ __typename?: 'Organization', id: string, name: string }> };

export type WebAdminCreateSchoolMutationVariables = Exact<{
  createSchoolInput: CreateSchoolInput;
}>;


export type WebAdminCreateSchoolMutation = { __typename?: 'Mutation', createSchool: { __typename?: 'School', id: string, name: string, shortName: string, logo: string, address: string, city: string, state: string, zip: string, country: string, email: string, phone: string, website: string, createdAt: any, updatedAt: any, organization: { __typename?: 'Organization', id: string, name: string } } };

export type WebAdminUpdateSchoolMutationVariables = Exact<{
  updateSchoolInput: UpdateSchoolInput;
}>;


export type WebAdminUpdateSchoolMutation = { __typename?: 'Mutation', updateSchool: { __typename?: 'School', id: string, name: string, shortName: string, logo: string, address: string, city: string, state: string, zip: string, country: string, email: string, phone: string, website: string, createdAt: any, updatedAt: any, organization: { __typename?: 'Organization', id: string, name: string } } };

export type WebAdminGetSchoolsQueryVariables = Exact<{ [key: string]: never; }>;


export type WebAdminGetSchoolsQuery = { __typename?: 'Query', schools: Array<{ __typename?: 'School', id: string, organizationId: string, name: string, shortName: string, logo: string, address: string, city: string, state: string, zip: string, country: string, email: string, phone: string, website: string, currentYear: number, createdAt: any, updatedAt: any, organization: { __typename?: 'Organization', id: string, name: string } }> };

export type WebAdminRemoveSchoolMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type WebAdminRemoveSchoolMutation = { __typename?: 'Mutation', removeSchool: { __typename?: 'School', id: string, name: string, createdAt: any, updatedAt: any } };

export type WebAdminGetRolesForUserQueryVariables = Exact<{ [key: string]: never; }>;


export type WebAdminGetRolesForUserQuery = { __typename?: 'Query', roles: Array<{ __typename?: 'Role', id: string, name: string }> };

export type WebAdminGetOrganizationsForUserQueryVariables = Exact<{ [key: string]: never; }>;


export type WebAdminGetOrganizationsForUserQuery = { __typename?: 'Query', organizations: Array<{ __typename?: 'Organization', id: string, name: string }> };

export type WebAdminCreateUserMutationVariables = Exact<{
  createUserInput: CreateUserInput;
}>;


export type WebAdminCreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string, role?: { __typename?: 'Role', id: string, name: string } | null } };

export type WebAdminUpdateUserMutationVariables = Exact<{
  updateUserInput: UpdateUserInput;
}>;


export type WebAdminUpdateUserMutation = { __typename?: 'Mutation', updateUser: { __typename?: 'User', id: string, firstName: string, lastName: string, email: string, role?: { __typename?: 'Role', id: string, name: string } | null } };

export type WebAdminGetUsersQueryVariables = Exact<{
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
  search: Scalars['String']['input'];
}>;


export type WebAdminGetUsersQuery = { __typename?: 'Query', count: number, users: Array<{ __typename?: 'User', id: string, firstName: string, lastName: string, email: string, createdAt: any, updatedAt: any, roleId?: string | null, organizationId?: string | null, role?: { __typename?: 'Role', id: string, name: string } | null, organization?: { __typename?: 'Organization', id: string, name: string } | null }> };

export type WebAdminRemoveUserMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type WebAdminRemoveUserMutation = { __typename?: 'Mutation', removeUser: { __typename?: 'User', id: string, name?: string | null, createdAt: any, updatedAt: any } };

export type AdminClassGroupsBySchoolIdQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
  search: Scalars['String']['input'];
}>;


export type AdminClassGroupsBySchoolIdQuery = { __typename?: 'Query', count: number, classGroups: Array<{ __typename?: 'ClassGroup', id: string, name: string, teacherId?: string | null, studyPlanId: string, active: boolean, createdAt: any, updatedAt: any, teacher?: { __typename?: 'Teacher', id: string, name: string } | null, studyPlan: { __typename?: 'StudyPlan', id: string, name: string, createdAt: any, updatedAt: any } }> };

export type AdminRemoveClassGroupMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type AdminRemoveClassGroupMutation = { __typename?: 'Mutation', removeClassGroup: { __typename?: 'ClassGroup', id: string } };

export type AdminStudyPlansForCoursesQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type AdminStudyPlansForCoursesQuery = { __typename?: 'Query', studyPlansBySchoolId: Array<{ __typename?: 'StudyPlan', id: string, name: string }> };

export type AdminGetCoursesQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  studyPlanId?: InputMaybe<Scalars['String']['input']>;
}>;


export type AdminGetCoursesQuery = { __typename?: 'Query', count: number, courses: Array<{ __typename?: 'Course', id: string, name: string, shortName: string, schoolId: string, subjectId: string, studyPlanId: string, teacherId?: string | null, code: string, createdAt: any, updatedAt: any, subject: { __typename?: 'Subject', name: string }, studyPlan: { __typename?: 'StudyPlan', name: string }, teacher?: { __typename?: 'Teacher', id: string, name: string } | null }> };

export type AdminRemoveCourseMutationVariables = Exact<{
  removeCourseId: Scalars['String']['input'];
}>;


export type AdminRemoveCourseMutation = { __typename?: 'Mutation', removeCourse: { __typename?: 'Course', id: string } };

export type AdminDegreesBySchoolIdQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
}>;


export type AdminDegreesBySchoolIdQuery = { __typename?: 'Query', count: number, degreesBySchoolId: Array<{ __typename?: 'Degree', id: string, name: string, shortName: string, schoolId: string, createdAt: any, updatedAt: any, school: { __typename?: 'School', id: string, name: string } }> };

export type AdminRemoveDegreeMutationVariables = Exact<{
  removeDegreeId: Scalars['String']['input'];
}>;


export type AdminRemoveDegreeMutation = { __typename?: 'Mutation', removeDegree: { __typename?: 'Degree', id: string } };

export type AdminChargesBySchoolQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
  year?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AdminChargesBySchoolQuery = { __typename?: 'Query', chargesBySchool: Array<{ __typename?: 'Charge', id: string, amount: number, dueDate: any, description: string, chargeType: ChargeType, status: ChargeStatus, student: { __typename?: 'Student', id: string, firstName: string, fatherName: string }, studyPlan?: { __typename?: 'StudyPlan', id: string, name: string } | null }> };

export type AdminRemoveChargeMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type AdminRemoveChargeMutation = { __typename?: 'Mutation', removeCharge?: { __typename?: 'Charge', id: string } | null };

export type ClassGroupsFormTeachersByOrganizationIdQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type ClassGroupsFormTeachersByOrganizationIdQuery = { __typename?: 'Query', teachersByOrganizationId: Array<{ __typename?: 'Teacher', id: string, name: string }> };

export type ClassGroupsFormStudyPlansBySchoolIdQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type ClassGroupsFormStudyPlansBySchoolIdQuery = { __typename?: 'Query', studyPlansBySchoolId: Array<{ __typename?: 'StudyPlan', id: string, name: string }> };

export type ClassGroupsFormUpdateClassGroupMutationVariables = Exact<{
  updateClassGroupInput: UpdateClassGroupInput;
}>;


export type ClassGroupsFormUpdateClassGroupMutation = { __typename?: 'Mutation', updateClassGroup: { __typename?: 'ClassGroup', id: string, name: string } };

export type ClassGroupsFormCreateClassGroupMutationVariables = Exact<{
  createClassGroupInput: CreateClassGroupInput;
}>;


export type ClassGroupsFormCreateClassGroupMutation = { __typename?: 'Mutation', createClassGroup: { __typename?: 'ClassGroup', id: string, name: string } };

export type CoursesFormGetSubjectsQueryVariables = Exact<{
  take: Scalars['Int']['input'];
  orderBy?: InputMaybe<Scalars['String']['input']>;
}>;


export type CoursesFormGetSubjectsQuery = { __typename?: 'Query', subjects: Array<{ __typename?: 'Subject', id: string, name: string }> };

export type CoursesFormStudyPlansBySchoolIdQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type CoursesFormStudyPlansBySchoolIdQuery = { __typename?: 'Query', studyPlansBySchoolId: Array<{ __typename?: 'StudyPlan', id: string, name: string }> };

export type CoursesFormGetTeachersQueryVariables = Exact<{
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
}>;


export type CoursesFormGetTeachersQuery = { __typename?: 'Query', teachers: Array<{ __typename?: 'Teacher', id: string, name: string, initials: string }> };

export type CoursesFormCreateSubjectMutationVariables = Exact<{
  createSubjectInput: CreateSubjectInput;
}>;


export type CoursesFormCreateSubjectMutation = { __typename?: 'Mutation', createSubject: { __typename?: 'Subject', id: string, name: string, code: string } };

export type CoursesFormUpdateCourseMutationVariables = Exact<{
  updateCourseInput: UpdateCourseInput;
}>;


export type CoursesFormUpdateCourseMutation = { __typename?: 'Mutation', updateCourse: { __typename?: 'Course', id: string, name: string, shortName: string, code: string, subjectId: string, studyPlanId: string } };

export type CoursesFormCreateCourseMutationVariables = Exact<{
  createCourseInput: CreateCourseInput;
}>;


export type CoursesFormCreateCourseMutation = { __typename?: 'Mutation', createCourse: { __typename?: 'Course', id: string, name: string, shortName: string, code: string, subjectId: string, studyPlanId: string } };

export type CreateChargeFormStudentsBySchoolIdQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type CreateChargeFormStudentsBySchoolIdQuery = { __typename?: 'Query', studentsBySchoolId: Array<{ __typename?: 'Student', id: string, firstName: string, fatherName: string }> };

export type CreateChargeFormStudyPlansBySchoolIdQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type CreateChargeFormStudyPlansBySchoolIdQuery = { __typename?: 'Query', studyPlansBySchoolId: Array<{ __typename?: 'StudyPlan', id: string, name: string }> };

export type CreateChargeFormCreateChargeMutationVariables = Exact<{
  input: CreateChargeInput;
}>;


export type CreateChargeFormCreateChargeMutation = { __typename?: 'Mutation', createCharge: Array<{ __typename?: 'Charge', id: string }> };

export type DegreesFormGetSchoolsQueryVariables = Exact<{ [key: string]: never; }>;


export type DegreesFormGetSchoolsQuery = { __typename?: 'Query', schools: Array<{ __typename?: 'School', id: string, name: string }> };

export type DegreesFormUpdateDegreeMutationVariables = Exact<{
  updateDegreeInput: UpdateDegreeInput;
}>;


export type DegreesFormUpdateDegreeMutation = { __typename?: 'Mutation', updateDegree: { __typename?: 'Degree', id: string, name: string } };

export type DegreesFormCreateDegreeMutationVariables = Exact<{
  createDegreeInput: CreateDegreeInput;
}>;


export type DegreesFormCreateDegreeMutation = { __typename?: 'Mutation', createDegree: { __typename?: 'Degree', id: string, name: string } };

export type NewsletterFormGetNewsletterQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type NewsletterFormGetNewsletterQuery = { __typename?: 'Query', newsletter?: { __typename?: 'Newsletter', id: string, title: string, content: string, published: boolean } | null };

export type NewsletterFormUpdateNewsletterMutationVariables = Exact<{
  updateNewsletterInput: UpdateNewsletterInput;
}>;


export type NewsletterFormUpdateNewsletterMutation = { __typename?: 'Mutation', updateNewsletter: { __typename?: 'Newsletter', id: string } };

export type NewsletterFormCreateNewsletterMutationVariables = Exact<{
  createNewsletterInput: CreateNewsletterInput;
}>;


export type NewsletterFormCreateNewsletterMutation = { __typename?: 'Mutation', createNewsletter: { __typename?: 'Newsletter', id: string } };

export type StudyPlanFormGetGradeMetricsQueryVariables = Exact<{ [key: string]: never; }>;


export type StudyPlanFormGetGradeMetricsQuery = { __typename?: 'Query', gradeMetrics: Array<{ __typename?: 'GradeMetric', id: string, name: string }> };

export type StudyPlanFormDegreesBySchoolIdQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type StudyPlanFormDegreesBySchoolIdQuery = { __typename?: 'Query', degreesBySchoolId: Array<{ __typename?: 'Degree', id: string, name: string }> };

export type StudyPlanFormUpdateStudyPlanFinancialConfigMutationVariables = Exact<{
  input: UpdateStudyPlanFinancialInput;
}>;


export type StudyPlanFormUpdateStudyPlanFinancialConfigMutation = { __typename?: 'Mutation', updateStudyPlanFinancialConfig: { __typename?: 'StudyPlan', id: string } };

export type StudyPlanFormUpdateStudyPlanMutationVariables = Exact<{
  updateStudyPlanInput: UpdateStudyPlanInput;
}>;


export type StudyPlanFormUpdateStudyPlanMutation = { __typename?: 'Mutation', updateStudyPlan: { __typename?: 'StudyPlan', id: string, name: string } };

export type StudyPlanFormCreateStudyPlanMutationVariables = Exact<{
  createStudyPlanInput: CreateStudyPlanInput;
}>;


export type StudyPlanFormCreateStudyPlanMutation = { __typename?: 'Mutation', createStudyPlan: { __typename?: 'StudyPlan', id: string, name: string } };

export type SubjectsFormUpdateSubjectMutationVariables = Exact<{
  updateSubjectInput: UpdateSubjectInput;
}>;


export type SubjectsFormUpdateSubjectMutation = { __typename?: 'Mutation', updateSubject: { __typename?: 'Subject', id: string } };

export type SubjectsFormCreateSubjectMutationVariables = Exact<{
  createSubjectInput: CreateSubjectInput;
}>;


export type SubjectsFormCreateSubjectMutation = { __typename?: 'Mutation', createSubject: { __typename?: 'Subject', id: string } };

export type AdminPendingJoinRequestsQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminPendingJoinRequestsQuery = { __typename?: 'Query', pendingJoinRequests: Array<{ __typename?: 'PendingJoinRequest', id: string, requestedRole: string, documentId?: string | null, status: string, userId: string, userFirstName: string, userLastName: string, userEmail: string, userImage?: string | null, schoolId: string, schoolName: string, createdAt: any }> };

export type AdminApproveJoinRequestMutationVariables = Exact<{
  requestId: Scalars['String']['input'];
  approve: Scalars['Boolean']['input'];
}>;


export type AdminApproveJoinRequestMutation = { __typename?: 'Mutation', approveJoinRequest: boolean };

export type AdminGetNewslettersQueryVariables = Exact<{
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
}>;


export type AdminGetNewslettersQuery = { __typename?: 'Query', count: number, newsletters: Array<{ __typename?: 'Newsletter', id: string, title: string, published: boolean, publishedAt?: any | null, createdAt: any, updatedAt: any, school: { __typename?: 'School', id: string, name: string }, author: { __typename?: 'User', id: string, name?: string | null } }> };

export type AdminUpdateNewsletterMutationVariables = Exact<{
  updateNewsletterInput: UpdateNewsletterInput;
}>;


export type AdminUpdateNewsletterMutation = { __typename?: 'Mutation', updateNewsletter: { __typename?: 'Newsletter', id: string } };

export type AdminRemoveNewsletterMutationVariables = Exact<{
  removeNewsletterId: Scalars['String']['input'];
}>;


export type AdminRemoveNewsletterMutation = { __typename?: 'Mutation', removeNewsletter: { __typename?: 'Newsletter', id: string } };

export type AdminSchoolFormQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type AdminSchoolFormQuery = { __typename?: 'Query', school: { __typename?: 'School', id: string, name: string, shortName: string, email: string, phone: string, address: string, city: string, state: string, zip: string, country: string, website: string, logo: string, logoUrl?: string | null, primaryColor?: string | null, secondaryColor?: string | null, tertiaryColor?: string | null } };

export type AdminCreateSchoolLogoUploadUrlMutationVariables = Exact<{
  input: SchoolLogoUploadInput;
}>;


export type AdminCreateSchoolLogoUploadUrlMutation = { __typename?: 'Mutation', createSchoolLogoUploadUrl: { __typename?: 'SchoolLogoUploadUrl', uploadUrl: string, storageKey: string } };

export type AdminUpdateSchoolLogoMutationVariables = Exact<{
  id: Scalars['String']['input'];
  logo: Scalars['String']['input'];
}>;


export type AdminUpdateSchoolLogoMutation = { __typename?: 'Mutation', updateSchoolLogo: { __typename?: 'School', id: string, logo: string } };

export type AdminSchoolLogoDownloadUrlQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type AdminSchoolLogoDownloadUrlQuery = { __typename?: 'Query', schoolLogoDownloadUrl: { __typename?: 'SchoolLogoDownloadUrl', downloadUrl: string } };

export type AdminUpdateSchoolMutationVariables = Exact<{
  updateSchoolInput: UpdateSchoolInput;
}>;


export type AdminUpdateSchoolMutation = { __typename?: 'Mutation', updateSchool: { __typename?: 'School', id: string } };

export type AdminCreateSchoolMutationVariables = Exact<{
  createSchoolInput: CreateSchoolInput;
}>;


export type AdminCreateSchoolMutation = { __typename?: 'Mutation', createSchool: { __typename?: 'School', id: string } };

export type AdminSchoolQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type AdminSchoolQuery = { __typename?: 'Query', school: { __typename?: 'School', id: string, name: string, shortName: string, logo: string, logoUrl?: string | null, email: string, phone: string, website: string, address: string, city: string, state: string, zip: string, country: string, currentYear: number, createdAt: any, updatedAt: any } };

export type AdminGetSchoolsQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminGetSchoolsQuery = { __typename?: 'Query', schools: Array<{ __typename?: 'School', id: string, name: string, shortName: string, city: string, email: string, phone: string, address: string, state: string, zip: string, country: string, website: string, logo: string, logoUrl?: string | null, createdAt: any, updatedAt: any }> };

export type AdminRemoveSchoolMutationVariables = Exact<{
  removeSchoolId: Scalars['String']['input'];
}>;


export type AdminRemoveSchoolMutation = { __typename?: 'Mutation', removeSchool: { __typename?: 'School', id: string } };

export type AdminStudyPlansBySchoolIdQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type AdminStudyPlansBySchoolIdQuery = { __typename?: 'Query', studyPlansBySchoolId: Array<{ __typename?: 'StudyPlan', id: string, name: string, shortName: string, level: number, degreeId: string, gradeMetricId?: string | null, monthlyTuitionAmount?: number | null, tuitionMonths: Array<number>, schoolId: string, createdAt: any, updatedAt: any, gradeMetric?: { __typename?: 'GradeMetric', id: string, name: string } | null, degree: { __typename?: 'Degree', id: string, name: string }, enrollmentCosts?: Array<{ __typename?: 'StudyPlanEnrollmentCost', id: string, name: string, amount: number, order: number }> | null }> };

export type AdminRemoveStudyPlanMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type AdminRemoveStudyPlanMutation = { __typename?: 'Mutation', removeStudyPlan: { __typename?: 'StudyPlan', id: string } };

export type AdminGetSubjectsQueryVariables = Exact<{
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
}>;


export type AdminGetSubjectsQuery = { __typename?: 'Query', count: number, subjects: Array<{ __typename?: 'Subject', id: string, name: string, code: string, createdAt: any, updatedAt: any }> };

export type AdminRemoveSubjectMutationVariables = Exact<{
  removeSubjectId: Scalars['String']['input'];
}>;


export type AdminRemoveSubjectMutation = { __typename?: 'Mutation', removeSubject: { __typename?: 'Subject', id: string } };

export type AssignmentDatesBySchoolIdQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
  endDate: Scalars['String']['input'];
  classGroupId?: InputMaybe<Scalars['String']['input']>;
}>;


export type AssignmentDatesBySchoolIdQuery = { __typename?: 'Query', assignmentDatesBySchoolId: Array<{ __typename?: 'AssignmentDateWithDetails', id: string, date: any, classGroupId: string, classGroup: { __typename?: 'ClassGroup', id: string, name: string }, assignment: { __typename?: 'AssignmentDetails', id: string, title: string, details: string, type: string, requireSubmission: boolean, course: { __typename?: 'Course', id: string, name: string }, teacher: { __typename?: 'Teacher', id: string, firstName: string, fatherName: string } } }> };

export type CoursesBySchoolIdQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type CoursesBySchoolIdQuery = { __typename?: 'Query', coursesBySchoolId: Array<{ __typename?: 'Course', id: string, name: string }> };

export type ClassGroupsByCourseIdQueryVariables = Exact<{
  courseId: Scalars['String']['input'];
}>;


export type ClassGroupsByCourseIdQuery = { __typename?: 'Query', classGroupsByCourseId: Array<{ __typename?: 'ClassGroup', id: string, name: string }> };

export type TeachersByOrganizationIdQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type TeachersByOrganizationIdQuery = { __typename?: 'Query', teachersByOrganizationId: Array<{ __typename?: 'Teacher', id: string, name: string }> };

export type CreateAssignmentMutationVariables = Exact<{
  createAssignmentInput: CreateAssignmentInput;
}>;


export type CreateAssignmentMutation = { __typename?: 'Mutation', createAssignment: { __typename?: 'Assignment', id: string } };

export type MyAssignmentSubmissionQueryVariables = Exact<{
  assignmentId: Scalars['String']['input'];
}>;


export type MyAssignmentSubmissionQuery = { __typename?: 'Query', myAssignmentSubmission?: { __typename?: 'AssignmentSubmission', id: string, assignmentId: string, studentId: string, fileId: string, submittedAt: any, file: { __typename?: 'File', id: string, name: string, mimeType: string, size: number } } | null };

export type CreateSubmissionUploadUrlMutationVariables = Exact<{
  input: CreateSubmissionUploadInput;
}>;


export type CreateSubmissionUploadUrlMutation = { __typename?: 'Mutation', createSubmissionUploadUrl: { __typename?: 'SubmissionUploadUrl', uploadUrl: string, storageKey: string } };

export type CreateAssignmentSubmissionMutationVariables = Exact<{
  input: CreateAssignmentSubmissionInput;
}>;


export type CreateAssignmentSubmissionMutation = { __typename?: 'Mutation', createAssignmentSubmission: { __typename?: 'AssignmentSubmission', id: string, assignmentId: string, studentId: string, fileId: string, submittedAt: any, file: { __typename?: 'File', id: string, name: string, mimeType: string, size: number } } };

export type DeleteAssignmentSubmissionMutationVariables = Exact<{
  submissionId: Scalars['String']['input'];
}>;


export type DeleteAssignmentSubmissionMutation = { __typename?: 'Mutation', deleteAssignmentSubmission: boolean };

export type CreateSubmissionDownloadUrlMutationVariables = Exact<{
  fileId: Scalars['String']['input'];
}>;


export type CreateSubmissionDownloadUrlMutation = { __typename?: 'Mutation', createSubmissionDownloadUrl: { __typename?: 'SubmissionDownloadUrl', downloadUrl: string } };

export type StudentsForAssignmentQueryVariables = Exact<{
  assignmentId: Scalars['String']['input'];
}>;


export type StudentsForAssignmentQuery = { __typename?: 'Query', studentsForAssignment: Array<{ __typename?: 'Student', id: string, firstName: string, middleName: string, fatherName: string, motherName: string, assignmentSubmissions: Array<{ __typename?: 'StudentAssignmentSubmission', id: string, submittedAt: any, file: { __typename?: 'StudentSubmissionFile', id: string, name: string, mimeType: string, size: number } }> }> };

export type AssignmentQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type AssignmentQuery = { __typename?: 'Query', assignment: { __typename?: 'Assignment', id: string, title: string, details: string, date: any, createdAt: any, updatedAt: any, requireSubmission: boolean, course: { __typename?: 'Course', id: string, name: string }, teacher: { __typename?: 'Teacher', id: string, firstName: string, fatherName: string, user?: { __typename?: 'User', id: string } | null } } };

export type AttendanceFormStudentsForAttendanceQueryVariables = Exact<{
  courseId: Scalars['String']['input'];
  classGroupId: Scalars['String']['input'];
}>;


export type AttendanceFormStudentsForAttendanceQuery = { __typename?: 'Query', studentsForAttendance: Array<{ __typename?: 'Student', id: string, firstName: string, middleName: string, fatherName: string, motherName: string, classGroup?: { __typename?: 'ClassGroup', id: string, name: string } | null }> };

export type AttendanceFormCreateAttendanceSessionMutationVariables = Exact<{
  input: CreateAttendanceSessionInput;
}>;


export type AttendanceFormCreateAttendanceSessionMutation = { __typename?: 'Mutation', createAttendanceSession: { __typename?: 'AttendanceSession', id: string, date: any, classGroup: { __typename?: 'ClassGroup', id: string, name: string } } };

export type AttendanceFormUpdateAttendanceRecordsMutationVariables = Exact<{
  inputs: Array<UpdateAttendanceRecordInput> | UpdateAttendanceRecordInput;
}>;


export type AttendanceFormUpdateAttendanceRecordsMutation = { __typename?: 'Mutation', updateAttendanceRecords: Array<{ __typename?: 'AttendanceRecord', id: string, status: AttendanceStatus, comment?: string | null }> };

export type ForgotPasswordLookupAccountForPasswordResetQueryVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type ForgotPasswordLookupAccountForPasswordResetQuery = { __typename?: 'Query', lookupAccountForPasswordReset: { __typename?: 'LookupAccountForPasswordResetResult', found: boolean, roleLabel?: string | null, displayName?: string | null, organizationName?: string | null } };

export type RegisterValidateEmailTokenQueryVariables = Exact<{
  token: Scalars['String']['input'];
  email: Scalars['String']['input'];
}>;


export type RegisterValidateEmailTokenQuery = { __typename?: 'Query', validateEmailToken: boolean };

export type RegisterCheckPendingInvitationQueryVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type RegisterCheckPendingInvitationQuery = { __typename?: 'Query', checkPendingInvitation: { __typename?: 'CheckPendingInvitationResult', hasPendingInvitation: boolean, role?: string | null, organizationName?: string | null } };

export type RegisterSendVerificationLinkMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type RegisterSendVerificationLinkMutation = { __typename?: 'Mutation', sendVerificationLink: boolean };

export type RegisterCreateInvitationAccessLinkMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type RegisterCreateInvitationAccessLinkMutation = { __typename?: 'Mutation', createInvitationAccessLink: { __typename?: 'CreateInvitationAccessLinkResult', url: string } };

export type RegisterSignUpMutationVariables = Exact<{
  input: SignUpInput;
}>;


export type RegisterSignUpMutation = { __typename?: 'Mutation', signUp: { __typename?: 'AuthPayload', accessToken: string } };

export type ResetPasswordResendUserInvitationMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type ResetPasswordResendUserInvitationMutation = { __typename?: 'Mutation', resendUserInvitation: boolean };

export type AuthMeQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthMeQuery = { __typename?: 'Query', me: { __typename?: 'User', id: string, email: string, firstName: string, lastName: string, color?: string | null, themePreference?: string | null, onboardingStep?: string | null, organizationId?: string | null, teacher?: { __typename?: 'UserTeacher', id: string, firstName: string, fatherName: string } | null, student?: { __typename?: 'UserStudent', id: string, firstName: string, fatherName: string, classGroupId?: string | null } | null, role?: { __typename?: 'Role', name: string, permissions: Array<{ __typename?: 'Permission', id: string, descriptiveId: string, description: string }> } | null } };

export type AuthLoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type AuthLoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', accessToken: string } };

export type AuthResetPasswordMutationVariables = Exact<{
  token: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
}>;


export type AuthResetPasswordMutation = { __typename?: 'Mutation', resetPassword: { __typename?: 'AuthPayload', accessToken: string } };

export type AuthIsEmailVerifiedQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthIsEmailVerifiedQuery = { __typename?: 'Query', isEmailVerified: boolean };

export type UpdateThemePreferenceMutationVariables = Exact<{
  themePreference: Scalars['String']['input'];
}>;


export type UpdateThemePreferenceMutation = { __typename?: 'Mutation', updateThemePreference: { __typename?: 'User', id: string, themePreference?: string | null } };

export type AuthOnboardingStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthOnboardingStatusQuery = { __typename?: 'Query', onboardingStatus: { __typename?: 'OnboardingStatus', onboardingCompleted: boolean, schoolId?: string | null, schoolName?: string | null, degreesCount: number, studyPlansCount: number, coursesCount: number, groupsCount: number } };

export type ChatsMyChatsQueryVariables = Exact<{ [key: string]: never; }>;


export type ChatsMyChatsQuery = { __typename?: 'Query', myChats: Array<{ __typename?: 'Chat', id: string, name?: string | null, type: ChatType, courseId?: string | null, assignmentId?: string | null, classGroupId?: string | null, createdAt: any, updatedAt: any, participants: Array<{ __typename?: 'ChatParticipant', id: string, userId: string, role: ChatParticipantRole, user: { __typename?: 'User', id: string, firstName: string, lastName: string, initials: string, color?: string | null, role?: { __typename?: 'Role', name: string } | null, student?: { __typename?: 'UserStudent', id: string, classGroup?: { __typename?: 'ClassGroupRef', id: string, name: string } | null } | null } }>, createdBy?: { __typename?: 'User', id: string, firstName: string, lastName: string, initials: string } | null }> };

export type ChatsChatQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type ChatsChatQuery = { __typename?: 'Query', chat?: { __typename?: 'Chat', id: string, name?: string | null, type: ChatType, courseId?: string | null, assignmentId?: string | null, classGroupId?: string | null, createdAt: any, updatedAt: any, participants: Array<{ __typename?: 'ChatParticipant', id: string, userId: string, role: ChatParticipantRole, user: { __typename?: 'User', id: string, firstName: string, lastName: string, initials: string, color?: string | null, role?: { __typename?: 'Role', name: string } | null, student?: { __typename?: 'UserStudent', id: string, classGroup?: { __typename?: 'ClassGroupRef', id: string, name: string } | null } | null } }>, createdBy?: { __typename?: 'User', id: string, firstName: string, lastName: string, initials: string } | null } | null };

export type ChatsChatMessagesQueryVariables = Exact<{
  input: ChatMessagesInput;
}>;


export type ChatsChatMessagesQuery = { __typename?: 'Query', chatMessages: Array<{ __typename?: 'ChatMessage', id: string, chatId: string, senderId?: string | null, content: string, createdAt: any, sender?: { __typename?: 'User', id: string, firstName: string, lastName: string, initials: string, color?: string | null, role?: { __typename?: 'Role', name: string } | null, student?: { __typename?: 'UserStudent', id: string, classGroup?: { __typename?: 'ClassGroupRef', id: string, name: string } | null } | null } | null }> };

export type ChatsCreateDirectChatMutationVariables = Exact<{
  recipientId: Scalars['String']['input'];
}>;


export type ChatsCreateDirectChatMutation = { __typename?: 'Mutation', createDirectChat: { __typename?: 'Chat', id: string, name?: string | null, type: ChatType, participants: Array<{ __typename?: 'ChatParticipant', id: string, user: { __typename?: 'User', id: string, firstName: string, lastName: string, initials: string } }> } };

export type ChatsCreateGroupChatMutationVariables = Exact<{
  input: CreateGroupChatInput;
}>;


export type ChatsCreateGroupChatMutation = { __typename?: 'Mutation', createGroupChat: { __typename?: 'Chat', id: string, name?: string | null, type: ChatType, participants: Array<{ __typename?: 'ChatParticipant', id: string, user: { __typename?: 'User', id: string, firstName: string, lastName: string, initials: string } }> } };

export type ChatsCreateContextualChatMutationVariables = Exact<{
  input: CreateContextualChatInput;
}>;


export type ChatsCreateContextualChatMutation = { __typename?: 'Mutation', createContextualChat: { __typename?: 'Chat', id: string, name?: string | null, type: ChatType, courseId?: string | null, assignmentId?: string | null, classGroupId?: string | null, participants: Array<{ __typename?: 'ChatParticipant', id: string, user: { __typename?: 'User', id: string, firstName: string, lastName: string, initials: string } }> } };

export type ChatsSendMessageMutationVariables = Exact<{
  input: SendMessageInput;
}>;


export type ChatsSendMessageMutation = { __typename?: 'Mutation', sendMessage: { __typename?: 'ChatMessage', id: string, chatId: string, senderId?: string | null, content: string, createdAt: any, sender?: { __typename?: 'User', id: string, firstName: string, lastName: string, initials: string, color?: string | null } | null } };

export type ChatsMarkChatReadMutationVariables = Exact<{
  chatId: Scalars['String']['input'];
}>;


export type ChatsMarkChatReadMutation = { __typename?: 'Mutation', markChatRead?: { __typename?: 'ChatParticipant', id: string, lastReadAt?: any | null } | null };

export type ChatsUnreadCountQueryVariables = Exact<{ [key: string]: never; }>;


export type ChatsUnreadCountQuery = { __typename?: 'Query', chatUnreadCount: number };

export type ChatsMessageReceivedSubscriptionVariables = Exact<{
  chatId?: InputMaybe<Scalars['String']['input']>;
}>;


export type ChatsMessageReceivedSubscription = { __typename?: 'Subscription', messageReceived: { __typename?: 'ChatMessage', id: string, chatId: string, senderId?: string | null, content: string, createdAt: any, sender?: { __typename?: 'User', id: string, firstName: string, lastName: string, initials: string, color?: string | null, role?: { __typename?: 'Role', name: string } | null, student?: { __typename?: 'UserStudent', id: string, classGroup?: { __typename?: 'ClassGroupRef', id: string, name: string } | null } | null } | null } };

export type ComposeCreateMessageMutationVariables = Exact<{
  createMessageInput: CreateMessageInput;
}>;


export type ComposeCreateMessageMutation = { __typename?: 'Mutation', createMessage: { __typename?: 'Message', id: string } };

export type ContactsFindContactsQueryVariables = Exact<{
  queryText?: InputMaybe<Scalars['String']['input']>;
}>;


export type ContactsFindContactsQuery = { __typename?: 'Query', findContacts: Array<{ __typename?: 'User', id: string, initials: string, name?: string | null, email: string, color?: string | null, role?: { __typename?: 'Role', id: string, name: string } | null, student?: { __typename?: 'UserStudent', id: string, classGroup?: { __typename?: 'ClassGroupRef', id: string, name: string } | null } | null, teacher?: { __typename?: 'UserTeacher', id: string } | null }> };

export type AssignmentDatesByCourseIdQueryVariables = Exact<{
  courseId: Scalars['String']['input'];
  endDate: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
  classGroupId?: InputMaybe<Scalars['String']['input']>;
}>;


export type AssignmentDatesByCourseIdQuery = { __typename?: 'Query', assignmentDatesByCourseId: Array<{ __typename?: 'AssignmentDateWithDetails', id: string, date: any, classGroupId: string, classGroup: { __typename?: 'ClassGroup', id: string, name: string }, assignment: { __typename?: 'AssignmentDetails', id: string, title: string, details: string, type: string, requireSubmission: boolean } }> };

export type CourseAttendanceClassGroupsByCourseIdQueryVariables = Exact<{
  courseId: Scalars['String']['input'];
}>;


export type CourseAttendanceClassGroupsByCourseIdQuery = { __typename?: 'Query', classGroupsByCourseId: Array<{ __typename?: 'ClassGroup', id: string, name: string, studyPlan: { __typename?: 'StudyPlan', id: string, name: string } }> };

export type CourseAttendanceAttendanceSessionsQueryVariables = Exact<{
  courseId: Scalars['String']['input'];
  classGroupId?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
}>;


export type CourseAttendanceAttendanceSessionsQuery = { __typename?: 'Query', attendanceSessionsCount: number, attendanceSessions: Array<{ __typename?: 'AttendanceSession', id: string, date: any, courseId: string, classGroupId: string, teacherId: string, createdAt: any, updatedAt: any, classGroup: { __typename?: 'ClassGroup', id: string, name: string }, records: Array<{ __typename?: 'AttendanceRecord', id: string, studentId: string, status: AttendanceStatus, comment?: string | null, student: { __typename?: 'Student', id: string, firstName: string, middleName: string, fatherName: string, motherName: string, classGroup?: { __typename?: 'ClassGroup', id: string, name: string } | null } }> }> };

export type CourseAttendanceDeleteAttendanceSessionMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type CourseAttendanceDeleteAttendanceSessionMutation = { __typename?: 'Mutation', deleteAttendanceSession: { __typename?: 'AttendanceSession', id: string } };

export type CreateFileUploadUrlMutationVariables = Exact<{
  createFileUploadInput: CreateFileUploadInput;
}>;


export type CreateFileUploadUrlMutation = { __typename?: 'Mutation', createFileUploadUrl: { __typename?: 'FileUploadUrl', uploadUrl: string, storageKey: string } };

export type CreateFileMutationVariables = Exact<{
  createFileInput: CreateFileInput;
}>;


export type CreateFileMutation = { __typename?: 'Mutation', createFile: { __typename?: 'File', id: string } };

export type ShareFileMutationVariables = Exact<{
  shareFileInput: ShareFileInput;
}>;


export type ShareFileMutation = { __typename?: 'Mutation', shareFile: { __typename?: 'File', id: string } };

export type FilesForCourseQueryVariables = Exact<{
  courseId: Scalars['String']['input'];
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type FilesForCourseQuery = { __typename?: 'Query', filesForCourse: Array<{ __typename?: 'File', id: string, name: string, mimeType: string, size: number, access?: string | null, updatedAt: any }> };

export type CreateFileDownloadUrlMutationVariables = Exact<{
  createFileDownloadInput: CreateFileDownloadInput;
}>;


export type CreateFileDownloadUrlMutation = { __typename?: 'Mutation', createFileDownloadUrl: { __typename?: 'FileDownloadUrl', downloadUrl: string } };

export type CourseGradeBucketsQueryVariables = Exact<{
  courseId: Scalars['String']['input'];
}>;


export type CourseGradeBucketsQuery = { __typename?: 'Query', gradeBucketsByCourseId: Array<{ __typename?: 'GradeBucket', id: string, name: string, weight: number, courseId: string, createdAt: any, updatedAt: any }> };

export type PeriodsByYearQueryVariables = Exact<{
  year: Scalars['Int']['input'];
}>;


export type PeriodsByYearQuery = { __typename?: 'Query', periodsByYear: Array<{ __typename?: 'Period', id: string, name: string, startDate: any, endDate: any }> };

export type StudentsByCourseIdQueryVariables = Exact<{
  courseId: Scalars['String']['input'];
  periodId: Scalars['String']['input'];
}>;


export type StudentsByCourseIdQuery = { __typename?: 'Query', studentsByCourseId: Array<{ __typename?: 'Student', id: string, name: string, initials: string, color: string, averageScore: number, classGroup?: { __typename?: 'ClassGroup', id: string, name: string } | null }> };

export type GradesByCourseIdQueryVariables = Exact<{
  courseId: Scalars['String']['input'];
  periodId: Scalars['String']['input'];
}>;


export type GradesByCourseIdQuery = { __typename?: 'Query', gradesByCourseId: Array<{ __typename?: 'Grade', id: string, title: string, comments?: string | null, published: boolean, date: any, createdAt: any, updatedAt: any, bucket: { __typename?: 'GradeBucket', id: string, name: string }, studentGrades: Array<{ __typename?: 'StudentGrade', id: string, score?: number | null, comments?: string | null, updatedAt: any, student: { __typename?: 'Student', id: string, firstName: string, fatherName: string, averageScoreForStudent: number } }> }> };

export type StudentGradesByCourseIdQueryVariables = Exact<{
  courseId: Scalars['String']['input'];
  periodId: Scalars['String']['input'];
  studentId: Scalars['String']['input'];
}>;


export type StudentGradesByCourseIdQuery = { __typename?: 'Query', average: number, studentGradesByCourseId: Array<{ __typename?: 'StudentGrade', id: string, score?: number | null, comments?: string | null, grade: { __typename?: 'Grade', id: string, title: string, date: any, comments?: string | null, bucket: { __typename?: 'GradeBucket', id: string, name: string } } }> };

export type CourseQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type CourseQuery = { __typename?: 'Query', course: { __typename?: 'Course', id: string, name: string, shortName: string, code: string, createdAt: any, updatedAt: any, subject: { __typename?: 'Subject', id: string, name: string }, teacher?: { __typename?: 'Teacher', id: string, name: string, color?: string | null, initials: string, user?: { __typename?: 'User', id: string } | null } | null, studyPlan: { __typename?: 'StudyPlan', id: string, name: string, gradeMetric?: { __typename?: 'GradeMetric', id: string, name: string, minimumApproval: number, minimumExcellence: number, maximum: number, minimum: number, createdAt: any, updatedAt: any } | null } } };

export type GetCoursesQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetCoursesQuery = { __typename?: 'Query', count: number, courses: Array<{ __typename?: 'Course', id: string, name: string, shortName: string, schoolId: string, subjectId: string, studyPlanId: string, teacherId?: string | null, code: string, createdAt: any, updatedAt: any, subject: { __typename?: 'Subject', name: string }, studyPlan: { __typename?: 'StudyPlan', name: string }, teacher?: { __typename?: 'Teacher', id: string, name: string } | null }> };

export type GetSchoolsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSchoolsQuery = { __typename?: 'Query', schools: Array<{ __typename?: 'School', id: string, name: string, slug?: string | null, organizationId: string, shortName: string, logo: string, logoUrl?: string | null, address: string, city: string, state: string, zip: string, country: string, email: string, phone: string, currencyCode: string, currentYear: number, website: string, primaryColor?: string | null, secondaryColor?: string | null, tertiaryColor?: string | null, createdAt: any, updatedAt: any }> };

export type UnreadMessagesCountQueryVariables = Exact<{ [key: string]: never; }>;


export type UnreadMessagesCountQuery = { __typename?: 'Query', unreadMessagesCount: number };

export type FileShareFormCoursesBySchoolIdQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type FileShareFormCoursesBySchoolIdQuery = { __typename?: 'Query', coursesBySchoolId: Array<{ __typename?: 'Course', id: string, name: string }> };

export type FileShareFormShareFileMutationVariables = Exact<{
  shareFileInput: ShareFileInput;
}>;


export type FileShareFormShareFileMutation = { __typename?: 'Mutation', shareFile: { __typename?: 'File', id: string } };

export type FileShareFormRemoveShareMutationVariables = Exact<{
  removeShareInput: RemoveShareInput;
}>;


export type FileShareFormRemoveShareMutation = { __typename?: 'Mutation', removeShare: { __typename?: 'File', id: string } };

export type FilesSharedWithMeQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type FilesSharedWithMeQuery = { __typename?: 'Query', filesSharedWithMe: Array<{ __typename?: 'File', id: string, name: string, mimeType: string, size: number, access?: string | null, updatedAt: any, sharesCourses: Array<{ __typename?: 'FileShareCourse', course: { __typename?: 'Course', id: string, name: string } }>, sharesUsers: Array<{ __typename?: 'FileShareUser', user: { __typename?: 'User', id: string, name?: string | null, initials: string, color?: string | null } }>, sharesSchools: Array<{ __typename?: 'FileShareSchool', school: { __typename?: 'School', id: string, name: string } }>, sharesClassGroups: Array<{ __typename?: 'FileShareClassGroup', classGroup: { __typename?: 'ClassGroup', id: string, name: string } }>, owner: { __typename?: 'User', id: string, name?: string | null, initials: string, color?: string | null } }> };

export type FilesOwnedQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type FilesOwnedQuery = { __typename?: 'Query', filesOwned: Array<{ __typename?: 'File', id: string, name: string, mimeType: string, size: number, access?: string | null, updatedAt: any, sharesCourses: Array<{ __typename?: 'FileShareCourse', course: { __typename?: 'Course', id: string, name: string } }>, owner: { __typename?: 'User', id: string, name?: string | null, initials: string, color?: string | null } }> };

export type FilesCreateFileDownloadUrlMutationVariables = Exact<{
  createFileDownloadInput: CreateFileDownloadInput;
}>;


export type FilesCreateFileDownloadUrlMutation = { __typename?: 'Mutation', createFileDownloadUrl: { __typename?: 'FileDownloadUrl', downloadUrl: string } };

export type GradeBucketsFormUpdateGradeBucketMutationVariables = Exact<{
  updateGradeBucketInput: UpdateGradeBucketInput;
}>;


export type GradeBucketsFormUpdateGradeBucketMutation = { __typename?: 'Mutation', updateGradeBucket: { __typename?: 'GradeBucket', id: string, name: string, weight: number, courseId: string, createdAt: any, updatedAt: any } };

export type GradeBucketsFormCreateGradeBucketMutationVariables = Exact<{
  createGradeBucketInput: CreateGradeBucketInput;
}>;


export type GradeBucketsFormCreateGradeBucketMutation = { __typename?: 'Mutation', createGradeBucket: { __typename?: 'GradeBucket', id: string, name: string, weight: number, courseId: string, createdAt: any, updatedAt: any } };

export type PeriodsByYearForReportQueryVariables = Exact<{
  year: Scalars['Int']['input'];
}>;


export type PeriodsByYearForReportQuery = { __typename?: 'Query', periodsByYear: Array<{ __typename?: 'Period', id: string, name: string, shortName: string, startDate: any, endDate: any }> };

export type GradeReportQueryVariables = Exact<{
  studentId: Scalars['String']['input'];
  periodId: Scalars['String']['input'];
}>;


export type GradeReportQuery = { __typename?: 'Query', gradeReport: { __typename?: 'GradeReport', schoolName: string, schoolLogoUrl?: string | null, periodName: string, studentName: string, documentId: string, classGroupName?: string | null, teacherName?: string | null, studyPlanName?: string | null, level?: number | null, periods: Array<{ __typename?: 'GradeReportPeriodInfo', id: string, name: string, shortName: string }>, gradesRows: Array<{ __typename?: 'GradeReportGradesRow', courseId: string, courseName: string, periodAverages: Array<number | null>, cumulativeAverage?: number | null }>, overallGradesRow?: { __typename?: 'GradeReportOverallRow', periodAverages: Array<number | null>, cumulativeAverage?: number | null } | null, attendanceRows: Array<{ __typename?: 'GradeReportAttendanceRow', courseId: string, courseName: string, periodAttendance: Array<{ __typename?: 'GradeReportPeriodAttendance', periodId: string, absent: number, late: number }> }>, habitRows: Array<{ __typename?: 'GradeReportHabitRow', metricName: string, value: string }> } };

export type GradeQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GradeQuery = { __typename?: 'Query', grade: { __typename?: 'Grade', id: string, title: string, comments?: string | null, date: any, courseId: string, published: boolean, createdAt: any, updatedAt: any, course: { __typename?: 'Course', id: string, name: string, studyPlan: { __typename?: 'StudyPlan', id: string, name: string, gradeMetric?: { __typename?: 'GradeMetric', id: string, name: string, minimum: number, maximum: number, minimumApproval: number, minimumExcellence: number } | null } }, bucket: { __typename?: 'GradeBucket', id: string, name: string, weight: number }, period: { __typename?: 'Period', id: string, name: string }, studentGrades: Array<{ __typename?: 'StudentGrade', id: string, score?: number | null, comments?: string | null, updatedAt: any, student: { __typename?: 'Student', id: string, firstName: string, fatherName: string, classGroup?: { __typename?: 'ClassGroup', id: string, name: string } | null } }> } };

export type UpdateGradeMutationVariables = Exact<{
  updateGradeInput: UpdateGradeInput;
}>;


export type UpdateGradeMutation = { __typename?: 'Mutation', updateGrade: { __typename?: 'Grade', id: string, published: boolean } };

export type RemoveGradeMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type RemoveGradeMutation = { __typename?: 'Mutation', removeGrade: { __typename?: 'Grade', id: string } };

export type GradeBucketsByCourseIdQueryVariables = Exact<{
  courseId: Scalars['String']['input'];
}>;


export type GradeBucketsByCourseIdQuery = { __typename?: 'Query', gradeBucketsByCourseId: Array<{ __typename?: 'GradeBucket', id: string, name: string, weight: number }> };

export type CreateGradeMutationVariables = Exact<{
  createGradeInput: CreateGradeInput;
}>;


export type CreateGradeMutation = { __typename?: 'Mutation', createGrade: { __typename?: 'Grade', id: string, title: string, comments?: string | null, bucketId: string, published: boolean, date: any } };

export type GroupHabitsGetPeriodsQueryVariables = Exact<{ [key: string]: never; }>;


export type GroupHabitsGetPeriodsQuery = { __typename?: 'Query', periods: Array<{ __typename?: 'Period', id: string, name: string, year: number, startDate: any, endDate: any }> };

export type GroupHabitsGetHabitMetricsQueryVariables = Exact<{ [key: string]: never; }>;


export type GroupHabitsGetHabitMetricsQuery = { __typename?: 'Query', habitMetrics: Array<{ __typename?: 'HabitMetric', id: string, name: string, description?: string | null, active: boolean, order: number }> };

export type GroupHabitsGetHabitEvaluationsQueryVariables = Exact<{
  classGroupId: Scalars['String']['input'];
  periodId: Scalars['String']['input'];
}>;


export type GroupHabitsGetHabitEvaluationsQuery = { __typename?: 'Query', habitEvaluationsByGroup: Array<{ __typename?: 'HabitEvaluation', id: string, habitMetricId: string, studentEvaluations: Array<{ __typename?: 'StudentHabitEvaluation', id: string, studentId: string, value: HabitValue, comments?: string | null }> }> };

export type GroupHabitsSaveHabitEvaluationMutationVariables = Exact<{
  saveHabitEvaluationInput: SaveHabitEvaluationInput;
}>;


export type GroupHabitsSaveHabitEvaluationMutation = { __typename?: 'Mutation', saveHabitEvaluation: { __typename?: 'HabitEvaluation', id: string, published: boolean } };

export type GroupScheduleFormCoursesByGroupIdQueryVariables = Exact<{
  groupId: Scalars['String']['input'];
}>;


export type GroupScheduleFormCoursesByGroupIdQuery = { __typename?: 'Query', coursesByGroupId: Array<{ __typename?: 'Course', id: string, name: string }> };

export type GroupScheduleFormUpdateGroupsScheduleMutationVariables = Exact<{
  updateGroupsScheduleInput: UpdateGroupsScheduleInput;
}>;


export type GroupScheduleFormUpdateGroupsScheduleMutation = { __typename?: 'Mutation', updateGroupsSchedule: { __typename?: 'GroupsSchedule', id: string } };

export type GroupScheduleFormCreateGroupsScheduleMutationVariables = Exact<{
  createGroupsScheduleInput: CreateGroupsScheduleInput;
}>;


export type GroupScheduleFormCreateGroupsScheduleMutation = { __typename?: 'Mutation', createGroupsSchedule: { __typename?: 'GroupsSchedule', id: string } };

export type GroupScheduleGroupsSchedulesByClassGroupIdQueryVariables = Exact<{
  classGroupId: Scalars['String']['input'];
}>;


export type GroupScheduleGroupsSchedulesByClassGroupIdQuery = { __typename?: 'Query', groupsSchedulesByClassGroupId: Array<{ __typename?: 'GroupsSchedule', id: string, weekday: string, startTime: string, endTime: string, location: string, remote: boolean, remoteLink: string, courseId: string, course: { __typename?: 'Course', id: string, name: string, subject: { __typename?: 'Subject', name: string }, teacher?: { __typename?: 'Teacher', user?: { __typename?: 'User', firstName: string, lastName: string } | null } | null } }> };

export type GroupScheduleUpdateGroupsScheduleMutationVariables = Exact<{
  updateGroupsScheduleInput: UpdateGroupsScheduleInput;
}>;


export type GroupScheduleUpdateGroupsScheduleMutation = { __typename?: 'Mutation', updateGroupsSchedule: { __typename?: 'GroupsSchedule', id: string } };

export type ClassGroupQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type ClassGroupQuery = { __typename?: 'Query', classGroup: { __typename?: 'ClassGroup', id: string, name: string, createdAt: any, updatedAt: any, teacherId?: string | null, studyPlanId: string, students: Array<{ __typename?: 'Student', id: string, name: string, email: string, documentId: string, initials: string, user: { __typename?: 'User', color?: string | null } }>, courses: Array<{ __typename?: 'Course', id: string, name: string, code: string, subject: { __typename?: 'Subject', id: string, name: string }, teacher?: { __typename?: 'Teacher', id: string, name: string } | null }>, teacher?: { __typename?: 'Teacher', id: string, name: string, color?: string | null, initials: string, user?: { __typename?: 'User', id: string } | null } | null, studyPlan: { __typename?: 'StudyPlan', id: string, name: string, degree: { __typename?: 'Degree', id: string, name: string } } } };

export type GetClassGroupsQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
}>;


export type GetClassGroupsQuery = { __typename?: 'Query', count: number, classGroups: Array<{ __typename?: 'ClassGroup', id: string, name: string, createdAt: any, updatedAt: any, teacherId?: string | null, studyPlanId: string, teacher?: { __typename?: 'Teacher', id: string, name: string } | null, studyPlan: { __typename?: 'StudyPlan', id: string, name: string } }> };

export type OnboardingStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type OnboardingStatusQuery = { __typename?: 'Query', onboardingStatus: { __typename?: 'OnboardingStatus', onboardingCompleted: boolean, schoolName?: string | null, degreesCount: number, studyPlansCount: number, coursesCount: number, groupsCount: number } };

export type AdminDashboardStatsQueryVariables = Exact<{
  schoolId?: InputMaybe<Scalars['String']['input']>;
}>;


export type AdminDashboardStatsQuery = { __typename?: 'Query', coursesCount: number, findManyStudentsCount: number, findManyTeachersCount: number, findManySubjectsCount: number };

export type RecentMessagesQueryVariables = Exact<{
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
}>;


export type RecentMessagesQuery = { __typename?: 'Query', findManyMessages: Array<{ __typename?: 'MessageRecipient', id: string, createdAt: any, message: { __typename?: 'Message', id: string, subject: string, createdAt: any, sender: { __typename?: 'User', id: string, name?: string | null } } }> };

export type RecentStudentsQueryVariables = Exact<{
  take: Scalars['Int']['input'];
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
}>;


export type RecentStudentsQuery = { __typename?: 'Query', students: Array<{ __typename?: 'Student', id: string, fullName: string, createdAt: any, classGroup?: { __typename?: 'ClassGroup', name: string } | null }> };

export type RecentNewslettersQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
  take: Scalars['Int']['input'];
}>;


export type RecentNewslettersQuery = { __typename?: 'Query', publishedNewsletters: Array<{ __typename?: 'Newsletter', id: string, title: string, content: string, publishedAt?: any | null, author: { __typename?: 'User', id: string, name?: string | null } }> };

export type RecentTeachersQueryVariables = Exact<{
  take: Scalars['Int']['input'];
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  schoolId?: InputMaybe<Scalars['String']['input']>;
}>;


export type RecentTeachersQuery = { __typename?: 'Query', teachers: Array<{ __typename?: 'Teacher', id: string, fullName: string, createdAt: any, user?: { __typename?: 'User', email: string } | null }> };

export type MessageFindMessageByIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type MessageFindMessageByIdQuery = { __typename?: 'Query', findMessageById: { __typename?: 'Message', id: string, subject: string, content: string, createdAt: any, sender: { __typename?: 'User', id: string, initials: string, name?: string | null, email: string, role?: { __typename?: 'Role', id: string, name: string } | null, student?: { __typename?: 'UserStudent', id: string } | null, teacher?: { __typename?: 'UserTeacher', id: string } | null }, recipients: Array<{ __typename?: 'MessageRecipient', id: string, user: { __typename?: 'User', id: string, initials: string, name?: string | null, email: string, role?: { __typename?: 'Role', id: string, name: string } | null, student?: { __typename?: 'UserStudent', id: string } | null, teacher?: { __typename?: 'UserTeacher', id: string } | null } }>, replies: Array<{ __typename?: 'Message', id: string, content: string, createdAt: any, parentMessageId?: string | null, sender: { __typename?: 'User', id: string, initials: string, name?: string | null, email: string } }> } };

export type MessageMarkAsReadMutationVariables = Exact<{
  messageId: Scalars['String']['input'];
}>;


export type MessageMarkAsReadMutation = { __typename?: 'Mutation', markMessageAsRead?: { __typename?: 'MessageRecipient', id: string, readAt?: any | null } | null };

export type MessageCreateMessageMutationVariables = Exact<{
  createMessageInput: CreateMessageInput;
}>;


export type MessageCreateMessageMutation = { __typename?: 'Mutation', createMessage: { __typename?: 'Message', id: string } };

export type MessagesFindManyMessagesQueryVariables = Exact<{
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
}>;


export type MessagesFindManyMessagesQuery = { __typename?: 'Query', count: number, findManyMessages: Array<{ __typename?: 'MessageRecipient', id: string, readAt?: any | null, createdAt: any, message: { __typename?: 'Message', id: string, subject: string, createdAt: any, sender: { __typename?: 'User', id: string, name?: string | null, initials: string, email: string, color?: string | null }, recipients: Array<{ __typename?: 'MessageRecipient', id: string, user: { __typename?: 'User', id: string, initials: string, name?: string | null, email: string, color?: string | null } }> } }> };

export type MessagesFindMyMessagesQueryVariables = Exact<{
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
}>;


export type MessagesFindMyMessagesQuery = { __typename?: 'Query', count: number, findMyMessages: Array<{ __typename?: 'Message', id: string, subject: string, createdAt: any, sender: { __typename?: 'User', id: string, name?: string | null, initials: string, email: string, color?: string | null }, recipients: Array<{ __typename?: 'MessageRecipient', id: string, user: { __typename?: 'User', id: string, initials: string, name?: string | null, email: string, color?: string | null } }> }> };

export type MessagesRemoveMessageRecipientMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type MessagesRemoveMessageRecipientMutation = { __typename?: 'Mutation', removeMessageRecipient: { __typename?: 'MessageRecipient', id: string } };

export type MessagesRemoveMessageMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type MessagesRemoveMessageMutation = { __typename?: 'Mutation', removeMessage: { __typename?: 'Message', id: string } };

export type GetNewsletterViewQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetNewsletterViewQuery = { __typename?: 'Query', newsletter?: { __typename?: 'Newsletter', id: string, title: string, content: string, published: boolean, publishedAt?: any | null, author: { __typename?: 'User', id: string, name?: string | null }, school: { __typename?: 'School', id: string, name: string } } | null };

export type OnboardingRequestJoinSchoolMutationVariables = Exact<{
  input: RequestJoinSchoolInput;
}>;


export type OnboardingRequestJoinSchoolMutation = { __typename?: 'Mutation', requestJoinSchool: { __typename?: 'JoinRequestResult', status: string, message: string } };

export type OnboardingCreateSchoolWithOrganizationMutationVariables = Exact<{
  input: CreateSchoolWithOrgInput;
}>;


export type OnboardingCreateSchoolWithOrganizationMutation = { __typename?: 'Mutation', createSchoolWithOrganization: { __typename?: 'CreateSchoolResult', accessToken: string, schoolId: string } };

export type OnboardingAvailableSchoolsQueryVariables = Exact<{ [key: string]: never; }>;


export type OnboardingAvailableSchoolsQuery = { __typename?: 'Query', availableSchools: Array<{ __typename?: 'AvailableSchool', id: string, name: string, shortName: string, organizationName?: string | null, logo?: string | null, city?: string | null, country?: string | null, studentCount: number }> };

export type OnboardingCreateSchoolMutationVariables = Exact<{
  createSchoolInput: CreateSchoolInput;
}>;


export type OnboardingCreateSchoolMutation = { __typename?: 'Mutation', createSchool: { __typename?: 'School', id: string, name: string, organizationId: string, currencyCode: string } };

export type OnboardingCompleteOnboardingMutationVariables = Exact<{ [key: string]: never; }>;


export type OnboardingCompleteOnboardingMutation = { __typename?: 'Mutation', completeOnboarding: boolean };

export type OnboardingStepsGetSchoolsQueryVariables = Exact<{ [key: string]: never; }>;


export type OnboardingStepsGetSchoolsQuery = { __typename?: 'Query', schools: Array<{ __typename?: 'School', id: string }> };

export type OnboardingStepsStudyPlansBySchoolIdQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type OnboardingStepsStudyPlansBySchoolIdQuery = { __typename?: 'Query', studyPlansBySchoolId: Array<{ __typename?: 'StudyPlan', id: string, name: string }> };

export type OnboardingStepsGetSubjectsQueryVariables = Exact<{
  take: Scalars['Int']['input'];
  orderBy?: InputMaybe<Scalars['String']['input']>;
}>;


export type OnboardingStepsGetSubjectsQuery = { __typename?: 'Query', subjects: Array<{ __typename?: 'Subject', id: string, name: string }> };

export type OnboardingStepsCreateCourseMutationVariables = Exact<{
  createCourseInput: CreateCourseInput;
}>;


export type OnboardingStepsCreateCourseMutation = { __typename?: 'Mutation', createCourse: { __typename?: 'Course', id: string, name: string } };

export type OnboardingStepsDegreesGetSchoolsQueryVariables = Exact<{ [key: string]: never; }>;


export type OnboardingStepsDegreesGetSchoolsQuery = { __typename?: 'Query', schools: Array<{ __typename?: 'School', id: string }> };

export type OnboardingStepsCreateDegreeMutationVariables = Exact<{
  createDegreeInput: CreateDegreeInput;
}>;


export type OnboardingStepsCreateDegreeMutation = { __typename?: 'Mutation', createDegree: { __typename?: 'Degree', id: string, name: string } };

export type OnboardingStepsGroupsGetSchoolsQueryVariables = Exact<{ [key: string]: never; }>;


export type OnboardingStepsGroupsGetSchoolsQuery = { __typename?: 'Query', schools: Array<{ __typename?: 'School', id: string }> };

export type OnboardingStepsGroupsStudyPlansBySchoolIdQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type OnboardingStepsGroupsStudyPlansBySchoolIdQuery = { __typename?: 'Query', studyPlansBySchoolId: Array<{ __typename?: 'StudyPlan', id: string, name: string }> };

export type OnboardingStepsCreateClassGroupMutationVariables = Exact<{
  createClassGroupInput: CreateClassGroupInput;
}>;


export type OnboardingStepsCreateClassGroupMutation = { __typename?: 'Mutation', createClassGroup: { __typename?: 'ClassGroup', id: string, name: string } };

export type OnboardingStepsSchoolBasicsGetSchoolsQueryVariables = Exact<{ [key: string]: never; }>;


export type OnboardingStepsSchoolBasicsGetSchoolsQuery = { __typename?: 'Query', schools: Array<{ __typename?: 'School', id: string, name: string, currentYear: number }> };

export type OnboardingStepsUpdateSchoolMutationVariables = Exact<{
  updateSchoolInput: UpdateSchoolInput;
}>;


export type OnboardingStepsUpdateSchoolMutation = { __typename?: 'Mutation', updateSchool: { __typename?: 'School', id: string, currentYear: number } };

export type OnboardingStepsStudyPlansGetSchoolsQueryVariables = Exact<{ [key: string]: never; }>;


export type OnboardingStepsStudyPlansGetSchoolsQuery = { __typename?: 'Query', schools: Array<{ __typename?: 'School', id: string }> };

export type OnboardingStepsDegreesBySchoolIdQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type OnboardingStepsDegreesBySchoolIdQuery = { __typename?: 'Query', degreesBySchoolId: Array<{ __typename?: 'Degree', id: string, name: string }> };

export type OnboardingStepsGetGradeMetricsQueryVariables = Exact<{ [key: string]: never; }>;


export type OnboardingStepsGetGradeMetricsQuery = { __typename?: 'Query', gradeMetrics: Array<{ __typename?: 'GradeMetric', id: string, name: string }> };

export type OnboardingStepsCreateStudyPlanMutationVariables = Exact<{
  createStudyPlanInput: CreateStudyPlanInput;
}>;


export type OnboardingStepsCreateStudyPlanMutation = { __typename?: 'Mutation', createStudyPlan: { __typename?: 'StudyPlan', id: string, name: string } };

export type OnboardingMyJoinRequestStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type OnboardingMyJoinRequestStatusQuery = { __typename?: 'Query', myJoinRequestStatus?: { __typename?: 'JoinRequestStatus', id: string, requestedRole: string, status: string, schoolName?: string | null } | null };

export type ParentFinancesLinkedStudentsSummaryQueryVariables = Exact<{ [key: string]: never; }>;


export type ParentFinancesLinkedStudentsSummaryQuery = { __typename?: 'Query', linkedStudentsFinancialSummary: Array<{ __typename?: 'StudentFinancialSummary', studentId: string, firstName: string, fatherName: string, totalCharges: number, totalPayments: number, balance: number }> };

export type QuizFormCoursesBySchoolIdQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type QuizFormCoursesBySchoolIdQuery = { __typename?: 'Query', coursesBySchoolId: Array<{ __typename?: 'Course', id: string, name: string }> };

export type QuizzesListQueryVariables = Exact<{
  organizationId: Scalars['String']['input'];
}>;


export type QuizzesListQuery = { __typename?: 'Query', quizzes: Array<{ __typename?: 'Quiz', id: string, title: string, details: string, createdAt: any, updatedAt: any, course: { __typename?: 'Course', id: string, name: string }, teacher: { __typename?: 'Teacher', id: string, firstName: string, fatherName: string } }> };

export type QuizQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type QuizQuery = { __typename?: 'Query', quiz: { __typename?: 'Quiz', id: string, title: string, details: string, createdAt: any, updatedAt: any, course: { __typename?: 'Course', id: string, name: string }, teacher: { __typename?: 'Teacher', id: string, firstName: string, fatherName: string }, questions: Array<{ __typename?: 'QuizQuestion', id: string, question: string, value: number, type: string, timeLimit: number, options: Array<{ __typename?: 'QuizQuestionOption', id: string, option: string, isCorrect: boolean }> }> } };

export type CreateQuizMutationVariables = Exact<{
  createQuizInput: CreateQuizInput;
}>;


export type CreateQuizMutation = { __typename?: 'Mutation', createQuiz: { __typename?: 'Quiz', id: string, title: string, details: string, courseId: string, teacherId: string, createdAt: any, updatedAt: any } };

export type UpdateQuizMutationVariables = Exact<{
  updateQuizInput: UpdateQuizInput;
}>;


export type UpdateQuizMutation = { __typename?: 'Mutation', updateQuiz: { __typename?: 'Quiz', id: string, title: string, details: string, courseId: string, teacherId: string, createdAt: any, updatedAt: any } };

export type RemoveQuizMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type RemoveQuizMutation = { __typename?: 'Mutation', removeQuiz: { __typename?: 'Quiz', id: string } };

export type MyStoreCartCountQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type MyStoreCartCountQuery = { __typename?: 'Query', myStoreCart: Array<{ __typename?: 'StoreCartItem', id: string, quantity: number }> };

export type StudentAttendanceStatsQueryVariables = Exact<{
  studentId: Scalars['String']['input'];
}>;


export type StudentAttendanceStatsQuery = { __typename?: 'Query', studentAttendanceStats: { __typename?: 'AttendanceStats', total: number, present: number, absent: number, late: number, sickLeave: number, excused: number, presentPercentage: number, absentPercentage: number } };

export type AttendanceRecordsByStudentIdQueryVariables = Exact<{
  studentId: Scalars['String']['input'];
  take?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AttendanceRecordsByStudentIdQuery = { __typename?: 'Query', attendanceRecordsByStudentId: Array<{ __typename?: 'AttendanceRecord', id: string, status: AttendanceStatus, comment?: string | null, attendanceSession?: { __typename?: 'AttendanceSession', id: string, date: any, course: { __typename?: 'Course', id: string, name: string, subject: { __typename?: 'Subject', name: string } }, classGroup: { __typename?: 'ClassGroup', id: string, name: string } } | null }> };

export type StudentFinancesBalanceQueryVariables = Exact<{
  studentId: Scalars['String']['input'];
}>;


export type StudentFinancesBalanceQuery = { __typename?: 'Query', studentBalance: { __typename?: 'StudentBalance', studentId: string, totalCharges: number, totalPayments: number, balance: number } };

export type StudentFinancesChargesByStudentQueryVariables = Exact<{
  studentId: Scalars['String']['input'];
}>;


export type StudentFinancesChargesByStudentQuery = { __typename?: 'Query', chargesByStudent: Array<{ __typename?: 'Charge', id: string, amount: number, dueDate: any, description: string, chargeType: ChargeType, status: ChargeStatus }> };

export type StudentFinancesPaymentsByStudentQueryVariables = Exact<{
  studentId: Scalars['String']['input'];
}>;


export type StudentFinancesPaymentsByStudentQuery = { __typename?: 'Query', paymentsByStudent: Array<{ __typename?: 'Payment', id: string, amount: number, paidAt: any, reference?: string | null }> };

export type ClassGroupsBySchoolIdQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type ClassGroupsBySchoolIdQuery = { __typename?: 'Query', classGroupsBySchoolId: Array<{ __typename?: 'ClassGroup', id: string, name: string }> };

export type StudentFormDataQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type StudentFormDataQuery = { __typename?: 'Query', student: { __typename?: 'Student', id: string, firstName: string, middleName: string, fatherName: string, motherName: string, documentId: string, email: string, classGroupId?: string | null, birthDate: any, gender: string, address: string, phone: string, enrollmentStatus: EnrollmentStatus, bloodType: string, allergies: string, medicalNotes: string, emergencyContactName: string, emergencyContactPhone: string } };

export type UpdateStudentMutationVariables = Exact<{
  updateStudentInput: UpdateStudentInput;
}>;


export type UpdateStudentMutation = { __typename?: 'Mutation', updateStudent: { __typename?: 'Student', id: string } };

export type CreateStudentMutationVariables = Exact<{
  createStudentInput: CreateStudentInput;
}>;


export type CreateStudentMutation = { __typename?: 'Mutation', createStudent: { __typename?: 'Student', id: string } };

export type UpdateStudentGradeMutationVariables = Exact<{
  updateStudentGradeInput: UpdateStudentGradeInput;
}>;


export type UpdateStudentGradeMutation = { __typename?: 'Mutation', updateStudentGrade: { __typename?: 'StudentGrade', id: string, score?: number | null, comments?: string | null, gradeId: string, studentId: string, createdAt: any, updatedAt: any } };

export type StudentDashboardStatsQueryVariables = Exact<{
  schoolId?: InputMaybe<Scalars['String']['input']>;
}>;


export type StudentDashboardStatsQuery = { __typename?: 'Query', coursesCount: number, findManyMessagesCount: number };

export type StudentAssignmentsQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
  endDate: Scalars['String']['input'];
}>;


export type StudentAssignmentsQuery = { __typename?: 'Query', assignmentsBySchoolId: Array<{ __typename?: 'Assignment', id: string, title: string, date: any, course: { __typename?: 'Course', id: string, name: string } }> };

export type StudentRecentMessagesQueryVariables = Exact<{
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
}>;


export type StudentRecentMessagesQuery = { __typename?: 'Query', findManyMessages: Array<{ __typename?: 'MessageRecipient', id: string, createdAt: any, message: { __typename?: 'Message', id: string, subject: string, createdAt: any, sender: { __typename?: 'User', id: string, name?: string | null } } }> };

export type StudentRecentNewslettersQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
  take: Scalars['Int']['input'];
}>;


export type StudentRecentNewslettersQuery = { __typename?: 'Query', publishedNewsletters: Array<{ __typename?: 'Newsletter', id: string, title: string, content: string, publishedAt?: any | null, author: { __typename?: 'User', id: string, name?: string | null } }> };

export type StudentQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type StudentQuery = { __typename?: 'Query', student: { __typename?: 'Student', id: string, firstName: string, fatherName: string, fullName: string, name: string, schoolId: string, enrollmentStatus: EnrollmentStatus, bloodType: string, allergies: string, medicalNotes: string, emergencyContactName: string, emergencyContactPhone: string, color: string, email: string, documentId: string, birthDate: any, initials: string, gender: string, address: string, phone: string, createdAt: any, updatedAt: any, classGroup?: { __typename?: 'ClassGroup', id: string, name: string, studyPlan: { __typename?: 'StudyPlan', id: string, name: string, gradeMetric?: { __typename?: 'GradeMetric', minimumApproval: number, minimumExcellence: number } | null } } | null, courses: Array<{ __typename?: 'Course', id: string, subject: { __typename?: 'Subject', name: string }, teacher?: { __typename?: 'Teacher', id: string, name: string } | null }>, parents: Array<{ __typename?: 'Parent', id: string, firstName: string, fatherName: string, name: string, phone: string, email: string, relationship: string }>, studentGrades: Array<{ __typename?: 'StudentGrade', id: string, score?: number | null, comments?: string | null, updatedAt: any, grade: { __typename?: 'Grade', id: string, title: string, date: any, comments?: string | null, published: boolean, createdAt: any, updatedAt: any, course: { __typename?: 'Course', id: string, subject: { __typename?: 'Subject', name: string } }, bucket: { __typename?: 'GradeBucket', id: string, name: string, weight: number }, period: { __typename?: 'Period', id: string, name: string } } }>, user: { __typename?: 'User', id: string, email: string, emailVerified?: boolean | null, color?: string | null } } };

export type GetStudentsQueryVariables = Exact<{
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetStudentsQuery = { __typename?: 'Query', count: number, students: Array<{ __typename?: 'Student', id: string, name: string, firstName: string, middleName: string, motherName: string, birthDate: any, gender: string, fatherName: string, documentId: string, email: string, classGroupId?: string | null, enrollmentStatus: EnrollmentStatus, phone: string, address: string, createdAt: any, updatedAt: any, classGroup?: { __typename?: 'ClassGroup', id: string, name: string } | null, user: { __typename?: 'User', id: string, email: string, emailVerified?: boolean | null, color?: string | null } }> };

export type ResendUserInvitationMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type ResendUserInvitationMutation = { __typename?: 'Mutation', resendUserInvitation: boolean };

export type RemoveStudentMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type RemoveStudentMutation = { __typename?: 'Mutation', removeStudent: { __typename?: 'Student', id: string } };

export type TeacherFormQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type TeacherFormQuery = { __typename?: 'Query', teacher: { __typename?: 'Teacher', id: string, firstName: string, middleName: string, fatherName: string, motherName: string, documentId: string, birthDate: any, gender: string, address: string, phoneNumber: string, personalEmail: string, about: string, teacherSince?: number | null, memberSince?: any | null, user?: { __typename?: 'User', email: string } | null } };

export type UpdateTeacherMutationVariables = Exact<{
  updateTeacherInput: UpdateTeacherInput;
}>;


export type UpdateTeacherMutation = { __typename?: 'Mutation', updateTeacher: { __typename?: 'Teacher', id: string } };

export type CreateTeacherMutationVariables = Exact<{
  createTeacherInput: CreateTeacherInput;
}>;


export type CreateTeacherMutation = { __typename?: 'Mutation', createTeacher: { __typename?: 'Teacher', id: string } };

export type TeacherDashboardStatsQueryVariables = Exact<{
  schoolId?: InputMaybe<Scalars['String']['input']>;
}>;


export type TeacherDashboardStatsQuery = { __typename?: 'Query', coursesCount: number, findManyStudentsCount: number };

export type TeacherAssignmentsQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
  startDate: Scalars['String']['input'];
  endDate: Scalars['String']['input'];
}>;


export type TeacherAssignmentsQuery = { __typename?: 'Query', assignmentsBySchoolId: Array<{ __typename?: 'Assignment', id: string, title: string, date: any, course: { __typename?: 'Course', id: string, name: string } }> };

export type TeacherRecentMessagesQueryVariables = Exact<{
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
}>;


export type TeacherRecentMessagesQuery = { __typename?: 'Query', findManyMessages: Array<{ __typename?: 'MessageRecipient', id: string, createdAt: any, message: { __typename?: 'Message', id: string, subject: string, createdAt: any, sender: { __typename?: 'User', id: string, name?: string | null } } }> };

export type TeacherRecentNewslettersQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
  take: Scalars['Int']['input'];
}>;


export type TeacherRecentNewslettersQuery = { __typename?: 'Query', publishedNewsletters: Array<{ __typename?: 'Newsletter', id: string, title: string, content: string, publishedAt?: any | null, author: { __typename?: 'User', id: string, name?: string | null } }> };

export type TeacherQueryVariables = Exact<{
  teacherId: Scalars['String']['input'];
}>;


export type TeacherQuery = { __typename?: 'Query', teacher: { __typename?: 'Teacher', id: string, firstName: string, middleName: string, fatherName: string, motherName: string, name: string, fullName: string, initials: string, documentId: string, birthDate: any, gender: string, address: string, phoneNumber: string, personalEmail: string, about: string, teacherSince?: number | null, memberSince?: any | null, createdAt: any, updatedAt: any, user?: { __typename?: 'User', id: string, email: string, color?: string | null, emailVerified?: boolean | null } | null, subjects: Array<{ __typename?: 'Subject', id: string, name: string }>, courses: Array<{ __typename?: 'Course', id: string, name: string }>, classGroups: Array<{ __typename?: 'ClassGroup', id: string, name: string }> } };

export type GetTeachersQueryVariables = Exact<{
  take: Scalars['Int']['input'];
  skip: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetTeachersQuery = { __typename?: 'Query', count: number, teachers: Array<{ __typename?: 'Teacher', id: string, firstName: string, fatherName: string, name: string, initials: string, createdAt: any, updatedAt: any, user?: { __typename?: 'User', id: string, email: string, color?: string | null, initials: string, emailVerified?: boolean | null } | null }> };

export type RemoveTeacherMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type RemoveTeacherMutation = { __typename?: 'Mutation', removeTeacher: { __typename?: 'Teacher', id: string } };

export type StoreMeQueryVariables = Exact<{ [key: string]: never; }>;


export type StoreMeQuery = { __typename?: 'Query', me: { __typename?: 'User', id: string, themePreference?: string | null, role?: { __typename?: 'Role', name: string, permissions: Array<{ __typename?: 'Permission', descriptiveId: string }> } | null } };

export type StoreCategoryFieldsFragment = { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any };

export type StoreProductFieldsFragment = { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null };

export type StoreCartItemFieldsFragment = { __typename?: 'StoreCartItem', id: string, userId: string, productId: string, quantity: number, createdAt: any, updatedAt: any, product: { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null } };

export type StoreOrderItemFieldsFragment = { __typename?: 'StoreOrderItem', id: string, orderId: string, productId: string, quantity: number, unitPrice: number, product: { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null } };

export type StoreOrderFieldsFragment = { __typename?: 'StoreOrder', id: string, schoolId: string, userId: string, total: number, status: StoreOrderStatus, paymentStatus: StorePaymentStatus, notes?: string | null, createdAt: any, updatedAt: any, items: Array<{ __typename?: 'StoreOrderItem', id: string, orderId: string, productId: string, quantity: number, unitPrice: number, product: { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null } }> };

export type StoreCategoriesQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type StoreCategoriesQuery = { __typename?: 'Query', storeCategories: Array<{ __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any }> };

export type StoreCategoriesAdminQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type StoreCategoriesAdminQuery = { __typename?: 'Query', storeCategoriesAdmin: Array<{ __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any }> };

export type StoreProductsQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  categoryId?: InputMaybe<Scalars['String']['input']>;
}>;


export type StoreProductsQuery = { __typename?: 'Query', storeProducts: Array<{ __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null }> };

export type StoreProductQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type StoreProductQuery = { __typename?: 'Query', storeProduct?: { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null } | null };

export type StoreProductsAdminQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type StoreProductsAdminQuery = { __typename?: 'Query', storeProductsAdmin: Array<{ __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null }> };

export type MyStoreCartQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type MyStoreCartQuery = { __typename?: 'Query', myStoreCart: Array<{ __typename?: 'StoreCartItem', id: string, userId: string, productId: string, quantity: number, createdAt: any, updatedAt: any, product: { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null } }> };

export type MyStoreOrdersQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type MyStoreOrdersQuery = { __typename?: 'Query', myStoreOrders: Array<{ __typename?: 'StoreOrder', id: string, schoolId: string, userId: string, total: number, status: StoreOrderStatus, paymentStatus: StorePaymentStatus, notes?: string | null, createdAt: any, updatedAt: any, items: Array<{ __typename?: 'StoreOrderItem', id: string, orderId: string, productId: string, quantity: number, unitPrice: number, product: { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null } }> }> };

export type StoreOrderQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type StoreOrderQuery = { __typename?: 'Query', storeOrder: { __typename?: 'StoreOrder', id: string, schoolId: string, userId: string, total: number, status: StoreOrderStatus, paymentStatus: StorePaymentStatus, notes?: string | null, createdAt: any, updatedAt: any, items: Array<{ __typename?: 'StoreOrderItem', id: string, orderId: string, productId: string, quantity: number, unitPrice: number, product: { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null } }> } };

export type StoreOrdersAdminQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type StoreOrdersAdminQuery = { __typename?: 'Query', storeOrdersAdmin: Array<{ __typename?: 'StoreOrder', id: string, schoolId: string, userId: string, total: number, status: StoreOrderStatus, paymentStatus: StorePaymentStatus, notes?: string | null, createdAt: any, updatedAt: any, items: Array<{ __typename?: 'StoreOrderItem', id: string, orderId: string, productId: string, quantity: number, unitPrice: number, product: { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null } }> }> };

export type AddToStoreCartMutationVariables = Exact<{
  input: AddToCartInput;
}>;


export type AddToStoreCartMutation = { __typename?: 'Mutation', addToStoreCart: { __typename?: 'StoreCartItem', id: string, userId: string, productId: string, quantity: number, createdAt: any, updatedAt: any, product: { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null } } };

export type UpdateStoreCartItemMutationVariables = Exact<{
  input: UpdateCartItemInput;
}>;


export type UpdateStoreCartItemMutation = { __typename?: 'Mutation', updateStoreCartItem: { __typename?: 'StoreCartItem', id: string, userId: string, productId: string, quantity: number, createdAt: any, updatedAt: any, product: { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null } } };

export type RemoveStoreCartItemMutationVariables = Exact<{
  cartItemId: Scalars['String']['input'];
}>;


export type RemoveStoreCartItemMutation = { __typename?: 'Mutation', removeStoreCartItem: boolean };

export type ClearStoreCartMutationVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type ClearStoreCartMutation = { __typename?: 'Mutation', clearStoreCart: boolean };

export type CheckoutStoreMutationVariables = Exact<{
  input: CheckoutStoreInput;
}>;


export type CheckoutStoreMutation = { __typename?: 'Mutation', checkoutStore: { __typename?: 'StoreOrder', id: string, schoolId: string, userId: string, total: number, status: StoreOrderStatus, paymentStatus: StorePaymentStatus, notes?: string | null, createdAt: any, updatedAt: any, items: Array<{ __typename?: 'StoreOrderItem', id: string, orderId: string, productId: string, quantity: number, unitPrice: number, product: { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null } }> } };

export type ProcessStorePaymentMutationVariables = Exact<{
  input: ProcessStorePaymentInput;
}>;


export type ProcessStorePaymentMutation = { __typename?: 'Mutation', processStorePayment: { __typename?: 'StoreOrder', id: string, schoolId: string, userId: string, total: number, status: StoreOrderStatus, paymentStatus: StorePaymentStatus, notes?: string | null, createdAt: any, updatedAt: any, items: Array<{ __typename?: 'StoreOrderItem', id: string, orderId: string, productId: string, quantity: number, unitPrice: number, product: { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null } }> } };

export type CreateStoreCategoryMutationVariables = Exact<{
  input: CreateStoreCategoryInput;
}>;


export type CreateStoreCategoryMutation = { __typename?: 'Mutation', createStoreCategory: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } };

export type UpdateStoreCategoryMutationVariables = Exact<{
  input: UpdateStoreCategoryInput;
}>;


export type UpdateStoreCategoryMutation = { __typename?: 'Mutation', updateStoreCategory: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } };

export type DeleteStoreCategoryMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteStoreCategoryMutation = { __typename?: 'Mutation', deleteStoreCategory: boolean };

export type CreateStoreProductMutationVariables = Exact<{
  input: CreateStoreProductInput;
}>;


export type CreateStoreProductMutation = { __typename?: 'Mutation', createStoreProduct: { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null } };

export type UpdateStoreProductMutationVariables = Exact<{
  input: UpdateStoreProductInput;
}>;


export type UpdateStoreProductMutation = { __typename?: 'Mutation', updateStoreProduct: { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null } };

export type DeleteStoreProductMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteStoreProductMutation = { __typename?: 'Mutation', deleteStoreProduct: boolean };

export type UpdateStoreOrderStatusMutationVariables = Exact<{
  input: UpdateStoreOrderStatusInput;
}>;


export type UpdateStoreOrderStatusMutation = { __typename?: 'Mutation', updateStoreOrderStatus: { __typename?: 'StoreOrder', id: string, schoolId: string, userId: string, total: number, status: StoreOrderStatus, paymentStatus: StorePaymentStatus, notes?: string | null, createdAt: any, updatedAt: any, items: Array<{ __typename?: 'StoreOrderItem', id: string, orderId: string, productId: string, quantity: number, unitPrice: number, product: { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null } }> } };

export type PublicSchoolsForStoreQueryVariables = Exact<{ [key: string]: never; }>;


export type PublicSchoolsForStoreQuery = { __typename?: 'Query', publicSchoolsForStore: Array<{ __typename?: 'PublicSchoolDirectoryEntry', id: string, name: string, slug: string, currencyCode: string, logoUrl?: string | null }> };

export type PublicSchoolBySlugQueryVariables = Exact<{
  slug: Scalars['String']['input'];
}>;


export type PublicSchoolBySlugQuery = { __typename?: 'Query', publicSchoolBySlug: { __typename?: 'PublicSchoolDirectoryEntry', id: string, name: string, slug: string, currencyCode: string, logoUrl?: string | null } };

export type PublicStoreCategoriesQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
}>;


export type PublicStoreCategoriesQuery = { __typename?: 'Query', publicStoreCategories: Array<{ __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any }> };

export type PublicStoreProductsQueryVariables = Exact<{
  schoolId: Scalars['String']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  categoryId?: InputMaybe<Scalars['String']['input']>;
}>;


export type PublicStoreProductsQuery = { __typename?: 'Query', publicStoreProducts: Array<{ __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null }> };

export type PublicStoreProductQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type PublicStoreProductQuery = { __typename?: 'Query', publicStoreProduct?: { __typename?: 'StoreProduct', id: string, schoolId: string, categoryId?: string | null, name: string, description?: string | null, price: number, imageUrl?: string | null, stock: number, active: boolean, createdAt: any, updatedAt: any, category?: { __typename?: 'StoreCategory', id: string, schoolId: string, name: string, description?: string | null, sortOrder: number, active: boolean, createdAt: any, updatedAt: any } | null } | null };

export const StoreCategoryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StoreCategoryFieldsFragment, unknown>;
export const StoreProductFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StoreProductFieldsFragment, unknown>;
export const StoreCartItemFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCartItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCartItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"productId"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StoreCartItemFieldsFragment, unknown>;
export const StoreOrderItemFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreOrderItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreOrderItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderId"}},{"kind":"Field","name":{"kind":"Name","value":"productId"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StoreOrderItemFieldsFragment, unknown>;
export const StoreOrderFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreOrderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreOrder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"paymentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreOrderItemFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreOrderItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreOrderItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderId"}},{"kind":"Field","name":{"kind":"Name","value":"productId"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"}}]}}]} as unknown as DocumentNode<StoreOrderFieldsFragment, unknown>;
export const WebAdminAuthMeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebAdminAuthMe"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"descriptiveId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]}}]} as unknown as DocumentNode<WebAdminAuthMeQuery, WebAdminAuthMeQueryVariables>;
export const WebAdminAuthLoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminAuthLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}}]}}]}}]} as unknown as DocumentNode<WebAdminAuthLoginMutation, WebAdminAuthLoginMutationVariables>;
export const WebAdminGetGradeMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebAdminGetGradeMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gradeMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"minimum"}},{"kind":"Field","name":{"kind":"Name","value":"maximum"}},{"kind":"Field","name":{"kind":"Name","value":"minimumApproval"}},{"kind":"Field","name":{"kind":"Name","value":"minimumExcellence"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminGetGradeMetricsQuery, WebAdminGetGradeMetricsQueryVariables>;
export const WebAdminGetHabitMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebAdminGetHabitMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"habitMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminGetHabitMetricsQuery, WebAdminGetHabitMetricsQueryVariables>;
export const WebAdminCreateOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminCreateOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createOrganizationInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateOrganizationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOrganization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createOrganizationInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createOrganizationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminCreateOrganizationMutation, WebAdminCreateOrganizationMutationVariables>;
export const WebAdminUpdateOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminUpdateOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateOrganizationInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateOrganizationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOrganization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateOrganizationInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateOrganizationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminUpdateOrganizationMutation, WebAdminUpdateOrganizationMutationVariables>;
export const WebAdminGetOrganizationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebAdminGetOrganizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminGetOrganizationsQuery, WebAdminGetOrganizationsQueryVariables>;
export const WebAdminRemoveOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminRemoveOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeOrganization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminRemoveOrganizationMutation, WebAdminRemoveOrganizationMutationVariables>;
export const WebAdminCreatePeriodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminCreatePeriod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createPeriodInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePeriodInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPeriod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createPeriodInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createPeriodInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<WebAdminCreatePeriodMutation, WebAdminCreatePeriodMutationVariables>;
export const WebAdminUpdatePeriodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminUpdatePeriod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updatePeriodInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePeriodInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePeriod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updatePeriodInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updatePeriodInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<WebAdminUpdatePeriodMutation, WebAdminUpdatePeriodMutationVariables>;
export const WebAdminGetPeriodsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebAdminGetPeriods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"periods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"year"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminGetPeriodsQuery, WebAdminGetPeriodsQueryVariables>;
export const WebAdminRemovePeriodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminRemovePeriod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"removePeriodId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removePeriod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"removePeriodId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<WebAdminRemovePeriodMutation, WebAdminRemovePeriodMutationVariables>;
export const WebAdminCreatePermissionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminCreatePermission"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createPermissionInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePermissionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPermission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createPermissionInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createPermissionInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"descriptiveId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminCreatePermissionMutation, WebAdminCreatePermissionMutationVariables>;
export const WebAdminUpdatePermissionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminUpdatePermission"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updatePermissionInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePermissionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePermission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updatePermissionInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updatePermissionInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"descriptiveId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminUpdatePermissionMutation, WebAdminUpdatePermissionMutationVariables>;
export const WebAdminGetPermissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebAdminGetPermissions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"count"},"name":{"kind":"Name","value":"permissionsCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"descriptiveId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminGetPermissionsQuery, WebAdminGetPermissionsQueryVariables>;
export const WebAdminRemovePermissionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminRemovePermission"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removePermission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<WebAdminRemovePermissionMutation, WebAdminRemovePermissionMutationVariables>;
export const WebAdminGetPermissionsForRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebAdminGetPermissionsForRole"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"descriptiveId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<WebAdminGetPermissionsForRoleQuery, WebAdminGetPermissionsForRoleQueryVariables>;
export const WebAdminGetOrganizationsForRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebAdminGetOrganizationsForRole"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<WebAdminGetOrganizationsForRoleQuery, WebAdminGetOrganizationsForRoleQueryVariables>;
export const WebAdminCreateRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminCreateRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createRoleInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createRoleInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createRoleInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminCreateRoleMutation, WebAdminCreateRoleMutationVariables>;
export const WebAdminUpdateRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminUpdateRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateRoleInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateRoleInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateRoleInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminUpdateRoleMutation, WebAdminUpdateRoleMutationVariables>;
export const WebAdminGetRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebAdminGetRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"descriptiveId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<WebAdminGetRolesQuery, WebAdminGetRolesQueryVariables>;
export const WebAdminRemoveRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminRemoveRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<WebAdminRemoveRoleMutation, WebAdminRemoveRoleMutationVariables>;
export const WebAdminGetOrganizationsForSchoolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebAdminGetOrganizationsForSchool"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<WebAdminGetOrganizationsForSchoolQuery, WebAdminGetOrganizationsForSchoolQueryVariables>;
export const WebAdminCreateSchoolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminCreateSchool"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createSchoolInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSchoolInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSchool"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createSchoolInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createSchoolInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"zip"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminCreateSchoolMutation, WebAdminCreateSchoolMutationVariables>;
export const WebAdminUpdateSchoolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminUpdateSchool"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateSchoolInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSchoolInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSchool"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateSchoolInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateSchoolInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"zip"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminUpdateSchoolMutation, WebAdminUpdateSchoolMutationVariables>;
export const WebAdminGetSchoolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebAdminGetSchools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"zip"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"currentYear"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminGetSchoolsQuery, WebAdminGetSchoolsQueryVariables>;
export const WebAdminRemoveSchoolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminRemoveSchool"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeSchool"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminRemoveSchoolMutation, WebAdminRemoveSchoolMutationVariables>;
export const WebAdminGetRolesForUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebAdminGetRolesForUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<WebAdminGetRolesForUserQuery, WebAdminGetRolesForUserQueryVariables>;
export const WebAdminGetOrganizationsForUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebAdminGetOrganizationsForUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<WebAdminGetOrganizationsForUserQuery, WebAdminGetOrganizationsForUserQueryVariables>;
export const WebAdminCreateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminCreateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createUserInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createUserInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createUserInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<WebAdminCreateUserMutation, WebAdminCreateUserMutationVariables>;
export const WebAdminUpdateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminUpdateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateUserInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateUserInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateUserInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<WebAdminUpdateUserMutation, WebAdminUpdateUserMutationVariables>;
export const WebAdminGetUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WebAdminGetUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"count"},"name":{"kind":"Name","value":"usersCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]},{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"roleId"}},{"kind":"Field","name":{"kind":"Name","value":"role"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<WebAdminGetUsersQuery, WebAdminGetUsersQueryVariables>;
export const WebAdminRemoveUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WebAdminRemoveUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WebAdminRemoveUserMutation, WebAdminRemoveUserMutationVariables>;
export const AdminClassGroupsBySchoolIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminClassGroupsBySchoolId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"count"},"name":{"kind":"Name","value":"classGroupsCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]},{"kind":"Field","name":{"kind":"Name","value":"classGroups"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"studyPlan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"studyPlanId"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AdminClassGroupsBySchoolIdQuery, AdminClassGroupsBySchoolIdQueryVariables>;
export const AdminRemoveClassGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminRemoveClassGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeClassGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AdminRemoveClassGroupMutation, AdminRemoveClassGroupMutationVariables>;
export const AdminStudyPlansForCoursesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminStudyPlansForCourses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studyPlansBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<AdminStudyPlansForCoursesQuery, AdminStudyPlansForCoursesQueryVariables>;
export const AdminGetCoursesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminGetCourses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studyPlanId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"count"},"name":{"kind":"Name","value":"coursesCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"studyPlanId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studyPlanId"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]},{"kind":"Field","name":{"kind":"Name","value":"courses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"studyPlanId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studyPlanId"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"studyPlan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"studyPlanId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AdminGetCoursesQuery, AdminGetCoursesQueryVariables>;
export const AdminRemoveCourseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminRemoveCourse"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"removeCourseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeCourse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"removeCourseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AdminRemoveCourseMutation, AdminRemoveCourseMutationVariables>;
export const AdminDegreesBySchoolIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminDegreesBySchoolId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"count"},"name":{"kind":"Name","value":"degreesBySchoolIdCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"degreesBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"school"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AdminDegreesBySchoolIdQuery, AdminDegreesBySchoolIdQueryVariables>;
export const AdminRemoveDegreeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminRemoveDegree"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"removeDegreeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeDegree"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"removeDegreeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AdminRemoveDegreeMutation, AdminRemoveDegreeMutationVariables>;
export const AdminChargesBySchoolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminChargesBySchool"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chargesBySchool"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"chargeType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"studyPlan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<AdminChargesBySchoolQuery, AdminChargesBySchoolQueryVariables>;
export const AdminRemoveChargeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminRemoveCharge"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeCharge"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AdminRemoveChargeMutation, AdminRemoveChargeMutationVariables>;
export const ClassGroupsFormTeachersByOrganizationIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ClassGroupsFormTeachersByOrganizationId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teachersByOrganizationId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ClassGroupsFormTeachersByOrganizationIdQuery, ClassGroupsFormTeachersByOrganizationIdQueryVariables>;
export const ClassGroupsFormStudyPlansBySchoolIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ClassGroupsFormStudyPlansBySchoolId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studyPlansBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ClassGroupsFormStudyPlansBySchoolIdQuery, ClassGroupsFormStudyPlansBySchoolIdQueryVariables>;
export const ClassGroupsFormUpdateClassGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClassGroupsFormUpdateClassGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateClassGroupInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateClassGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateClassGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateClassGroupInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateClassGroupInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ClassGroupsFormUpdateClassGroupMutation, ClassGroupsFormUpdateClassGroupMutationVariables>;
export const ClassGroupsFormCreateClassGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClassGroupsFormCreateClassGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createClassGroupInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateClassGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createClassGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createClassGroupInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createClassGroupInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ClassGroupsFormCreateClassGroupMutation, ClassGroupsFormCreateClassGroupMutationVariables>;
export const CoursesFormGetSubjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CoursesFormGetSubjects"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"subjects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CoursesFormGetSubjectsQuery, CoursesFormGetSubjectsQueryVariables>;
export const CoursesFormStudyPlansBySchoolIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CoursesFormStudyPlansBySchoolId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studyPlansBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CoursesFormStudyPlansBySchoolIdQuery, CoursesFormStudyPlansBySchoolIdQueryVariables>;
export const CoursesFormGetTeachersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CoursesFormGetTeachers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teachers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}}]}}]}}]} as unknown as DocumentNode<CoursesFormGetTeachersQuery, CoursesFormGetTeachersQueryVariables>;
export const CoursesFormCreateSubjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CoursesFormCreateSubject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createSubjectInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSubjectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSubject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createSubjectInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createSubjectInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]}}]} as unknown as DocumentNode<CoursesFormCreateSubjectMutation, CoursesFormCreateSubjectMutationVariables>;
export const CoursesFormUpdateCourseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CoursesFormUpdateCourse"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateCourseInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCourseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCourse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateCourseInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateCourseInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"studyPlanId"}}]}}]}}]} as unknown as DocumentNode<CoursesFormUpdateCourseMutation, CoursesFormUpdateCourseMutationVariables>;
export const CoursesFormCreateCourseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CoursesFormCreateCourse"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createCourseInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCourseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCourse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createCourseInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createCourseInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"studyPlanId"}}]}}]}}]} as unknown as DocumentNode<CoursesFormCreateCourseMutation, CoursesFormCreateCourseMutationVariables>;
export const CreateChargeFormStudentsBySchoolIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CreateChargeFormStudentsBySchoolId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentsBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}}]}}]}}]} as unknown as DocumentNode<CreateChargeFormStudentsBySchoolIdQuery, CreateChargeFormStudentsBySchoolIdQueryVariables>;
export const CreateChargeFormStudyPlansBySchoolIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CreateChargeFormStudyPlansBySchoolId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studyPlansBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CreateChargeFormStudyPlansBySchoolIdQuery, CreateChargeFormStudyPlansBySchoolIdQueryVariables>;
export const CreateChargeFormCreateChargeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateChargeFormCreateCharge"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateChargeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCharge"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateChargeFormCreateChargeMutation, CreateChargeFormCreateChargeMutationVariables>;
export const DegreesFormGetSchoolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DegreesFormGetSchools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<DegreesFormGetSchoolsQuery, DegreesFormGetSchoolsQueryVariables>;
export const DegreesFormUpdateDegreeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DegreesFormUpdateDegree"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateDegreeInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDegreeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateDegree"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateDegreeInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateDegreeInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<DegreesFormUpdateDegreeMutation, DegreesFormUpdateDegreeMutationVariables>;
export const DegreesFormCreateDegreeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DegreesFormCreateDegree"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createDegreeInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateDegreeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDegree"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createDegreeInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createDegreeInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<DegreesFormCreateDegreeMutation, DegreesFormCreateDegreeMutationVariables>;
export const NewsletterFormGetNewsletterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NewsletterFormGetNewsletter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"newsletter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"published"}}]}}]}}]} as unknown as DocumentNode<NewsletterFormGetNewsletterQuery, NewsletterFormGetNewsletterQueryVariables>;
export const NewsletterFormUpdateNewsletterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"NewsletterFormUpdateNewsletter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateNewsletterInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateNewsletterInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNewsletter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateNewsletterInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateNewsletterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<NewsletterFormUpdateNewsletterMutation, NewsletterFormUpdateNewsletterMutationVariables>;
export const NewsletterFormCreateNewsletterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"NewsletterFormCreateNewsletter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createNewsletterInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateNewsletterInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createNewsletter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createNewsletterInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createNewsletterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<NewsletterFormCreateNewsletterMutation, NewsletterFormCreateNewsletterMutationVariables>;
export const StudyPlanFormGetGradeMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudyPlanFormGetGradeMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gradeMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<StudyPlanFormGetGradeMetricsQuery, StudyPlanFormGetGradeMetricsQueryVariables>;
export const StudyPlanFormDegreesBySchoolIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudyPlanFormDegreesBySchoolId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"degreesBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<StudyPlanFormDegreesBySchoolIdQuery, StudyPlanFormDegreesBySchoolIdQueryVariables>;
export const StudyPlanFormUpdateStudyPlanFinancialConfigDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StudyPlanFormUpdateStudyPlanFinancialConfig"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateStudyPlanFinancialInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateStudyPlanFinancialConfig"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<StudyPlanFormUpdateStudyPlanFinancialConfigMutation, StudyPlanFormUpdateStudyPlanFinancialConfigMutationVariables>;
export const StudyPlanFormUpdateStudyPlanDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StudyPlanFormUpdateStudyPlan"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateStudyPlanInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateStudyPlanInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateStudyPlan"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateStudyPlanInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateStudyPlanInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<StudyPlanFormUpdateStudyPlanMutation, StudyPlanFormUpdateStudyPlanMutationVariables>;
export const StudyPlanFormCreateStudyPlanDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StudyPlanFormCreateStudyPlan"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createStudyPlanInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateStudyPlanInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createStudyPlan"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createStudyPlanInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createStudyPlanInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<StudyPlanFormCreateStudyPlanMutation, StudyPlanFormCreateStudyPlanMutationVariables>;
export const SubjectsFormUpdateSubjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubjectsFormUpdateSubject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateSubjectInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSubjectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSubject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateSubjectInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateSubjectInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SubjectsFormUpdateSubjectMutation, SubjectsFormUpdateSubjectMutationVariables>;
export const SubjectsFormCreateSubjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubjectsFormCreateSubject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createSubjectInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSubjectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSubject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createSubjectInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createSubjectInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SubjectsFormCreateSubjectMutation, SubjectsFormCreateSubjectMutationVariables>;
export const AdminPendingJoinRequestsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminPendingJoinRequests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingJoinRequests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requestedRole"}},{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"userFirstName"}},{"kind":"Field","name":{"kind":"Name","value":"userLastName"}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"}},{"kind":"Field","name":{"kind":"Name","value":"userImage"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"schoolName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<AdminPendingJoinRequestsQuery, AdminPendingJoinRequestsQueryVariables>;
export const AdminApproveJoinRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminApproveJoinRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"approve"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approveJoinRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"requestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}}},{"kind":"Argument","name":{"kind":"Name","value":"approve"},"value":{"kind":"Variable","name":{"kind":"Name","value":"approve"}}}]}]}}]} as unknown as DocumentNode<AdminApproveJoinRequestMutation, AdminApproveJoinRequestMutationVariables>;
export const AdminGetNewslettersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminGetNewsletters"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"count"},"name":{"kind":"Name","value":"findManyNewslettersCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"newsletters"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"published"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"school"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AdminGetNewslettersQuery, AdminGetNewslettersQueryVariables>;
export const AdminUpdateNewsletterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminUpdateNewsletter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateNewsletterInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateNewsletterInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNewsletter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateNewsletterInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateNewsletterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AdminUpdateNewsletterMutation, AdminUpdateNewsletterMutationVariables>;
export const AdminRemoveNewsletterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminRemoveNewsletter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"removeNewsletterId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeNewsletter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"removeNewsletterId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AdminRemoveNewsletterMutation, AdminRemoveNewsletterMutationVariables>;
export const AdminSchoolFormDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminSchoolForm"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"school"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"zip"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"primaryColor"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryColor"}},{"kind":"Field","name":{"kind":"Name","value":"tertiaryColor"}}]}}]}}]} as unknown as DocumentNode<AdminSchoolFormQuery, AdminSchoolFormQueryVariables>;
export const AdminCreateSchoolLogoUploadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminCreateSchoolLogoUploadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SchoolLogoUploadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSchoolLogoUploadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadUrl"}},{"kind":"Field","name":{"kind":"Name","value":"storageKey"}}]}}]}}]} as unknown as DocumentNode<AdminCreateSchoolLogoUploadUrlMutation, AdminCreateSchoolLogoUploadUrlMutationVariables>;
export const AdminUpdateSchoolLogoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminUpdateSchoolLogo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"logo"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSchoolLogo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"logo"},"value":{"kind":"Variable","name":{"kind":"Name","value":"logo"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}}]}}]}}]} as unknown as DocumentNode<AdminUpdateSchoolLogoMutation, AdminUpdateSchoolLogoMutationVariables>;
export const AdminSchoolLogoDownloadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminSchoolLogoDownloadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schoolLogoDownloadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"downloadUrl"}}]}}]}}]} as unknown as DocumentNode<AdminSchoolLogoDownloadUrlQuery, AdminSchoolLogoDownloadUrlQueryVariables>;
export const AdminUpdateSchoolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminUpdateSchool"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateSchoolInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSchoolInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSchool"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateSchoolInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateSchoolInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AdminUpdateSchoolMutation, AdminUpdateSchoolMutationVariables>;
export const AdminCreateSchoolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminCreateSchool"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createSchoolInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSchoolInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSchool"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createSchoolInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createSchoolInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AdminCreateSchoolMutation, AdminCreateSchoolMutationVariables>;
export const AdminSchoolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminSchool"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"school"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"zip"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"currentYear"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AdminSchoolQuery, AdminSchoolQueryVariables>;
export const AdminGetSchoolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminGetSchools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"zip"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AdminGetSchoolsQuery, AdminGetSchoolsQueryVariables>;
export const AdminRemoveSchoolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminRemoveSchool"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"removeSchoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeSchool"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"removeSchoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AdminRemoveSchoolMutation, AdminRemoveSchoolMutationVariables>;
export const AdminStudyPlansBySchoolIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminStudyPlansBySchoolId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studyPlansBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"degreeId"}},{"kind":"Field","name":{"kind":"Name","value":"gradeMetricId"}},{"kind":"Field","name":{"kind":"Name","value":"monthlyTuitionAmount"}},{"kind":"Field","name":{"kind":"Name","value":"tuitionMonths"}},{"kind":"Field","name":{"kind":"Name","value":"gradeMetric"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"degree"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"enrollmentCosts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"order"}}]}}]}}]}}]} as unknown as DocumentNode<AdminStudyPlansBySchoolIdQuery, AdminStudyPlansBySchoolIdQueryVariables>;
export const AdminRemoveStudyPlanDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminRemoveStudyPlan"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeStudyPlan"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AdminRemoveStudyPlanMutation, AdminRemoveStudyPlanMutationVariables>;
export const AdminGetSubjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminGetSubjects"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"count"},"name":{"kind":"Name","value":"findManySubjectsCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]},{"kind":"Field","name":{"kind":"Name","value":"subjects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AdminGetSubjectsQuery, AdminGetSubjectsQueryVariables>;
export const AdminRemoveSubjectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminRemoveSubject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"removeSubjectId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeSubject"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"removeSubjectId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AdminRemoveSubjectMutation, AdminRemoveSubjectMutationVariables>;
export const AssignmentDatesBySchoolIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AssignmentDatesBySchoolId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classGroupId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignmentDatesBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"classGroupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classGroupId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"classGroupId"}},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"requireSubmission"}},{"kind":"Field","name":{"kind":"Name","value":"course"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AssignmentDatesBySchoolIdQuery, AssignmentDatesBySchoolIdQueryVariables>;
export const CoursesBySchoolIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CoursesBySchoolId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"coursesBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CoursesBySchoolIdQuery, CoursesBySchoolIdQueryVariables>;
export const ClassGroupsByCourseIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ClassGroupsByCourseId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classGroupsByCourseId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"courseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ClassGroupsByCourseIdQuery, ClassGroupsByCourseIdQueryVariables>;
export const TeachersByOrganizationIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeachersByOrganizationId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teachersByOrganizationId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<TeachersByOrganizationIdQuery, TeachersByOrganizationIdQueryVariables>;
export const CreateAssignmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAssignment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createAssignmentInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAssignmentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAssignment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createAssignmentInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createAssignmentInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateAssignmentMutation, CreateAssignmentMutationVariables>;
export const MyAssignmentSubmissionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyAssignmentSubmission"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assignmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myAssignmentSubmission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"assignmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assignmentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assignmentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"fileId"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"size"}}]}}]}}]}}]} as unknown as DocumentNode<MyAssignmentSubmissionQuery, MyAssignmentSubmissionQueryVariables>;
export const CreateSubmissionUploadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSubmissionUploadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSubmissionUploadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSubmissionUploadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadUrl"}},{"kind":"Field","name":{"kind":"Name","value":"storageKey"}}]}}]}}]} as unknown as DocumentNode<CreateSubmissionUploadUrlMutation, CreateSubmissionUploadUrlMutationVariables>;
export const CreateAssignmentSubmissionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAssignmentSubmission"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAssignmentSubmissionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAssignmentSubmission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"assignmentId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"fileId"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"size"}}]}}]}}]}}]} as unknown as DocumentNode<CreateAssignmentSubmissionMutation, CreateAssignmentSubmissionMutationVariables>;
export const DeleteAssignmentSubmissionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAssignmentSubmission"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"submissionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAssignmentSubmission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"submissionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"submissionId"}}}]}]}}]} as unknown as DocumentNode<DeleteAssignmentSubmissionMutation, DeleteAssignmentSubmissionMutationVariables>;
export const CreateSubmissionDownloadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSubmissionDownloadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSubmissionDownloadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fileId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fileId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"downloadUrl"}}]}}]}}]} as unknown as DocumentNode<CreateSubmissionDownloadUrlMutation, CreateSubmissionDownloadUrlMutationVariables>;
export const StudentsForAssignmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentsForAssignment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assignmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentsForAssignment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"assignmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assignmentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"middleName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}},{"kind":"Field","name":{"kind":"Name","value":"motherName"}},{"kind":"Field","name":{"kind":"Name","value":"assignmentSubmissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"submittedAt"}},{"kind":"Field","name":{"kind":"Name","value":"file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"size"}}]}}]}}]}}]}}]} as unknown as DocumentNode<StudentsForAssignmentQuery, StudentsForAssignmentQueryVariables>;
export const AssignmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Assignment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"course"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"requireSubmission"}}]}}]}}]} as unknown as DocumentNode<AssignmentQuery, AssignmentQueryVariables>;
export const AttendanceFormStudentsForAttendanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AttendanceFormStudentsForAttendance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classGroupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentsForAttendance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"courseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"classGroupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classGroupId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"middleName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}},{"kind":"Field","name":{"kind":"Name","value":"motherName"}},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<AttendanceFormStudentsForAttendanceQuery, AttendanceFormStudentsForAttendanceQueryVariables>;
export const AttendanceFormCreateAttendanceSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AttendanceFormCreateAttendanceSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAttendanceSessionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAttendanceSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<AttendanceFormCreateAttendanceSessionMutation, AttendanceFormCreateAttendanceSessionMutationVariables>;
export const AttendanceFormUpdateAttendanceRecordsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AttendanceFormUpdateAttendanceRecords"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAttendanceRecordInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAttendanceRecords"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"inputs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"inputs"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}}]}}]}}]} as unknown as DocumentNode<AttendanceFormUpdateAttendanceRecordsMutation, AttendanceFormUpdateAttendanceRecordsMutationVariables>;
export const ForgotPasswordLookupAccountForPasswordResetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ForgotPasswordLookupAccountForPasswordReset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lookupAccountForPasswordReset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"found"}},{"kind":"Field","name":{"kind":"Name","value":"roleLabel"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"organizationName"}}]}}]}}]} as unknown as DocumentNode<ForgotPasswordLookupAccountForPasswordResetQuery, ForgotPasswordLookupAccountForPasswordResetQueryVariables>;
export const RegisterValidateEmailTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RegisterValidateEmailToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"validateEmailToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}]}}]} as unknown as DocumentNode<RegisterValidateEmailTokenQuery, RegisterValidateEmailTokenQueryVariables>;
export const RegisterCheckPendingInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RegisterCheckPendingInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"checkPendingInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasPendingInvitation"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"organizationName"}}]}}]}}]} as unknown as DocumentNode<RegisterCheckPendingInvitationQuery, RegisterCheckPendingInvitationQueryVariables>;
export const RegisterSendVerificationLinkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterSendVerificationLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendVerificationLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}]}}]} as unknown as DocumentNode<RegisterSendVerificationLinkMutation, RegisterSendVerificationLinkMutationVariables>;
export const RegisterCreateInvitationAccessLinkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterCreateInvitationAccessLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createInvitationAccessLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<RegisterCreateInvitationAccessLinkMutation, RegisterCreateInvitationAccessLinkMutationVariables>;
export const RegisterSignUpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterSignUp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SignUpInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signUp"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}}]}}]}}]} as unknown as DocumentNode<RegisterSignUpMutation, RegisterSignUpMutationVariables>;
export const ResetPasswordResendUserInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetPasswordResendUserInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resendUserInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}]}}]} as unknown as DocumentNode<ResetPasswordResendUserInvitationMutation, ResetPasswordResendUserInvitationMutationVariables>;
export const AuthMeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuthMe"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"themePreference"}},{"kind":"Field","name":{"kind":"Name","value":"onboardingStep"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}},{"kind":"Field","name":{"kind":"Name","value":"classGroupId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"role"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"descriptiveId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AuthMeQuery, AuthMeQueryVariables>;
export const AuthLoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AuthLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}}]}}]}}]} as unknown as DocumentNode<AuthLoginMutation, AuthLoginMutationVariables>;
export const AuthResetPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AuthResetPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}}]}}]}}]} as unknown as DocumentNode<AuthResetPasswordMutation, AuthResetPasswordMutationVariables>;
export const AuthIsEmailVerifiedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuthIsEmailVerified"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isEmailVerified"}}]}}]} as unknown as DocumentNode<AuthIsEmailVerifiedQuery, AuthIsEmailVerifiedQueryVariables>;
export const UpdateThemePreferenceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateThemePreference"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"themePreference"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateThemePreference"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"themePreference"},"value":{"kind":"Variable","name":{"kind":"Name","value":"themePreference"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"themePreference"}}]}}]}}]} as unknown as DocumentNode<UpdateThemePreferenceMutation, UpdateThemePreferenceMutationVariables>;
export const AuthOnboardingStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuthOnboardingStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboardingStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboardingCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"schoolName"}},{"kind":"Field","name":{"kind":"Name","value":"degreesCount"}},{"kind":"Field","name":{"kind":"Name","value":"studyPlansCount"}},{"kind":"Field","name":{"kind":"Name","value":"coursesCount"}},{"kind":"Field","name":{"kind":"Name","value":"groupsCount"}}]}}]}}]} as unknown as DocumentNode<AuthOnboardingStatusQuery, AuthOnboardingStatusQueryVariables>;
export const ChatsMyChatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ChatsMyChats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myChats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"courseId"}},{"kind":"Field","name":{"kind":"Name","value":"assignmentId"}},{"kind":"Field","name":{"kind":"Name","value":"classGroupId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"role"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}}]}}]}}]}}]} as unknown as DocumentNode<ChatsMyChatsQuery, ChatsMyChatsQueryVariables>;
export const ChatsChatDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ChatsChat"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chat"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"courseId"}},{"kind":"Field","name":{"kind":"Name","value":"assignmentId"}},{"kind":"Field","name":{"kind":"Name","value":"classGroupId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"role"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}}]}}]}}]}}]} as unknown as DocumentNode<ChatsChatQuery, ChatsChatQueryVariables>;
export const ChatsChatMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ChatsChatMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChatMessagesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chatMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"chatId"}},{"kind":"Field","name":{"kind":"Name","value":"senderId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"role"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ChatsChatMessagesQuery, ChatsChatMessagesQueryVariables>;
export const ChatsCreateDirectChatDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChatsCreateDirectChat"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recipientId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDirectChat"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"recipientId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recipientId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ChatsCreateDirectChatMutation, ChatsCreateDirectChatMutationVariables>;
export const ChatsCreateGroupChatDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChatsCreateGroupChat"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupChatInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGroupChat"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ChatsCreateGroupChatMutation, ChatsCreateGroupChatMutationVariables>;
export const ChatsCreateContextualChatDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChatsCreateContextualChat"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateContextualChatInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createContextualChat"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"courseId"}},{"kind":"Field","name":{"kind":"Name","value":"assignmentId"}},{"kind":"Field","name":{"kind":"Name","value":"classGroupId"}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ChatsCreateContextualChatMutation, ChatsCreateContextualChatMutationVariables>;
export const ChatsSendMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChatsSendMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SendMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"chatId"}},{"kind":"Field","name":{"kind":"Name","value":"senderId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<ChatsSendMessageMutation, ChatsSendMessageMutationVariables>;
export const ChatsMarkChatReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChatsMarkChatRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chatId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markChatRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"chatId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chatId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"lastReadAt"}}]}}]}}]} as unknown as DocumentNode<ChatsMarkChatReadMutation, ChatsMarkChatReadMutationVariables>;
export const ChatsUnreadCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ChatsUnreadCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chatUnreadCount"}}]}}]} as unknown as DocumentNode<ChatsUnreadCountQuery, ChatsUnreadCountQueryVariables>;
export const ChatsMessageReceivedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ChatsMessageReceived"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"chatId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messageReceived"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"chatId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"chatId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"chatId"}},{"kind":"Field","name":{"kind":"Name","value":"senderId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"role"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ChatsMessageReceivedSubscription, ChatsMessageReceivedSubscriptionVariables>;
export const ComposeCreateMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ComposeCreateMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createMessageInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createMessageInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createMessageInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ComposeCreateMessageMutation, ComposeCreateMessageMutationVariables>;
export const ContactsFindContactsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ContactsFindContacts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"queryText"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findContacts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"queryText"},"value":{"kind":"Variable","name":{"kind":"Name","value":"queryText"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"role"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<ContactsFindContactsQuery, ContactsFindContactsQueryVariables>;
export const AssignmentDatesByCourseIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AssignmentDatesByCourseId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classGroupId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignmentDatesByCourseId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"courseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"classGroupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classGroupId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"classGroupId"}},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"requireSubmission"}}]}}]}}]}}]} as unknown as DocumentNode<AssignmentDatesByCourseIdQuery, AssignmentDatesByCourseIdQueryVariables>;
export const CourseAttendanceClassGroupsByCourseIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CourseAttendanceClassGroupsByCourseId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classGroupsByCourseId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"courseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"studyPlan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CourseAttendanceClassGroupsByCourseIdQuery, CourseAttendanceClassGroupsByCourseIdQueryVariables>;
export const CourseAttendanceAttendanceSessionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CourseAttendanceAttendanceSessions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classGroupId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attendanceSessionsCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"courseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"classGroupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classGroupId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"attendanceSessions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"courseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"classGroupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classGroupId"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"courseId"}},{"kind":"Field","name":{"kind":"Name","value":"classGroupId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"records"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"middleName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}},{"kind":"Field","name":{"kind":"Name","value":"motherName"}},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CourseAttendanceAttendanceSessionsQuery, CourseAttendanceAttendanceSessionsQueryVariables>;
export const CourseAttendanceDeleteAttendanceSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CourseAttendanceDeleteAttendanceSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAttendanceSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CourseAttendanceDeleteAttendanceSessionMutation, CourseAttendanceDeleteAttendanceSessionMutationVariables>;
export const CreateFileUploadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateFileUploadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createFileUploadInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateFileUploadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFileUploadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createFileUploadInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createFileUploadInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadUrl"}},{"kind":"Field","name":{"kind":"Name","value":"storageKey"}}]}}]}}]} as unknown as DocumentNode<CreateFileUploadUrlMutation, CreateFileUploadUrlMutationVariables>;
export const CreateFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createFileInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateFileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createFileInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createFileInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateFileMutation, CreateFileMutationVariables>;
export const ShareFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ShareFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"shareFileInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ShareFileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shareFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"shareFileInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"shareFileInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ShareFileMutation, ShareFileMutationVariables>;
export const FilesForCourseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FilesForCourse"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filesForCourse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"courseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"access"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<FilesForCourseQuery, FilesForCourseQueryVariables>;
export const CreateFileDownloadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateFileDownloadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createFileDownloadInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateFileDownloadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFileDownloadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createFileDownloadInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createFileDownloadInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"downloadUrl"}}]}}]}}]} as unknown as DocumentNode<CreateFileDownloadUrlMutation, CreateFileDownloadUrlMutationVariables>;
export const CourseGradeBucketsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CourseGradeBuckets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gradeBucketsByCourseId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"courseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"courseId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CourseGradeBucketsQuery, CourseGradeBucketsQueryVariables>;
export const PeriodsByYearDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PeriodsByYear"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"periodsByYear"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}}]}}]}}]} as unknown as DocumentNode<PeriodsByYearQuery, PeriodsByYearQueryVariables>;
export const StudentsByCourseIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentsByCourseId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentsByCourseId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"courseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","alias":{"kind":"Name","value":"averageScore"},"name":{"kind":"Name","value":"averageScoreForStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"courseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"periodId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<StudentsByCourseIdQuery, StudentsByCourseIdQueryVariables>;
export const GradesByCourseIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GradesByCourseId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gradesByCourseId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"courseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"periodId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"comments"}},{"kind":"Field","name":{"kind":"Name","value":"bucket"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"studentGrades"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}},{"kind":"Field","name":{"kind":"Name","value":"averageScoreForStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"courseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"periodId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}}}]}]}},{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"comments"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"published"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GradesByCourseIdQuery, GradesByCourseIdQueryVariables>;
export const StudentGradesByCourseIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentGradesByCourseId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"average"},"name":{"kind":"Name","value":"averageCourseScoreForStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"courseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"periodId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"studentGradesByCourseId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"courseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}}},{"kind":"Argument","name":{"kind":"Name","value":"periodId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}}},{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"comments"}},{"kind":"Field","name":{"kind":"Name","value":"grade"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"comments"}},{"kind":"Field","name":{"kind":"Name","value":"bucket"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<StudentGradesByCourseIdQuery, StudentGradesByCourseIdQueryVariables>;
export const CourseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Course"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"course"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"studyPlan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gradeMetric"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"minimumApproval"}},{"kind":"Field","name":{"kind":"Name","value":"minimumExcellence"}},{"kind":"Field","name":{"kind":"Name","value":"maximum"}},{"kind":"Field","name":{"kind":"Name","value":"minimum"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CourseQuery, CourseQueryVariables>;
export const GetCoursesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCourses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"count"},"name":{"kind":"Name","value":"coursesCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]},{"kind":"Field","name":{"kind":"Name","value":"courses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"studyPlan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"subjectId"}},{"kind":"Field","name":{"kind":"Name","value":"studyPlanId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetCoursesQuery, GetCoursesQueryVariables>;
export const GetSchoolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSchools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"zip"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"currencyCode"}},{"kind":"Field","name":{"kind":"Name","value":"currentYear"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"primaryColor"}},{"kind":"Field","name":{"kind":"Name","value":"secondaryColor"}},{"kind":"Field","name":{"kind":"Name","value":"tertiaryColor"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetSchoolsQuery, GetSchoolsQueryVariables>;
export const UnreadMessagesCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UnreadMessagesCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unreadMessagesCount"}}]}}]} as unknown as DocumentNode<UnreadMessagesCountQuery, UnreadMessagesCountQueryVariables>;
export const FileShareFormCoursesBySchoolIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FileShareFormCoursesBySchoolId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"coursesBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<FileShareFormCoursesBySchoolIdQuery, FileShareFormCoursesBySchoolIdQueryVariables>;
export const FileShareFormShareFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FileShareFormShareFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"shareFileInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ShareFileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"shareFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"shareFileInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"shareFileInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<FileShareFormShareFileMutation, FileShareFormShareFileMutationVariables>;
export const FileShareFormRemoveShareDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FileShareFormRemoveShare"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"removeShareInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RemoveShareInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeShare"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"removeShareInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"removeShareInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<FileShareFormRemoveShareMutation, FileShareFormRemoveShareMutationVariables>;
export const FilesSharedWithMeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FilesSharedWithMe"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filesSharedWithMe"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"access"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"sharesCourses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"course"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"sharesUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"sharesSchools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"school"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"sharesClassGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<FilesSharedWithMeQuery, FilesSharedWithMeQueryVariables>;
export const FilesOwnedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FilesOwned"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"filesOwned"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"access"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"sharesCourses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"course"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]} as unknown as DocumentNode<FilesOwnedQuery, FilesOwnedQueryVariables>;
export const FilesCreateFileDownloadUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FilesCreateFileDownloadUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createFileDownloadInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateFileDownloadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFileDownloadUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createFileDownloadInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createFileDownloadInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"downloadUrl"}}]}}]}}]} as unknown as DocumentNode<FilesCreateFileDownloadUrlMutation, FilesCreateFileDownloadUrlMutationVariables>;
export const GradeBucketsFormUpdateGradeBucketDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GradeBucketsFormUpdateGradeBucket"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateGradeBucketInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGradeBucketInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGradeBucket"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateGradeBucketInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateGradeBucketInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"courseId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GradeBucketsFormUpdateGradeBucketMutation, GradeBucketsFormUpdateGradeBucketMutationVariables>;
export const GradeBucketsFormCreateGradeBucketDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GradeBucketsFormCreateGradeBucket"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createGradeBucketInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGradeBucketInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGradeBucket"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createGradeBucketInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createGradeBucketInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"courseId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GradeBucketsFormCreateGradeBucketMutation, GradeBucketsFormCreateGradeBucketMutationVariables>;
export const PeriodsByYearForReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PeriodsByYearForReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"year"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"periodsByYear"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"year"},"value":{"kind":"Variable","name":{"kind":"Name","value":"year"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}}]}}]}}]} as unknown as DocumentNode<PeriodsByYearForReportQuery, PeriodsByYearForReportQueryVariables>;
export const GradeReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GradeReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gradeReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"periodId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schoolName"}},{"kind":"Field","name":{"kind":"Name","value":"schoolLogoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"periodName"}},{"kind":"Field","name":{"kind":"Name","value":"studentName"}},{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"classGroupName"}},{"kind":"Field","name":{"kind":"Name","value":"teacherName"}},{"kind":"Field","name":{"kind":"Name","value":"studyPlanName"}},{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"periods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"gradesRows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"courseId"}},{"kind":"Field","name":{"kind":"Name","value":"courseName"}},{"kind":"Field","name":{"kind":"Name","value":"periodAverages"}},{"kind":"Field","name":{"kind":"Name","value":"cumulativeAverage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"overallGradesRow"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"periodAverages"}},{"kind":"Field","name":{"kind":"Name","value":"cumulativeAverage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"attendanceRows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"courseId"}},{"kind":"Field","name":{"kind":"Name","value":"courseName"}},{"kind":"Field","name":{"kind":"Name","value":"periodAttendance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"periodId"}},{"kind":"Field","name":{"kind":"Name","value":"absent"}},{"kind":"Field","name":{"kind":"Name","value":"late"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"habitRows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metricName"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}}]} as unknown as DocumentNode<GradeReportQuery, GradeReportQueryVariables>;
export const GradeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Grade"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"grade"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"comments"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"courseId"}},{"kind":"Field","name":{"kind":"Name","value":"published"}},{"kind":"Field","name":{"kind":"Name","value":"course"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"studyPlan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gradeMetric"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"minimum"}},{"kind":"Field","name":{"kind":"Name","value":"maximum"}},{"kind":"Field","name":{"kind":"Name","value":"minimumApproval"}},{"kind":"Field","name":{"kind":"Name","value":"minimumExcellence"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"bucket"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}}]}},{"kind":"Field","name":{"kind":"Name","value":"period"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"studentGrades"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"comments"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GradeQuery, GradeQueryVariables>;
export const UpdateGradeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateGrade"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateGradeInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGradeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGrade"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateGradeInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateGradeInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"published"}}]}}]}}]} as unknown as DocumentNode<UpdateGradeMutation, UpdateGradeMutationVariables>;
export const RemoveGradeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveGrade"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeGrade"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<RemoveGradeMutation, RemoveGradeMutationVariables>;
export const GradeBucketsByCourseIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GradeBucketsByCourseId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gradeBucketsByCourseId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"courseId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"courseId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}}]}}]}}]} as unknown as DocumentNode<GradeBucketsByCourseIdQuery, GradeBucketsByCourseIdQueryVariables>;
export const CreateGradeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateGrade"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createGradeInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGradeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGrade"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createGradeInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createGradeInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"comments"}},{"kind":"Field","name":{"kind":"Name","value":"bucketId"}},{"kind":"Field","name":{"kind":"Name","value":"published"}},{"kind":"Field","name":{"kind":"Name","value":"date"}}]}}]}}]} as unknown as DocumentNode<CreateGradeMutation, CreateGradeMutationVariables>;
export const GroupHabitsGetPeriodsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GroupHabitsGetPeriods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"periods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"year"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}}]}}]}}]} as unknown as DocumentNode<GroupHabitsGetPeriodsQuery, GroupHabitsGetPeriodsQueryVariables>;
export const GroupHabitsGetHabitMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GroupHabitsGetHabitMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"habitMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"order"}}]}}]}}]} as unknown as DocumentNode<GroupHabitsGetHabitMetricsQuery, GroupHabitsGetHabitMetricsQueryVariables>;
export const GroupHabitsGetHabitEvaluationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GroupHabitsGetHabitEvaluations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classGroupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"habitEvaluationsByGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classGroupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classGroupId"}}},{"kind":"Argument","name":{"kind":"Name","value":"periodId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"habitMetricId"}},{"kind":"Field","name":{"kind":"Name","value":"studentEvaluations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"comments"}}]}}]}}]}}]} as unknown as DocumentNode<GroupHabitsGetHabitEvaluationsQuery, GroupHabitsGetHabitEvaluationsQueryVariables>;
export const GroupHabitsSaveHabitEvaluationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupHabitsSaveHabitEvaluation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"saveHabitEvaluationInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SaveHabitEvaluationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveHabitEvaluation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"saveHabitEvaluationInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"saveHabitEvaluationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"published"}}]}}]}}]} as unknown as DocumentNode<GroupHabitsSaveHabitEvaluationMutation, GroupHabitsSaveHabitEvaluationMutationVariables>;
export const GroupScheduleFormCoursesByGroupIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GroupScheduleFormCoursesByGroupId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"coursesByGroupId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"groupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<GroupScheduleFormCoursesByGroupIdQuery, GroupScheduleFormCoursesByGroupIdQueryVariables>;
export const GroupScheduleFormUpdateGroupsScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupScheduleFormUpdateGroupsSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateGroupsScheduleInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGroupsScheduleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGroupsSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateGroupsScheduleInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateGroupsScheduleInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<GroupScheduleFormUpdateGroupsScheduleMutation, GroupScheduleFormUpdateGroupsScheduleMutationVariables>;
export const GroupScheduleFormCreateGroupsScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupScheduleFormCreateGroupsSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createGroupsScheduleInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupsScheduleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGroupsSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createGroupsScheduleInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createGroupsScheduleInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<GroupScheduleFormCreateGroupsScheduleMutation, GroupScheduleFormCreateGroupsScheduleMutationVariables>;
export const GroupScheduleGroupsSchedulesByClassGroupIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GroupScheduleGroupsSchedulesByClassGroupId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"classGroupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groupsSchedulesByClassGroupId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"classGroupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"classGroupId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weekday"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"remote"}},{"kind":"Field","name":{"kind":"Name","value":"remoteLink"}},{"kind":"Field","name":{"kind":"Name","value":"courseId"}},{"kind":"Field","name":{"kind":"Name","value":"course"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GroupScheduleGroupsSchedulesByClassGroupIdQuery, GroupScheduleGroupsSchedulesByClassGroupIdQueryVariables>;
export const GroupScheduleUpdateGroupsScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GroupScheduleUpdateGroupsSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateGroupsScheduleInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGroupsScheduleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGroupsSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateGroupsScheduleInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateGroupsScheduleInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<GroupScheduleUpdateGroupsScheduleMutation, GroupScheduleUpdateGroupsScheduleMutationVariables>;
export const ClassGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ClassGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"studyPlanId"}},{"kind":"Field","name":{"kind":"Name","value":"students"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"courses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"studyPlan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"degree"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ClassGroupQuery, ClassGroupQueryVariables>;
export const GetClassGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetClassGroups"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"count"},"name":{"kind":"Name","value":"classGroupsCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"classGroups"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"studyPlanId"}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"studyPlan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetClassGroupsQuery, GetClassGroupsQueryVariables>;
export const OnboardingStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OnboardingStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboardingStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onboardingCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"schoolName"}},{"kind":"Field","name":{"kind":"Name","value":"degreesCount"}},{"kind":"Field","name":{"kind":"Name","value":"studyPlansCount"}},{"kind":"Field","name":{"kind":"Name","value":"coursesCount"}},{"kind":"Field","name":{"kind":"Name","value":"groupsCount"}}]}}]}}]} as unknown as DocumentNode<OnboardingStatusQuery, OnboardingStatusQueryVariables>;
export const AdminDashboardStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminDashboardStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"coursesCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"findManyStudentsCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"findManyTeachersCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"findManySubjectsCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}]}]}}]} as unknown as DocumentNode<AdminDashboardStatsQuery, AdminDashboardStatsQueryVariables>;
export const RecentMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RecentMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findManyMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"message"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<RecentMessagesQuery, RecentMessagesQueryVariables>;
export const RecentStudentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RecentStudents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"students"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<RecentStudentsQuery, RecentStudentsQueryVariables>;
export const RecentNewslettersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RecentNewsletters"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishedNewsletters"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<RecentNewslettersQuery, RecentNewslettersQueryVariables>;
export const RecentTeachersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RecentTeachers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teachers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}},{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<RecentTeachersQuery, RecentTeachersQueryVariables>;
export const MessageFindMessageByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MessageFindMessageById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findMessageById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"recipients"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"student"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"replies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"parentMessageId"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]}}]} as unknown as DocumentNode<MessageFindMessageByIdQuery, MessageFindMessageByIdQueryVariables>;
export const MessageMarkAsReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MessageMarkAsRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"messageId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markMessageAsRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"messageId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"messageId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}}]}}]} as unknown as DocumentNode<MessageMarkAsReadMutation, MessageMarkAsReadMutationVariables>;
export const MessageCreateMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MessageCreateMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createMessageInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createMessageInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createMessageInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<MessageCreateMessageMutation, MessageCreateMessageMutationVariables>;
export const MessagesFindManyMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MessagesFindManyMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"count"},"name":{"kind":"Name","value":"findManyMessagesCount"}},{"kind":"Field","name":{"kind":"Name","value":"findManyMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"message"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"recipients"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<MessagesFindManyMessagesQuery, MessagesFindManyMessagesQueryVariables>;
export const MessagesFindMyMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MessagesFindMyMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"count"},"name":{"kind":"Name","value":"findSentMessagesCount"}},{"kind":"Field","name":{"kind":"Name","value":"findMyMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"recipients"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}}]}}]}}]}}]} as unknown as DocumentNode<MessagesFindMyMessagesQuery, MessagesFindMyMessagesQueryVariables>;
export const MessagesRemoveMessageRecipientDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MessagesRemoveMessageRecipient"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeMessageRecipient"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<MessagesRemoveMessageRecipientMutation, MessagesRemoveMessageRecipientMutationVariables>;
export const MessagesRemoveMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MessagesRemoveMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<MessagesRemoveMessageMutation, MessagesRemoveMessageMutationVariables>;
export const GetNewsletterViewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetNewsletterView"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"newsletter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"published"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"school"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<GetNewsletterViewQuery, GetNewsletterViewQueryVariables>;
export const OnboardingRequestJoinSchoolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OnboardingRequestJoinSchool"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RequestJoinSchoolInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestJoinSchool"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<OnboardingRequestJoinSchoolMutation, OnboardingRequestJoinSchoolMutationVariables>;
export const OnboardingCreateSchoolWithOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OnboardingCreateSchoolWithOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSchoolWithOrgInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSchoolWithOrganization"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}}]}}]}}]} as unknown as DocumentNode<OnboardingCreateSchoolWithOrganizationMutation, OnboardingCreateSchoolWithOrganizationMutationVariables>;
export const OnboardingAvailableSchoolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OnboardingAvailableSchools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableSchools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"organizationName"}},{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"studentCount"}}]}}]}}]} as unknown as DocumentNode<OnboardingAvailableSchoolsQuery, OnboardingAvailableSchoolsQueryVariables>;
export const OnboardingCreateSchoolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OnboardingCreateSchool"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createSchoolInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSchoolInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSchool"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createSchoolInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createSchoolInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"organizationId"}},{"kind":"Field","name":{"kind":"Name","value":"currencyCode"}}]}}]}}]} as unknown as DocumentNode<OnboardingCreateSchoolMutation, OnboardingCreateSchoolMutationVariables>;
export const OnboardingCompleteOnboardingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OnboardingCompleteOnboarding"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"completeOnboarding"}}]}}]} as unknown as DocumentNode<OnboardingCompleteOnboardingMutation, OnboardingCompleteOnboardingMutationVariables>;
export const OnboardingStepsGetSchoolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OnboardingStepsGetSchools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<OnboardingStepsGetSchoolsQuery, OnboardingStepsGetSchoolsQueryVariables>;
export const OnboardingStepsStudyPlansBySchoolIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OnboardingStepsStudyPlansBySchoolId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studyPlansBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<OnboardingStepsStudyPlansBySchoolIdQuery, OnboardingStepsStudyPlansBySchoolIdQueryVariables>;
export const OnboardingStepsGetSubjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OnboardingStepsGetSubjects"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"subjects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<OnboardingStepsGetSubjectsQuery, OnboardingStepsGetSubjectsQueryVariables>;
export const OnboardingStepsCreateCourseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OnboardingStepsCreateCourse"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createCourseInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCourseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCourse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createCourseInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createCourseInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<OnboardingStepsCreateCourseMutation, OnboardingStepsCreateCourseMutationVariables>;
export const OnboardingStepsDegreesGetSchoolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OnboardingStepsDegreesGetSchools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<OnboardingStepsDegreesGetSchoolsQuery, OnboardingStepsDegreesGetSchoolsQueryVariables>;
export const OnboardingStepsCreateDegreeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OnboardingStepsCreateDegree"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createDegreeInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateDegreeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDegree"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createDegreeInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createDegreeInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<OnboardingStepsCreateDegreeMutation, OnboardingStepsCreateDegreeMutationVariables>;
export const OnboardingStepsGroupsGetSchoolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OnboardingStepsGroupsGetSchools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<OnboardingStepsGroupsGetSchoolsQuery, OnboardingStepsGroupsGetSchoolsQueryVariables>;
export const OnboardingStepsGroupsStudyPlansBySchoolIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OnboardingStepsGroupsStudyPlansBySchoolId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studyPlansBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<OnboardingStepsGroupsStudyPlansBySchoolIdQuery, OnboardingStepsGroupsStudyPlansBySchoolIdQueryVariables>;
export const OnboardingStepsCreateClassGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OnboardingStepsCreateClassGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createClassGroupInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateClassGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createClassGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createClassGroupInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createClassGroupInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<OnboardingStepsCreateClassGroupMutation, OnboardingStepsCreateClassGroupMutationVariables>;
export const OnboardingStepsSchoolBasicsGetSchoolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OnboardingStepsSchoolBasicsGetSchools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"currentYear"}}]}}]}}]} as unknown as DocumentNode<OnboardingStepsSchoolBasicsGetSchoolsQuery, OnboardingStepsSchoolBasicsGetSchoolsQueryVariables>;
export const OnboardingStepsUpdateSchoolDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OnboardingStepsUpdateSchool"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateSchoolInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSchoolInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSchool"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateSchoolInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateSchoolInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currentYear"}}]}}]}}]} as unknown as DocumentNode<OnboardingStepsUpdateSchoolMutation, OnboardingStepsUpdateSchoolMutationVariables>;
export const OnboardingStepsStudyPlansGetSchoolsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OnboardingStepsStudyPlansGetSchools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schools"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<OnboardingStepsStudyPlansGetSchoolsQuery, OnboardingStepsStudyPlansGetSchoolsQueryVariables>;
export const OnboardingStepsDegreesBySchoolIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OnboardingStepsDegreesBySchoolId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"degreesBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<OnboardingStepsDegreesBySchoolIdQuery, OnboardingStepsDegreesBySchoolIdQueryVariables>;
export const OnboardingStepsGetGradeMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OnboardingStepsGetGradeMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gradeMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<OnboardingStepsGetGradeMetricsQuery, OnboardingStepsGetGradeMetricsQueryVariables>;
export const OnboardingStepsCreateStudyPlanDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"OnboardingStepsCreateStudyPlan"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createStudyPlanInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateStudyPlanInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createStudyPlan"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createStudyPlanInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createStudyPlanInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<OnboardingStepsCreateStudyPlanMutation, OnboardingStepsCreateStudyPlanMutationVariables>;
export const OnboardingMyJoinRequestStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OnboardingMyJoinRequestStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myJoinRequestStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"requestedRole"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"schoolName"}}]}}]}}]} as unknown as DocumentNode<OnboardingMyJoinRequestStatusQuery, OnboardingMyJoinRequestStatusQueryVariables>;
export const ParentFinancesLinkedStudentsSummaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ParentFinancesLinkedStudentsSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkedStudentsFinancialSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}},{"kind":"Field","name":{"kind":"Name","value":"totalCharges"}},{"kind":"Field","name":{"kind":"Name","value":"totalPayments"}},{"kind":"Field","name":{"kind":"Name","value":"balance"}}]}}]}}]} as unknown as DocumentNode<ParentFinancesLinkedStudentsSummaryQuery, ParentFinancesLinkedStudentsSummaryQueryVariables>;
export const QuizFormCoursesBySchoolIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuizFormCoursesBySchoolId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"coursesBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<QuizFormCoursesBySchoolIdQuery, QuizFormCoursesBySchoolIdQueryVariables>;
export const QuizzesListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuizzesList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"quizzes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"course"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}}]}}]}}]}}]} as unknown as DocumentNode<QuizzesListQuery, QuizzesListQueryVariables>;
export const QuizDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Quiz"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"quiz"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"course"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"questions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"question"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"timeLimit"}},{"kind":"Field","name":{"kind":"Name","value":"options"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"option"}},{"kind":"Field","name":{"kind":"Name","value":"isCorrect"}}]}}]}}]}}]}}]} as unknown as DocumentNode<QuizQuery, QuizQueryVariables>;
export const CreateQuizDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateQuiz"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createQuizInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateQuizInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createQuiz"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createQuizInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createQuizInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"courseId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateQuizMutation, CreateQuizMutationVariables>;
export const UpdateQuizDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateQuiz"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateQuizInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateQuizInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateQuiz"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateQuizInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateQuizInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"courseId"}},{"kind":"Field","name":{"kind":"Name","value":"teacherId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateQuizMutation, UpdateQuizMutationVariables>;
export const RemoveQuizDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveQuiz"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeQuiz"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<RemoveQuizMutation, RemoveQuizMutationVariables>;
export const MyStoreCartCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyStoreCartCount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myStoreCart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}}]}}]}}]} as unknown as DocumentNode<MyStoreCartCountQuery, MyStoreCartCountQueryVariables>;
export const StudentAttendanceStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentAttendanceStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentAttendanceStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"present"}},{"kind":"Field","name":{"kind":"Name","value":"absent"}},{"kind":"Field","name":{"kind":"Name","value":"late"}},{"kind":"Field","name":{"kind":"Name","value":"sickLeave"}},{"kind":"Field","name":{"kind":"Name","value":"excused"}},{"kind":"Field","name":{"kind":"Name","value":"presentPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"absentPercentage"}}]}}]}}]} as unknown as DocumentNode<StudentAttendanceStatsQuery, StudentAttendanceStatsQueryVariables>;
export const AttendanceRecordsByStudentIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AttendanceRecordsByStudentId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attendanceRecordsByStudentId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"attendanceSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"course"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AttendanceRecordsByStudentIdQuery, AttendanceRecordsByStudentIdQueryVariables>;
export const StudentFinancesBalanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentFinancesBalance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentBalance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"totalCharges"}},{"kind":"Field","name":{"kind":"Name","value":"totalPayments"}},{"kind":"Field","name":{"kind":"Name","value":"balance"}}]}}]}}]} as unknown as DocumentNode<StudentFinancesBalanceQuery, StudentFinancesBalanceQueryVariables>;
export const StudentFinancesChargesByStudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentFinancesChargesByStudent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chargesByStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"dueDate"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"chargeType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<StudentFinancesChargesByStudentQuery, StudentFinancesChargesByStudentQueryVariables>;
export const StudentFinancesPaymentsByStudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentFinancesPaymentsByStudent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"paymentsByStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"studentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"studentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"paidAt"}},{"kind":"Field","name":{"kind":"Name","value":"reference"}}]}}]}}]} as unknown as DocumentNode<StudentFinancesPaymentsByStudentQuery, StudentFinancesPaymentsByStudentQueryVariables>;
export const ClassGroupsBySchoolIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ClassGroupsBySchoolId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"classGroupsBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ClassGroupsBySchoolIdQuery, ClassGroupsBySchoolIdQueryVariables>;
export const StudentFormDataDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentFormData"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"student"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"middleName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}},{"kind":"Field","name":{"kind":"Name","value":"motherName"}},{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"classGroupId"}},{"kind":"Field","name":{"kind":"Name","value":"birthDate"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"enrollmentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"bloodType"}},{"kind":"Field","name":{"kind":"Name","value":"allergies"}},{"kind":"Field","name":{"kind":"Name","value":"medicalNotes"}},{"kind":"Field","name":{"kind":"Name","value":"emergencyContactName"}},{"kind":"Field","name":{"kind":"Name","value":"emergencyContactPhone"}}]}}]}}]} as unknown as DocumentNode<StudentFormDataQuery, StudentFormDataQueryVariables>;
export const UpdateStudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStudent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateStudentInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateStudentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateStudentInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateStudentInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateStudentMutation, UpdateStudentMutationVariables>;
export const CreateStudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateStudent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createStudentInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateStudentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createStudentInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createStudentInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateStudentMutation, CreateStudentMutationVariables>;
export const UpdateStudentGradeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStudentGrade"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateStudentGradeInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateStudentGradeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateStudentGrade"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateStudentGradeInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateStudentGradeInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"comments"}},{"kind":"Field","name":{"kind":"Name","value":"gradeId"}},{"kind":"Field","name":{"kind":"Name","value":"studentId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateStudentGradeMutation, UpdateStudentGradeMutationVariables>;
export const StudentDashboardStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentDashboardStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"coursesCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"findManyMessagesCount"}}]}}]} as unknown as DocumentNode<StudentDashboardStatsQuery, StudentDashboardStatsQueryVariables>;
export const StudentAssignmentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentAssignments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignmentsBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"course"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<StudentAssignmentsQuery, StudentAssignmentsQueryVariables>;
export const StudentRecentMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentRecentMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findManyMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"message"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<StudentRecentMessagesQuery, StudentRecentMessagesQueryVariables>;
export const StudentRecentNewslettersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StudentRecentNewsletters"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishedNewsletters"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<StudentRecentNewslettersQuery, StudentRecentNewslettersQueryVariables>;
export const StudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Student"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"student"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"enrollmentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"bloodType"}},{"kind":"Field","name":{"kind":"Name","value":"allergies"}},{"kind":"Field","name":{"kind":"Name","value":"medicalNotes"}},{"kind":"Field","name":{"kind":"Name","value":"emergencyContactName"}},{"kind":"Field","name":{"kind":"Name","value":"emergencyContactPhone"}},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"studyPlan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"gradeMetric"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"minimumApproval"}},{"kind":"Field","name":{"kind":"Name","value":"minimumExcellence"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"courses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"parents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"relationship"}}]}},{"kind":"Field","name":{"kind":"Name","value":"studentGrades"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"comments"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"grade"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"comments"}},{"kind":"Field","name":{"kind":"Name","value":"published"}},{"kind":"Field","name":{"kind":"Name","value":"course"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"bucket"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"weight"}}]}},{"kind":"Field","name":{"kind":"Name","value":"period"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"birthDate"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<StudentQuery, StudentQueryVariables>;
export const GetStudentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetStudents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"count"},"name":{"kind":"Name","value":"findManyStudentsCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]},{"kind":"Field","name":{"kind":"Name","value":"students"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"middleName"}},{"kind":"Field","name":{"kind":"Name","value":"motherName"}},{"kind":"Field","name":{"kind":"Name","value":"birthDate"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}},{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"classGroupId"}},{"kind":"Field","name":{"kind":"Name","value":"enrollmentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"classGroup"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"color"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetStudentsQuery, GetStudentsQueryVariables>;
export const ResendUserInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResendUserInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resendUserInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}]}}]} as unknown as DocumentNode<ResendUserInvitationMutation, ResendUserInvitationMutationVariables>;
export const RemoveStudentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveStudent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeStudent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<RemoveStudentMutation, RemoveStudentMutationVariables>;
export const TeacherFormDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeacherForm"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacher"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"middleName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}},{"kind":"Field","name":{"kind":"Name","value":"motherName"}},{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"birthDate"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"personalEmail"}},{"kind":"Field","name":{"kind":"Name","value":"about"}},{"kind":"Field","name":{"kind":"Name","value":"teacherSince"}},{"kind":"Field","name":{"kind":"Name","value":"memberSince"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<TeacherFormQuery, TeacherFormQueryVariables>;
export const UpdateTeacherDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTeacher"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateTeacherInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTeacherInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTeacher"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateTeacherInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateTeacherInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateTeacherMutation, UpdateTeacherMutationVariables>;
export const CreateTeacherDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTeacher"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createTeacherInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTeacherInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeacher"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createTeacherInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createTeacherInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateTeacherMutation, CreateTeacherMutationVariables>;
export const TeacherDashboardStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeacherDashboardStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"coursesCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}]},{"kind":"Field","name":{"kind":"Name","value":"findManyStudentsCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}]}]}}]} as unknown as DocumentNode<TeacherDashboardStatsQuery, TeacherDashboardStatsQueryVariables>;
export const TeacherAssignmentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeacherAssignments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignmentsBySchoolId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"course"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<TeacherAssignmentsQuery, TeacherAssignmentsQueryVariables>;
export const TeacherRecentMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeacherRecentMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"findManyMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"message"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<TeacherRecentMessagesQuery, TeacherRecentMessagesQueryVariables>;
export const TeacherRecentNewslettersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeacherRecentNewsletters"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishedNewsletters"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<TeacherRecentNewslettersQuery, TeacherRecentNewslettersQueryVariables>;
export const TeacherDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Teacher"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teacher"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teacherId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"middleName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}},{"kind":"Field","name":{"kind":"Name","value":"motherName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"documentId"}},{"kind":"Field","name":{"kind":"Name","value":"birthDate"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"personalEmail"}},{"kind":"Field","name":{"kind":"Name","value":"about"}},{"kind":"Field","name":{"kind":"Name","value":"teacherSince"}},{"kind":"Field","name":{"kind":"Name","value":"memberSince"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}}]}},{"kind":"Field","name":{"kind":"Name","value":"subjects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"courses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"classGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<TeacherQuery, TeacherQueryVariables>;
export const GetTeachersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTeachers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"count"},"name":{"kind":"Name","value":"findManyTeachersCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]},{"kind":"Field","name":{"kind":"Name","value":"teachers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"initials"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetTeachersQuery, GetTeachersQueryVariables>;
export const RemoveTeacherDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveTeacher"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeTeacher"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<RemoveTeacherMutation, RemoveTeacherMutationVariables>;
export const StoreMeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StoreMe"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"themePreference"}},{"kind":"Field","name":{"kind":"Name","value":"role"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"descriptiveId"}}]}}]}}]}}]}}]} as unknown as DocumentNode<StoreMeQuery, StoreMeQueryVariables>;
export const StoreCategoriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StoreCategories"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeCategories"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StoreCategoriesQuery, StoreCategoriesQueryVariables>;
export const StoreCategoriesAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StoreCategoriesAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeCategoriesAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StoreCategoriesAdminQuery, StoreCategoriesAdminQueryVariables>;
export const StoreProductsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StoreProducts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"categoryId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeProducts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"categoryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"categoryId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StoreProductsQuery, StoreProductsQueryVariables>;
export const StoreProductDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StoreProduct"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeProduct"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StoreProductQuery, StoreProductQueryVariables>;
export const StoreProductsAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StoreProductsAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeProductsAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<StoreProductsAdminQuery, StoreProductsAdminQueryVariables>;
export const MyStoreCartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyStoreCart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myStoreCart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCartItemFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCartItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCartItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"productId"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<MyStoreCartQuery, MyStoreCartQueryVariables>;
export const MyStoreOrdersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyStoreOrders"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myStoreOrders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreOrderFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreOrderItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreOrderItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderId"}},{"kind":"Field","name":{"kind":"Name","value":"productId"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreOrderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreOrder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"paymentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreOrderItemFields"}}]}}]}}]} as unknown as DocumentNode<MyStoreOrdersQuery, MyStoreOrdersQueryVariables>;
export const StoreOrderDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StoreOrder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreOrderFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreOrderItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreOrderItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderId"}},{"kind":"Field","name":{"kind":"Name","value":"productId"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreOrderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreOrder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"paymentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreOrderItemFields"}}]}}]}}]} as unknown as DocumentNode<StoreOrderQuery, StoreOrderQueryVariables>;
export const StoreOrdersAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StoreOrdersAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storeOrdersAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreOrderFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreOrderItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreOrderItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderId"}},{"kind":"Field","name":{"kind":"Name","value":"productId"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreOrderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreOrder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"paymentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreOrderItemFields"}}]}}]}}]} as unknown as DocumentNode<StoreOrdersAdminQuery, StoreOrdersAdminQueryVariables>;
export const AddToStoreCartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddToStoreCart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddToCartInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addToStoreCart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCartItemFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCartItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCartItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"productId"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<AddToStoreCartMutation, AddToStoreCartMutationVariables>;
export const UpdateStoreCartItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStoreCartItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCartItemInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateStoreCartItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCartItemFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCartItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCartItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"productId"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateStoreCartItemMutation, UpdateStoreCartItemMutationVariables>;
export const RemoveStoreCartItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveStoreCartItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cartItemId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeStoreCartItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cartItemId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cartItemId"}}}]}]}}]} as unknown as DocumentNode<RemoveStoreCartItemMutation, RemoveStoreCartItemMutationVariables>;
export const ClearStoreCartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClearStoreCart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearStoreCart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}]}]}}]} as unknown as DocumentNode<ClearStoreCartMutation, ClearStoreCartMutationVariables>;
export const CheckoutStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CheckoutStore"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CheckoutStoreInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"checkoutStore"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreOrderFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreOrderItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreOrderItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderId"}},{"kind":"Field","name":{"kind":"Name","value":"productId"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreOrderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreOrder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"paymentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreOrderItemFields"}}]}}]}}]} as unknown as DocumentNode<CheckoutStoreMutation, CheckoutStoreMutationVariables>;
export const ProcessStorePaymentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProcessStorePayment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProcessStorePaymentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processStorePayment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreOrderFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreOrderItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreOrderItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderId"}},{"kind":"Field","name":{"kind":"Name","value":"productId"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreOrderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreOrder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"paymentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreOrderItemFields"}}]}}]}}]} as unknown as DocumentNode<ProcessStorePaymentMutation, ProcessStorePaymentMutationVariables>;
export const CreateStoreCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateStoreCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateStoreCategoryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createStoreCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateStoreCategoryMutation, CreateStoreCategoryMutationVariables>;
export const UpdateStoreCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStoreCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateStoreCategoryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateStoreCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateStoreCategoryMutation, UpdateStoreCategoryMutationVariables>;
export const DeleteStoreCategoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteStoreCategory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteStoreCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteStoreCategoryMutation, DeleteStoreCategoryMutationVariables>;
export const CreateStoreProductDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateStoreProduct"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateStoreProductInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createStoreProduct"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateStoreProductMutation, CreateStoreProductMutationVariables>;
export const UpdateStoreProductDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStoreProduct"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateStoreProductInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateStoreProduct"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateStoreProductMutation, UpdateStoreProductMutationVariables>;
export const DeleteStoreProductDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteStoreProduct"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteStoreProduct"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteStoreProductMutation, DeleteStoreProductMutationVariables>;
export const UpdateStoreOrderStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStoreOrderStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateStoreOrderStatusInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateStoreOrderStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreOrderFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreOrderItemFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreOrderItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"orderId"}},{"kind":"Field","name":{"kind":"Name","value":"productId"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreOrderFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreOrder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"paymentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreOrderItemFields"}}]}}]}}]} as unknown as DocumentNode<UpdateStoreOrderStatusMutation, UpdateStoreOrderStatusMutationVariables>;
export const PublicSchoolsForStoreDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublicSchoolsForStore"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publicSchoolsForStore"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"currencyCode"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}}]}}]}}]} as unknown as DocumentNode<PublicSchoolsForStoreQuery, PublicSchoolsForStoreQueryVariables>;
export const PublicSchoolBySlugDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublicSchoolBySlug"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publicSchoolBySlug"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"currencyCode"}},{"kind":"Field","name":{"kind":"Name","value":"logoUrl"}}]}}]}}]} as unknown as DocumentNode<PublicSchoolBySlugQuery, PublicSchoolBySlugQueryVariables>;
export const PublicStoreCategoriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublicStoreCategories"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publicStoreCategories"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<PublicStoreCategoriesQuery, PublicStoreCategoriesQueryVariables>;
export const PublicStoreProductsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublicStoreProducts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"categoryId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publicStoreProducts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"schoolId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"schoolId"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"categoryId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"categoryId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<PublicStoreProductsQuery, PublicStoreProductsQueryVariables>;
export const PublicStoreProductDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublicStoreProduct"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publicStoreProduct"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreProductFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreCategoryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreCategory"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"StoreProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"StoreProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"schoolId"}},{"kind":"Field","name":{"kind":"Name","value":"categoryId"}},{"kind":"Field","name":{"kind":"Name","value":"category"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"StoreCategoryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<PublicStoreProductQuery, PublicStoreProductQueryVariables>;