import { JwtAuthGuard } from '@/auth';
import { UseGuards } from '@nestjs/common';
import {
  Args,
  Float,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { FetchDataInput } from '../fetch-data.input';
import { GradesService } from '../grades/grades.service';
import { CreateStudentInput } from './dto/create-student.input';
import { UpdateStudentInput } from './dto/update-student.input';
import { Student } from './entities/student.entity';
import { StudentsService } from './students.service';

@Resolver(() => Student)
export class StudentsResolver {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly gradesService: GradesService
  ) {}

  @Mutation(() => Student)
  createStudent(
    @Args('createStudentInput') createStudentInput: CreateStudentInput
  ) {
    return this.studentsService.create(createStudentInput);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Student], { name: 'students' })
  findAll(@Args() fetchDataInput: FetchDataInput) {
    return this.studentsService.findAll(fetchDataInput);
  }

  @Query(() => [Student], { name: 'studentsBySchoolId' })
  findManyBySchoolId(
    @Args('schoolId', { type: () => String }) schoolId: string
  ) {
    return this.studentsService.findManyBySchoolId(schoolId);
  }

  @Query(() => Student, { name: 'student' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.studentsService.findOne(id);
  }

  @Query(() => [Student], { name: 'studentsByCourseId' })
  findManyByCourseId(
    @Args('courseId', { type: () => String }) courseId: string
  ) {
    return this.studentsService.findManyByCourseId(courseId);
  }

  @ResolveField(() => String)
  initials(@Parent() student: Student) {
    return `${student.firstName.charAt(0)}${student.fatherName.charAt(0)}`;
  }

  @ResolveField(() => String)
  name(@Parent() student: Student) {
    return `${student.firstName} ${student.fatherName}`;
  }

  @ResolveField(() => String)
  fullName(@Parent() student: Student) {
    return `${student.firstName} ${student.middleName} ${student.fatherName} ${student.motherName}`;
  }

  @Query(() => Int, { name: 'findManyStudentsCount' })
  findManyStudentsCount(@Args() fetchDataInput: FetchDataInput) {
    return this.studentsService.getCount(fetchDataInput);
  }

  @ResolveField(() => String)
  email(@Parent() student: Student) {
    return student.user.email;
  }

  @ResolveField(() => String)
  color(@Parent() student: Student) {
    return student.user.color;
  }

  @ResolveField(() => Float, { name: 'averageScoreForStudent' })
  getAverageScoreForStudent(
    @Parent() student: Student,
    @Args('courseId', { type: () => String }) courseId: string,
    @Args('periodId', { type: () => String }) periodId: string
  ) {
    return this.gradesService.getAverageScoreForStudent(
      courseId,
      periodId,
      student.id
    );
  }

  @Mutation(() => Student)
  updateStudent(
    @Args('updateStudentInput') updateStudentInput: UpdateStudentInput
  ) {
    return this.studentsService.update(
      updateStudentInput.id,
      updateStudentInput
    );
  }

  @Mutation(() => Student)
  removeStudent(@Args('id', { type: () => String }) id: string) {
    return this.studentsService.remove(id);
  }
}
