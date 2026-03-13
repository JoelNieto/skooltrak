import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { subDays } from 'date-fns';
import { PrismaService } from '../prisma.service';

const UNPUBLISHED_GRADES_DAYS_THRESHOLD = 2;

/**
 * Sends reminder notifications to teachers who have unpublished grades
 * older than the threshold (default 2 days).
 */
@Injectable()
export class UnpublishedGradesReminderService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 8 * * *') // Every day at 8:00 AM
  async runReminderJob() {
    const threshold = subDays(new Date(), UNPUBLISHED_GRADES_DAYS_THRESHOLD);

    const unpublishedGrades = await this.prisma.grade.findMany({
      where: {
        published: false,
        updatedAt: { lt: threshold },
      },
      include: {
        course: {
          include: {
            teacher: { include: { user: true } },
          },
        },
      },
    });

    if (unpublishedGrades.length === 0) return;

    const byTeacher = new Map<
      string,
      { teacherUserId: string; courses: Map<string, number> }
    >();

    for (const grade of unpublishedGrades) {
      const teacher = grade.course.teacher;
      if (!teacher?.userId) continue;

      const entry = byTeacher.get(teacher.id);
      if (!entry) {
        byTeacher.set(teacher.id, {
          teacherUserId: teacher.userId,
          courses: new Map([[grade.course.name, 1]]),
        });
      } else {
        const count = entry.courses.get(grade.course.name) ?? 0;
        entry.courses.set(grade.course.name, count + 1);
      }
    }

    for (const { teacherUserId, courses } of byTeacher.values()) {
      const totalCount = [...courses.values()].reduce((a, b) => a + b, 0);
      const courseList = [...courses.entries()]
        .map(([name, count]) => `${name} (${count})`)
        .join(', ');

      await this.prisma.notification.create({
        data: {
          recipientId: teacherUserId,
          type: 'UNPUBLISHED_GRADES_REMINDER',
          title: 'Calificaciones sin publicar',
          message: `Tienes ${totalCount} calificación(es) sin publicar: ${courseList}. Publica para que los estudiantes las vean.`,
        },
      });
    }

    console.log(
      `[UnpublishedGradesReminder] Sent ${byTeacher.size} reminder(s) for ${unpublishedGrades.length} unpublished grade(s)`,
    );
  }
}
