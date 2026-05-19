import { User } from '@/auth';
import { $Enums, Prisma } from '@generated/prisma';
import { ClassGroup } from '../../class-groups/entities/class-group.entity';
import { Course } from '../../courses/entities/course.entity';
import { Parent } from '../../parents/entities/parent.entity';
import { StudentGrade } from '../../student-grades/entities/student-grade.entity';

export class StudentSubmissionFile {
    id: string;

    name: string;

    mimeType: string;

    size: number;
}

export class StudentAssignmentSubmission {
    id: string;

    submittedAt: Date;

    file: StudentSubmissionFile;
}

export class Student
  implements
    Prisma.StudentGetPayload<{
      include: {
        classGroup: true;
        user: true;
        courses: true;
        studentGrades: true;
        parents: true;
      };
    }>
{
    id: string;
    firstName: string;
    middleName: string;
    fatherName: string;
    motherName: string;
    documentId: string;
    organizationId: string;
    schoolId: string;
    classGroupId: string | null;
    classGroup: ClassGroup | null;
    birthDate: Date;
    gender: $Enums.Gender;
    address: string;
    phone: string;

    enrollmentStatus: $Enums.EnrollmentStatus;

    bloodType: string;

    allergies: string;

    medicalNotes: string;

    emergencyContactName: string;

    emergencyContactPhone: string;

    studentGrades: StudentGrade[];

    assignmentSubmissions: StudentAssignmentSubmission[];

    user: User;
    userId: string;
    courses: Course[];

    parents: Parent[];

    createdAt: Date;
    updatedAt: Date;
}
