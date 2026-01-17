import {
  Args,
  Float,
  Mutation,
  Query,
  Resolver
} from '@nestjs/graphql';
import { CreateStudentGradeInput } from './dto/create-student-grade.input';
import { UpdateStudentGradeInput } from './dto/update-student-grade.input';
import { StudentGrade } from './entities/student-grade.entity';
import { StudentGradesService } from './student-grades.service';

@Resolver(() => StudentGrade)
export class StudentGradesResolver {
  constructor(
    private readonly studentGradesService: StudentGradesService,
  ) {}

  @Mutation(() => StudentGrade)
  createStudentGrade(
    @Args('createStudentGradeInput')
    createStudentGradeInput: CreateStudentGradeInput
  ) {
    return this.studentGradesService.create(createStudentGradeInput);
  }

  @Query(() => [StudentGrade], { name: 'studentGrades' })
  findAll() {
    return this.studentGradesService.findAll();
  }

  @Query(() => StudentGrade, { name: 'studentGrade' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.studentGradesService.findOne(id);
  }

  @Query(() => [StudentGrade], { name: 'studentGradesByCourseId' })
  findByCourseId(
    @Args('courseId', { type: () => String }) courseId: string,
    @Args('periodId', { type: () => String }) periodId?: string,
    @Args('studentId', { type: () => String }) studentId?: string
  ) {
    return this.studentGradesService.findByCourseId(
      courseId,
      periodId,
      studentId
    );
  }

  @Query(() => Float, { name: 'averageCourseScoreForStudent' })
  averageCourseScoreForStudent(
    @Args('studentId', { type: () => String }) studentId: string,
    @Args('courseId', { type: () => String }) courseId: string,
    @Args('periodId', { type: () => String }) periodId: string
  ) {
    return this.studentGradesService.getAverageScoreForStudent(
      courseId,
      periodId,
      studentId
    );
  }

  @Mutation(() => StudentGrade)
  updateStudentGrade(
    @Args('updateStudentGradeInput')
    updateStudentGradeInput: UpdateStudentGradeInput
  ) {
    return this.studentGradesService.update(
      updateStudentGradeInput.id,
      updateStudentGradeInput
    );
  }

  @Mutation(() => StudentGrade)
  removeStudentGrade(@Args('id', { type: () => String }) id: string) {
    return this.studentGradesService.remove(id);
  }
}
