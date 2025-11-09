import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAssignmentInput } from './dto/create-assignment.input';
import { UpdateAssignmentInput } from './dto/update-assignment.input';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createAssignmentInput: CreateAssignmentInput) {
    return this.prisma.assignment.create({
      data: {
        ...createAssignmentInput,
        dates: {
          create: createAssignmentInput.groupDates,
        },
      },
    });
  }

  findAll() {
    return this.prisma.assignment.findMany({
      include: { course: true, teacher: true },
    });
  }

  findAssignmentBySchoolId(schoolId: string, startDate: Date, endDate: Date) {
    return this.prisma.assignment.findMany({
      where: { schoolId, date: { gte: startDate, lte: endDate } },
      include: {
        course: { include: { subject: true, studyPlan: true } },
        teacher: true,
      },
      orderBy: { date: 'asc' },
    });
  }

  findAssignmentByCourseId(courseId: string, startDate: Date, endDate: Date) {
    return this.prisma.assignment.findMany({
      where: { courseId, date: { gte: startDate, lte: endDate } },
      include: { course: true, teacher: true },
      orderBy: { date: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.assignment.findUnique({
      where: { id },
      include: { course: true, teacher: true },
    });
  }

  update(id: string, updateAssignmentInput: UpdateAssignmentInput) {
    return this.prisma.assignment.update({
      where: { id },
      data: updateAssignmentInput,
    });
  }

  remove(id: string) {
    return this.prisma.assignment.delete({ where: { id } });
  }
}
