import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OnboardingStep, sendUserInvitation } from '@/auth';
import type { ImportEntityType } from '@generated/prisma';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import Papa from 'papaparse';

export interface RowValidationResult {
  rowNumber: number;
  action: 'CREATE' | 'UPDATE' | 'SKIP';
  errors: string[];
  data?: Record<string, unknown>;
}

export interface DryRunResult {
  jobId: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  results: RowValidationResult[];
}

const MAX_ROWS = 500;

/**
 * `Gender` in Prisma is `MALE | FEMALE` only. CSV files are authored by school
 * staff in Spanish, so both spellings are accepted and normalized here — the
 * previous validator accepted `MASCULINO/FEMENINO/OTRO` and then failed at
 * insert time because those values do not exist in the enum.
 */
const GENDER_ALIASES: Record<string, 'MALE' | 'FEMALE'> = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  M: 'MALE',
  F: 'FEMALE',
  MASCULINO: 'MALE',
  FEMENINO: 'FEMALE',
};

const GENDER_INPUT_HINT = 'Use MASCULINO/FEMENINO (o MALE/FEMALE).';

/** Normalize a CSV gender cell to the Prisma `Gender` enum, or null if invalid. */
function normalizeGender(value: unknown): 'MALE' | 'FEMALE' | null {
  const key = String(value ?? '')
    .trim()
    .toUpperCase();
  return GENDER_ALIASES[key] ?? null;
}

const STUDENT_REQUIRED_COLUMNS = [
  'firstName',
  'middleName',
  'fatherName',
  'motherName',
  'documentId',
  'birthDate',
  'gender',
  'address',
  'phone',
];

