import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateStudyPlanInput } from './dto/create-study-plan.input';
import { UpdateStudyPlanInput } from './dto/update-study-plan.input';

@Injectable()
export class StudyPlansService {
  constructor(private readonly prisma: PrismaService) {}

  create(createStudyPlanInput: CreateStudyPlanInput) {
    return this.prisma.studyPlan.create({
      data: createStudyPlanInput,
      include: { degree: true, school: true },
    });
  }

  findAll() {
    return this.prisma.studyPlan.findMany({
      include: { degree: true, school: true },
    });
  }

  findAllBySchoolId(schoolId: string, degreeId?: string) {
    if (degreeId) {
      return this.prisma.studyPlan.findMany({
        where: { schoolId, degreeId },
        include: { degree: true, school: true },
      });
    }
    return this.prisma.studyPlan.findMany({
      where: { schoolId },
      include: { degree: true, school: true },
    });
  }

  findOne(id: string) {
    return this.prisma.studyPlan.findUnique({
      where: { id },
      include: { degree: true, school: true },
    });
  }

  update(id: string, updateStudyPlanInput: UpdateStudyPlanInput) {
    return this.prisma.studyPlan.update({
      where: { id },
      data: updateStudyPlanInput,
      include: { degree: true, school: true },
    });
  }

  remove(id: string) {
    return this.prisma.studyPlan.delete({ where: { id } });
  }
}
