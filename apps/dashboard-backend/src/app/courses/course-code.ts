import { Prisma } from '@generated/prisma';

type CourseReader = { course: Pick<Prisma.TransactionClient['course'], 'findUnique'> };

/**
 * A course code unique in the school, from the letters of `baseName`: its first 3 letters, then
 * 4, 5... and, when every prefix is taken, the first 3 letters plus a counter (MAT1, MAT2...).
 * Pass a transaction client to see the codes the transaction already created.
 */
export async function uniqueCourseCode(db: CourseReader, schoolId: string, baseName: string): Promise<string> {
  const cleanName = baseName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const taken = async (code: string) =>
    !!(await db.course.findUnique({ where: { schoolId_code: { schoolId, code } }, select: { id: true } }));

  for (let length = 3; length <= cleanName.length; length++) {
    const code = cleanName.substring(0, length);
    if (!(await taken(code))) return code;
  }
  for (let counter = 1; ; counter++) {
    const code = `${cleanName.substring(0, 3)}${counter}`;
    if (!(await taken(code))) return code;
  }
}