const TEACHER_REQUIRED_COLUMNS = [
  'firstName',
  'middleName',
  'fatherName',
  'motherName',
  'documentId',
  'birthDate',
  'gender',
  'phoneNumber',
  'personalEmail',
];

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(private prisma: PrismaService) {}

  parseCsv(csvText: string): Record<string, unknown>[] {
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    if (parsed.errors.length > 0) {
      throw new BadRequestException(`CSV parse error: ${parsed.errors[0].message}`);
    }

    const rows = parsed.data as Record<string, unknown>[];
    if (rows.length > MAX_ROWS) {
      throw new BadRequestException(
        `El archivo supera el límite de ${MAX_ROWS} filas (${rows.length} detectadas).`,
      );
    }

    return rows;
  }

  validateStudentRow(
    row: Record<string, unknown>,
    rowNumber: number,
    orgId: string,
    schoolId: string,
    existingDocumentIds: Set<string>,
  ): RowValidationResult {
    const errors: string[] = [];

    for (const col of STUDENT_REQUIRED_COLUMNS) {
      if (!row[col] || String(row[col]).trim() === '') {
        errors.push(`Columna requerida vacía: ${col}`);
      }
    }

    // Students are unique per school (`documentId` + `schoolId`), so the
    // existence key must be school-scoped — it is built the same way in
    // `dryRun`. An already-present student is an UPDATE, not an error.
    const documentId = String(row.documentId || '').trim();
    const alreadyExists = documentId ? existingDocumentIds.has(`${schoolId}:${documentId}`) : false;

    const gender = normalizeGender(row.gender);
    if (!gender) {
      errors.push(`Género inválido: ${row.gender}. ${GENDER_INPUT_HINT}`);
    }

    const action = errors.length > 0 ? 'SKIP' : alreadyExists ? 'UPDATE' : 'CREATE';

    return {
      rowNumber,
      action,
      errors,
      // Persist the normalized value so commit never re-derives it.
      data: { ...row, gender: gender ?? row.gender, organizationId: orgId, schoolId },
    };
  }

  validateTeacherRow(
    row: Record<string, unknown>,
    rowNumber: number,
    orgId: string,
    schoolId: string,
    existingDocumentIds: Set<string>,
  ): RowValidationResult {
    const errors: string[] = [];

    for (const col of TEACHER_REQUIRED_COLUMNS) {
      if (!row[col] || String(row[col]).trim() === '') {
        errors.push(`Columna requerida vacía: ${col}`);
      }
    }

    // Teachers are unique per organization, so the existence key is org-scoped.
    const documentId = String(row.documentId || '').trim();
    const alreadyExists = documentId ? existingDocumentIds.has(`${orgId}:${documentId}`) : false;

    const personalEmail = String(row.personalEmail || '').trim();
    if (personalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail)) {
      errors.push(`Email inválido: ${personalEmail}`);
    }

    const gender = normalizeGender(row.gender);
    if (!gender) {
      errors.push(`Género inválido: ${row.gender}. ${GENDER_INPUT_HINT}`);
    }

    const action = errors.length > 0 ? 'SKIP' : alreadyExists ? 'UPDATE' : 'CREATE';

    return {
      rowNumber,
      action,
      errors,
      data: { ...row, gender: gender ?? row.gender, organizationId: orgId, schoolId },
    };
  }

  async dryRun(
    organizationId: string,
    schoolId: string,
    entityType: ImportEntityType,
    csvText: string,
    userId: string,
  ): Promise<DryRunResult> {
    const rows = this.parseCsv(csvText);

    const existingStudents = await this.prisma.student.findMany({
      where: { schoolId },
      select: { documentId: true },
    });
    const existingTeachers = await this.prisma.teacher.findMany({
      where: { organizationId },
      select: { documentId: true },
    });

    const existingDocumentIds = new Set<string>();
    for (const s of existingStudents) {
      if (s.documentId) existingDocumentIds.add(`${schoolId}:${s.documentId}`);
    }
    for (const t of existingTeachers) {
      if (t.documentId) existingDocumentIds.add(`${organizationId}:${t.documentId}`);
    }

    const results: RowValidationResult[] = [];
    let validCount = 0;
    let createCount = 0;
    let updateCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      let result: RowValidationResult;
      if (entityType === 'STUDENT') {
        result = this.validateStudentRow(row, rowNumber, organizationId, schoolId, existingDocumentIds);
      } else {
        result = this.validateTeacherRow(row, rowNumber, organizationId, schoolId, existingDocumentIds);
      }

      if (result.errors.length === 0) {
        validCount++;
        if (result.action === 'UPDATE') updateCount++;
        else createCount++;
      } else {
        errorCount++;
      }

      results.push(result);
    }

    const job = await this.prisma.importJob.create({
      data: {
        organizationId,
        schoolId,
        entityType,
        status: 'DRY_RUN',
        createdById: userId,
        totalRows: rows.length,
        createdCount: createCount,
        updatedCount: updateCount,
        errorCount,
        errors: results as any,
      },
    });

    return {
      jobId: job.id,
      totalRows: rows.length,
      validRows: validCount,
      errorRows: errorCount,
      results,
    };
  }

  async commit(jobId: string, userId: string): Promise<DryRunResult> {
    const job = await this.prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('ImportJob no encontrado');
    }
    if (job.status === 'COMMITTED') {
      throw new ConflictException('Este archivo ya fue importado');
    }
    if (job.status === 'FAILED') {
      throw new ConflictException('Este archivo no se puede importar');
    }

    const rows = (job.errors as unknown as RowValidationResult[]) || [];
    const validRows = rows.filter((r) => r.errors.length === 0);

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const results: RowValidationResult[] = [];

    for (const rowResult of validRows) {
      try {
        const action =
          job.entityType === 'STUDENT'
            ? await this.commitStudentRow(rowResult, job, userId)
            : await this.commitTeacherRow(rowResult, job, userId);
        if (action === 'UPDATE') {
          updatedCount++;
        } else {
          createdCount++;
        }
        results.push({ ...rowResult, action });
      } catch (err) {
        errorCount++;
        results.push({
          ...rowResult,
          action: 'SKIP',
          errors: [...rowResult.errors, (err as Error).message],
        });
      }
    }

    for (const rowResult of rows) {
      if (rowResult.errors.length > 0) {
        results.push(rowResult);
      }
    }

    const updatedJob = await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'COMMITTED',
        createdCount,
        updatedCount,
        errorCount: job.errorCount + errorCount,
        errors: results as any,
        completedAt: new Date(),
      },
    });

    await this.prisma.onboardingAuditLog.create({
      data: {
        action: 'BULK_IMPORT_COMMITTED',
        userId,
        organizationId: job.organizationId,
        detail: `jobId=${jobId} entity=${job.entityType} created=${createdCount} updated=${updatedCount} errors=${errorCount}`,
      },
    });

    return {
      jobId: updatedJob.id,
      totalRows: job.totalRows,
      validRows: createdCount + updatedCount,
      errorRows: updatedJob.errorCount,
      results,
    };
  }

  private async commitStudentRow(
    row: RowValidationResult,
    job: { organizationId: string; schoolId: string },
    userId: string,
  ): Promise<'CREATE' | 'UPDATE'> {
    const data = row.data as Record<string, unknown>;
    const firstName = String(data.firstName || '').trim();
    const fatherName = String(data.fatherName || '').trim();
    const email = data.email ? String(data.email).trim() : undefined;
    const documentId = String(data.documentId || '').trim();

    // Resolve the existing student FIRST: an already-enrolled document ID is an
    // idempotent UPDATE and must never mint a second user/credential for the
    // same person.
    const existingStudent = await this.prisma.student.findFirst({
      where: { documentId, schoolId: job.schoolId },
    });

    if (existingStudent) {
      await this.prisma.student.update({
        where: { id: existingStudent.id },
        data: {
          firstName,
          middleName: String(data.middleName || ''),
          fatherName,
          motherName: String(data.motherName || ''),
          address: String(data.address || ''),
          phone: String(data.phone || ''),
        },
      });

      // Only attach a login when the row carries a real email and the student
      // has none yet. Class-group moves are intentionally not handled here so
      // the importer cannot bypass class-group history (see plan item B16).
      if (email && !existingStudent.userId) {
        const emailOwner = await this.prisma.user.findUnique({
          where: { email },
          include: { student: true },
        });
        if (emailOwner?.student && emailOwner.student.id !== existingStudent.id) {
          throw new Error('El usuario ya tiene un perfil de estudiante');
        }
        if (emailOwner && !emailOwner.student) {
          await this.prisma.student.update({
            where: { id: existingStudent.id },
            data: { userId: emailOwner.id },
          });
        }
      }

      return 'UPDATE';
    }

    const hashedPassword = this.newPlaceholderCredential();

    const existingUser = email
      ? await this.prisma.user.findUnique({
          where: { email },
          include: { student: true },
        })
      : null;

    let userId_ = existingUser?.id;
    if (existingUser?.student) {
      throw new Error('El usuario ya tiene un perfil de estudiante');
    }

    if (!userId_) {
      const user = await this.prisma.user.create({
        data: {
          firstName,
          lastName: fatherName,
          email: email || `imported-${documentId}@placeholder.local`,
          color: '#a1a1aa',
          password: hashedPassword,
          organizationId: job.organizationId,
          roleId: (await this.getStudentRoleId())!,
          emailVerified: false,
          onboardingStep: OnboardingStep.COMPLETED,
        },
      });
      userId_ = user.id;

      await this.prisma.account.create({
        data: {
          id: randomUUID(),
          accountId: user.id,
          providerId: 'credential',
          userId: user.id,
          password: hashedPassword,
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: userId_ },
        data: { firstName, lastName: fatherName },
      });
    }

    const classGroup = data.classGroupName
      ? await this.prisma.classGroup.findFirst({
          where: { name: String(data.classGroupName), schoolId: job.schoolId },
        })
      : null;

    const createdStudent = await this.prisma.student.create({
      data: {
        firstName,
        middleName: String(data.middleName || ''),
        fatherName,
        motherName: String(data.motherName || ''),
        documentId,
        birthDate: new Date(String(data.birthDate)),
        gender: this.requireGender(data.gender),
        address: String(data.address || ''),
        phone: String(data.phone || ''),
        enrollmentStatus: 'ACTIVE',
        bloodType: String(data.bloodType || ''),
        allergies: String(data.allergies || ''),
        medicalNotes: String(data.medicalNotes || ''),
        emergencyContactName: String(data.emergencyContactName || ''),
        emergencyContactPhone: String(data.emergencyContactPhone || ''),
        userId: userId_,
        organizationId: job.organizationId,
        schoolId: job.schoolId,
        classGroupId: classGroup?.id || null,
        enrollmentCode: await this.generateEnrollmentCode(),
      },
    });

    // Keep class-group progression history in sync (Phase 2.5) instead of
    // writing `classGroupId` without a history row.
    if (classGroup?.id) {
      await this.recordImportedClassGroup(
        createdStudent.id,
        classGroup.id,
        job.schoolId,
        job.organizationId,
        userId,
      );
    }

    if (email && userId_) {
      await this.setInvitationStatus(userId_, 'PENDING');
      try {
        await sendUserInvitation({
          prisma: this.prisma,
          email,
          name: `${firstName} ${fatherName}`,
          role: 'student',
          organizationName: '',
        });
        await this.setInvitationStatus(userId_, 'SENT');
      } catch (err) {
        await this.setInvitationStatus(userId_, 'FAILED', (err as Error).message);
        this.logger.warn(`Failed to send invitation for imported student ${email}:`, err);
      }
    }

    return 'CREATE';
  }

  private async commitTeacherRow(
    row: RowValidationResult,
    job: { organizationId: string; schoolId: string },
    userId: string,
  ): Promise<'CREATE' | 'UPDATE'> {
    const data = row.data as Record<string, unknown>;
    const firstName = String(data.firstName || '').trim();
    const fatherName = String(data.fatherName || '').trim();
    const middleName = String(data.middleName || '').trim();
    const motherName = String(data.motherName || '').trim();
    const documentId = String(data.documentId || '').trim();
    const birthDate = String(data.birthDate || '');
    const gender = this.requireGender(data.gender);
    const phoneNumber = String(data.phoneNumber || '').trim();
    const personalEmail = String(data.personalEmail || '').trim();

    // Resolve the existing teacher FIRST so a repeat import updates the record
    // instead of minting a second user/credential for the same document ID.
    const existingTeacher = await this.prisma.teacher.findFirst({
      where: { documentId, organizationId: job.organizationId },
    });

    if (existingTeacher) {
      await this.prisma.teacher.update({
        where: { id: existingTeacher.id },
        data: { firstName, middleName, fatherName, motherName, phoneNumber, personalEmail },
      });

      if (personalEmail && !existingTeacher.userId) {
        const emailOwner = await this.prisma.user.findUnique({
          where: { email: personalEmail },
          include: { teacher: true },
        });
        if (emailOwner?.teacher && emailOwner.teacher.id !== existingTeacher.id) {
          throw new Error('El usuario ya tiene un perfil de profesor');
        }
        if (emailOwner && !emailOwner.teacher) {
          await this.prisma.teacher.update({
            where: { id: existingTeacher.id },
            data: { userId: emailOwner.id },
          });
        }
      }

      return 'UPDATE';
    }

    const hashedPassword = this.newPlaceholderCredential();

    const existingUser = personalEmail
      ? await this.prisma.user.findUnique({
          where: { email: personalEmail },
          include: { teacher: true },
        })
      : null;

    let userId_ = existingUser?.id;
    if (existingUser?.teacher) {
      throw new Error('El usuario ya tiene un perfil de profesor');
    }

    if (!userId_) {
      const user = await this.prisma.user.create({
        data: {
          firstName,
          lastName: fatherName,
          email: personalEmail || `imported-${documentId}@placeholder.local`,
          color: '#a1a1aa',
          password: hashedPassword,
          organizationId: job.organizationId,
          roleId: (await this.getTeacherRoleId())!,
          emailVerified: false,
          onboardingStep: OnboardingStep.COMPLETED,
        },
      });
      userId_ = user.id;

      await this.prisma.account.create({
        data: {
          id: randomUUID(),
          accountId: user.id,
          providerId: 'credential',
          userId: user.id,
          password: hashedPassword,
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: userId_ },
        data: { firstName, lastName: fatherName },
      });
    }

    await this.prisma.teacher.create({
      data: {
        firstName,
        middleName: middleName,
        fatherName,
        motherName: motherName,
        documentId,
        birthDate: new Date(birthDate),
        gender,
        phoneNumber,
        personalEmail,
        address: '',
        userId: userId_,
        organizationId: job.organizationId,
      },
    });

    if (personalEmail && userId_) {
      await this.setInvitationStatus(userId_, 'PENDING');
      try {
        await sendUserInvitation({
          prisma: this.prisma,
          email: personalEmail,
          name: `${firstName} ${fatherName}`,
          role: 'teacher',
          organizationName: '',
        });
        await this.setInvitationStatus(userId_, 'SENT');
      } catch (err) {
        await this.setInvitationStatus(userId_, 'FAILED', (err as Error).message);
        this.logger.warn(`Failed to send invitation for imported teacher ${personalEmail}:`, err);
      }
    }

    return 'CREATE';
  }

  /**
   * Re-normalize the gender cell at commit time so a stale or hand-edited
   * dry-run payload can never reach Prisma with a value outside the enum.
   */
  private requireGender(value: unknown): 'MALE' | 'FEMALE' {
    const gender = normalizeGender(value);
    if (!gender) {
      throw new Error(`Género inválido: ${String(value ?? '')}. ${GENDER_INPUT_HINT}`);
    }
    return gender;
  }

  private async getStudentRoleId(): Promise<string | null> {
    const role = await this.prisma.role.findFirst({
      where: { organizationId: null, name: 'STUDENT' },
    });
    return role?.id || null;
  }

  private async getTeacherRoleId(): Promise<string | null> {
    const role = await this.prisma.role.findFirst({
      where: { organizationId: null, name: 'TEACHER' },
    });
    return role?.id || null;
  }

  /**
   * Random, high-entropy placeholder secret — never derived from the document ID
   * or any other guessable value. Imported accounts are only usable once the
   * user sets their own password via the invitation/magic link (mirrors the
   * Phase 1 hardening in StudentsService/TeachersService).
   */
  private newPlaceholderCredential(): string {
    return bcrypt.hashSync(randomBytes(32).toString('hex'), 10);
  }

  /**
   * Crypto-random, collision-checked enrollment code. Mirrors
   * StudentsService.generateEnrollmentCode — `Student.enrollmentCode` is
   * `@unique`, so a weak `Math.random` code risks throwing mid-import.
   */
  private async generateEnrollmentCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomBytes(5)
        .toString('base64')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 8);
      const existing = await this.prisma.student.findUnique({ where: { enrollmentCode: code } });
      if (!existing) return code;
    }
    throw new Error('No se pudo generar un código de matrícula único');
  }

  /** Record the invitation email outcome so the admin UI badge is accurate. */
  private async setInvitationStatus(
    userId: string,
    status: 'PENDING' | 'SENT' | 'FAILED',
    detail?: string,
  ) {
    await this.prisma.invitationStatus.upsert({
      where: { userId },
      create: { userId, status, detail: detail ?? null },
      update: { status, detail: detail ?? null },
    });
  }

  /**
   * Open a class-group history row for an imported student so progression
   * tracking (Phase 2.5) is not bypassed by the importer.
   */
  private async recordImportedClassGroup(
    studentId: string,
    classGroupId: string,
    schoolId: string,
    organizationId: string,
    createdById: string,
  ) {
    await this.prisma.studentClassGroupHistory.updateMany({
      where: { studentId, endedAt: null },
      data: { endedAt: new Date() },
    });
    await this.prisma.studentClassGroupHistory.create({
      data: {
        studentId,
        classGroupId,
        schoolId,
        organizationId,
        reason: 'import',
        createdById,
      },
    });
  }

  async getJob(jobId: string) {
    return this.prisma.importJob.findUnique({
      where: { id: jobId },
    });
  }

}