import { AuthenticatedRequest, BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { assertCourseStaff, requireOrganization } from '../org-scope';
import { PrismaService } from '../prisma.service';
import { CreateQuizInput } from './dto/create-quiz.input';
import { UpdateQuizInput } from './dto/update-quiz.input';
import { QuizzesService } from './quizzes.service';

export const QUIZ_DENIED = 'El cuestionario no pertenece a tu organización';
export const WRITE_DENIED = 'Solo puedes gestionar los cuestionarios de tus propios cursos';
export const TEACHER_MISMATCH = 'El docente no pertenece a la organización del curso';

/**
 * Quizzes. Reads need VIEW_QUIZZES and stay in the caller's organization. Writes need
 * MANAGE_QUIZZES and the course's teacher or an admin of its organization.
 */
@ApiTags('quizzes')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@RequirePermissions(Perm.VIEW_QUIZZES)
@Controller('v1/quizzes')
export class QuizzesController {
  constructor(
    private readonly quizzesService: QuizzesService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @RequirePermissions(Perm.MANAGE_QUIZZES)
  @ApiOperation({ summary: 'Create quiz' })
  async create(@Req() req: AuthenticatedRequest, @Body() createQuizInput: CreateQuizInput) {
    const course = await assertCourseStaff(this.prisma, req.user, createQuizInput.courseId, WRITE_DENIED);
    await this.assertTeacherInOrganization(createQuizInput.teacherId, course.organizationId);
    return this.quizzesService.create({ ...createQuizInput, organizationId: course.organizationId });
  }

  @Get()
  @ApiOperation({ summary: 'List quizzes for organization' })
  findAll(@Req() req: AuthenticatedRequest, @Query('organizationId') organizationId?: string) {
    const own = requireOrganization(req.user);
    if (organizationId && organizationId !== own) throw new ForbiddenException(QUIZ_DENIED);
    return this.quizzesService.findAll(own);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by id' })
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const quiz = await this.ref(id);
    if (quiz.organizationId !== requireOrganization(req.user)) throw new ForbiddenException(QUIZ_DENIED);
    const full = await this.quizzesService.findOne(quiz.id);
    // Only the course's teacher and admins see which options are correct.
    const canManage = await assertCourseStaff(this.prisma, req.user, quiz.courseId, WRITE_DENIED).then(
      () => true,
      () => false,
    );
    return canManage || !full ? full : withoutAnswers(full);
  }

  @Patch()
  @RequirePermissions(Perm.MANAGE_QUIZZES)
  @ApiOperation({ summary: 'Update quiz' })
  async update(@Req() req: AuthenticatedRequest, @Body() updateQuizInput: UpdateQuizInput) {
    const quiz = await this.ref(updateQuizInput.id);
    const course = await assertCourseStaff(this.prisma, req.user, quiz.courseId, WRITE_DENIED);
    if (updateQuizInput.organizationId && updateQuizInput.organizationId !== quiz.organizationId) {
      throw new ForbiddenException(QUIZ_DENIED);
    }
    if (updateQuizInput.courseId && updateQuizInput.courseId !== quiz.courseId) {
      // Moving it needs the same rights on the new course.
      await assertCourseStaff(this.prisma, req.user, updateQuizInput.courseId, WRITE_DENIED);
    }
    await this.assertTeacherInOrganization(updateQuizInput.teacherId, course.organizationId);
    return this.quizzesService.update(quiz.id, updateQuizInput);
  }

  @Delete(':id')
  @RequirePermissions(Perm.MANAGE_QUIZZES)
  @ApiOperation({ summary: 'Delete quiz' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const quiz = await this.ref(id);
    await assertCourseStaff(this.prisma, req.user, quiz.courseId, WRITE_DENIED);
    return this.quizzesService.remove(quiz.id);
  }

  private async ref(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      select: { id: true, organizationId: true, courseId: true },
    });
    if (!quiz) throw new NotFoundException('Cuestionario no encontrado');
    return quiz;
  }

  private async assertTeacherInOrganization(teacherId: string | undefined, organizationId: string): Promise<void> {
    if (!teacherId) return;
    const found = await this.prisma.teacher.count({ where: { id: teacherId, organizationId } });
    if (!found) throw new BadRequestException(TEACHER_MISMATCH);
  }
}

/** A quiz with each option's `isCorrect` removed. */
export function withoutAnswers<Q extends { questions: { options: { isCorrect: boolean }[] }[] }>(quiz: Q) {
  return {
    ...quiz,
    questions: quiz.questions.map((q) => ({
      ...q,
      options: q.options.map((option) => {
        const visible: Partial<typeof option> = { ...option };
        delete visible.isCorrect;
        return visible;
      }),
    })),
  };
}
