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

export type CheckPendingInvitationResult = {
  __typename?: 'CheckPendingInvitationResult';
  hasPendingInvitation: Scalars['Boolean']['output'];
  organizationName?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
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
  /** Short name of the school */
  shortName: Scalars['String']['input'];
  /** State of the school */
  state?: Scalars['String']['input'];
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
  approveJoinRequest: Scalars['Boolean']['output'];
  cancelInvitation: Scalars['Boolean']['output'];
  changePassword: Scalars['Boolean']['output'];
  completeOnboarding: Scalars['Boolean']['output'];
  createAssignment: Assignment;
  /** Create an assignment submission after file upload */
  createAssignmentSubmission: AssignmentSubmission;
  createAttendanceSession: AttendanceSession;
  createCharge: Array<Charge>;
  createClassGroup: ClassGroup;
  createCourse: Course;
  createDegree: Degree;
  createFile: File;
  createFileDownloadUrl: FileDownloadUrl;
  createFileUploadUrl: FileUploadUrl;
  createGrade: Grade;
  createGradeBucket: GradeBucket;
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
  inviteMember: Invitation;
  login: AuthPayload;
  markMessageAsRead?: Maybe<MessageRecipient>;
  markNotificationRead: Scalars['Boolean']['output'];
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
  updateStudent: Student;
  updateStudentGrade: StudentGrade;
  updateStudyPlan: StudyPlan;
  updateStudyPlanFinancialConfig: StudyPlan;
  updateSubject: Subject;
  updateTeacher: Teacher;
  updateUser: User;
};


export type MutationAcceptInvitationArgs = {
  invitationId: Scalars['String']['input'];
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


export type MutationCreateCourseArgs = {
  createCourseInput: CreateCourseInput;
};


export type MutationCreateDegreeArgs = {
  createDegreeInput: CreateDegreeInput;
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


export type MutationInviteMemberArgs = {
  email: Scalars['String']['input'];
  organizationId?: InputMaybe<Scalars['String']['input']>;
  role: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationMarkMessageAsReadArgs = {
  messageId: Scalars['String']['input'];
};


export type MutationMarkNotificationReadArgs = {
  notificationId: Scalars['String']['input'];
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
  myJoinRequestStatus?: Maybe<JoinRequestStatus>;
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
  publishedNewsletters: Array<Newsletter>;
  quiz: Quiz;
  quizzes: Array<Quiz>;
  role: Role;
  roles: Array<Role>;
  school: School;
  /** Get a presigned URL for downloading a school logo */
  schoolLogoDownloadUrl: SchoolLogoDownloadUrl;
  schools: Array<School>;
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
  /** Short name of the school */
  shortName: Scalars['String']['output'];
  /** State of the school */
  state: Scalars['String']['output'];
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
  color: Scalars['String']['output'];
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
  user: User;
  /** User ID of the teacher */
  userId: Scalars['String']['output'];
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
  /** Short name of the school */
  shortName?: InputMaybe<Scalars['String']['input']>;
  /** State of the school */
  state?: InputMaybe<Scalars['String']['input']>;
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
  updatedAt: Scalars['DateTime']['output'];
};

export type UserStudent = {
  __typename?: 'UserStudent';
  address: Scalars['String']['output'];
  allergies: Scalars['String']['output'];
  birthDate: Scalars['DateTime']['output'];
  bloodType: Scalars['String']['output'];
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

export type AssignmentQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type AssignmentQuery = { __typename?: 'Query', assignment: { __typename?: 'Assignment', id: string, title: string, details: string, date: any, createdAt: any, updatedAt: any, requireSubmission: boolean, course: { __typename?: 'Course', id: string, name: string }, teacher: { __typename?: 'Teacher', id: string, firstName: string, fatherName: string } } };


export const AssignmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Assignment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"course"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teacher"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"fatherName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"requireSubmission"}}]}}]}}]} as unknown as DocumentNode<AssignmentQuery, AssignmentQueryVariables>;