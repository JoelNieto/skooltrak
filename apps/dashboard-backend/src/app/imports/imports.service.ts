import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { sendUserInvitation } from '@/auth';
import type { ImportEntityType, Prisma } from '@generated/prisma';
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
      throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
    }

    const rows = parsed.data as Record<string, unknown>[];
    if (rows.length > MAX_ROWS) {
      throw new Error(`El archivo supera el límite de ${MAX_ROWS} filas (${rows.length} detectadas).`);
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

    const documentId = String(row.documentId || '').trim();
    if (documentId && existingDocumentIds.has(`${orgId}:${documentId}`)) {
      errors.push(`documentId ${documentId} ya existe en esta organización`);
    }

    const gender = String(row.gender || '').toUpperCase();
    if (!['MASCULINO', 'FEMENINO', 'OTRO'].includes(gender)) {
      errors.push(`Género inválido: ${row.gender}. Use MASCULINO, FEMENINO u OTRO.`);
    }

    const action = errors.length === 0 ? 'CREATE' : 'SKIP';

    return { rowNumber, action, errors, data: { ...row, organizationId: orgId, schoolId } };
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

    const documentId = String(row.documentId || '').trim();
    if (documentId && existingDocumentIds.has(`${orgId}:${documentId}`)) {
      errors.push(`documentId ${documentId} ya existe en esta organización`);
    }

    const personalEmail = String(row.personalEmail || '').trim();
    if (personalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail)) {
      errors.push(`Email inválido: ${personalEmail}`);
    }

    const action = errors.length === 0 ? 'CREATE' : 'SKIP';

    return { rowNumber, action, errors, data: { ...row, organizationId: orgId, schoolId } };
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

      if (result.errors.length === 0) validCount++;
      else errorCount++;

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
        createdCount: validCount,
        updatedCount: 0,
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
      throw new Error('ImportJob no encontrado');
    }
    if (job.status === 'COMMITTED') {
      throw new Error('Este archivo ya fue importado');
    }
    if (job.status === 'FAILED') {
      throw new Error('Este archivo no se puede importar');
    }

    const rows = (job.errors as unknown as RowValidationResult[]) || [];
    const validRows = rows.filter((r) => r.errors.length === 0);

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const results: RowValidationResult[] = [];

    for (const rowResult of validRows) {
      try {
        if (job.entityType === 'STUDENT') {
          await this.commitStudentRow(rowResult, job, userId);
        } else {
          await this.commitTeacherRow(rowResult, job, userId);
        }
        createdCount++;
        results.push({ ...rowResult, action: 'CREATE' });
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
        detail: `jobId=${jobId} entity=${job.entityType} created=${createdCount} errors=${errorCount}`,
      },
    });

    return {
      jobId: updatedJob.id,
      totalRows: job.totalRows,
      validRows: createdCount,
      errorRows: updatedJob.errorCount,
      results,
    };
  }

  private async commitStudentRow(row: RowValidationResult, job: { organizationId: string; schoolId: string }, userId: string) {
    const data = row.data as Record<string, unknown>;
    const firstName = String(data.firstName || '').trim();
    const fatherName = String(data.fatherName || '').trim();
    const email = data.email ? String(data.email).trim() : undefined;
    const documentId = String(data.documentId || '').trim();

    const hashedPassword = 'imported';

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
          onboardingStep: 'completed',
        },
      });
      userId_ = user.id;

      await this.prisma.account.create({
        data: {
          id: `${user.id}-cred`,
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

    const existingStudent = await this.prisma.student.findFirst({
      where: { documentId, schoolId: job.schoolId },
    });

    if (existingStudent) {
      await this.prisma.student.update({
        where: { id: existingStudent.id },
        data: { userId: userId_ },
      });
      return;
    }

    const classGroup = data.classGroupName
      ? await this.prisma.classGroup.findFirst({
          where: { name: String(data.classGroupName), schoolId: job.schoolId },
        })
      : null;

    await this.prisma.student.create({
      data: {
        firstName,
        middleName: String(data.middleName || ''),
        fatherName,
        motherName: String(data.motherName || ''),
        documentId,
        birthDate: new Date(String(data.birthDate)),
        gender: String(data.gender || 'OTRO') as Prisma.StudentCreateInput['gender'],
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
        enrollmentCode: `${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      },
    });

    if (email && userId_) {
      try {
        await sendUserInvitation({
          prisma: this.prisma,
          email,
          name: `${firstName} ${fatherName}`,
          role: 'student',
          organizationName: '',
        });
      } catch (err) {
        this.logger.warn(`Failed to send invitation for imported student ${email}:`, err);
      }
    }
  }

  private async commitTeacherRow(row: RowValidationResult, job: { organizationId: string; schoolId: string }, userId: string) {
    const data = row.data as Record<string, unknown>;
    const firstName = String(data.firstName || '').trim();
    const fatherName = String(data.fatherName || '').trim();
    const middleName = String(data.middleName || '').trim();
    const motherName = String(data.motherName || '').trim();
    const documentId = String(data.documentId || '').trim();
    const birthDate = String(data.birthDate || '');
    const gender = String(data.gender || '').toUpperCase();
    const phoneNumber = String(data.phoneNumber || '').trim();
    const personalEmail = String(data.personalEmail || '').trim();

    const hashedPassword = 'imported';

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
          onboardingStep: 'completed',
        },
      });
      userId_ = user.id;

      await this.prisma.account.create({
        data: {
          id: `${user.id}-cred`,
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

    const existingTeacher = await this.prisma.teacher.findFirst({
      where: { documentId, organizationId: job.organizationId },
    });

    if (existingTeacher) {
      await this.prisma.teacher.update({
        where: { id: existingTeacher.id },
        data: { userId: userId_ },
      });
      return;
    }

    await this.prisma.teacher.create({
      data: {
        firstName,
        middleName: middleName,
        fatherName,
        motherName: motherName,
        documentId,
        birthDate: new Date(birthDate),
        gender: gender as Prisma.TeacherCreateInput['gender'],
        phoneNumber,
        personalEmail,
        address: '',
        userId: userId_,
        organizationId: job.organizationId,
      },
    });

    if (personalEmail && userId_) {
      try {
        await sendUserInvitation({
          prisma: this.prisma,
          email: personalEmail,
          name: `${firstName} ${fatherName}`,
          role: 'teacher',
          organizationName: '',
        });
      } catch (err) {
        this.logger.warn(`Failed to send invitation for imported teacher ${personalEmail}:`, err);
      }
    }
  }

  private async getStudentRoleId(): Promise<string | null> {
    const role = await this.prisma.role.findFirst({ where: { name: 'STUDENT' } });
    return role?.id || null;
  }

  private async getTeacherRoleId(): Promise<string | null> {
    const role = await this.prisma.role.findFirst({ where: { name: 'TEACHER' } });
    return role?.id || null;
  }

  async getJob(jobId: string) {
    return this.prisma.importJob.findUnique({
      where: { id: jobId },
    });
  }

}