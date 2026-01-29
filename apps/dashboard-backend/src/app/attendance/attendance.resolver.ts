import { BetterAuthGuard } from '@/auth';
import { UseGuards } from '@nestjs/common';
import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { ClassGroup } from '../class-groups/entities/class-group.entity';
import { Course } from '../courses/entities/course.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceFilterInput } from './dto/attendance-filter.input';
import { CreateAttendanceSessionInput } from './dto/create-attendance-session.input';
import { UpdateAttendanceRecordInput } from './dto/update-attendance-record.input';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { AttendanceSession } from './entities/attendance-session.entity';
import { AttendanceStats } from './entities/attendance-stats.entity';

@Resolver(() => AttendanceSession)
@UseGuards(BetterAuthGuard)
export class AttendanceResolver {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Mutation(() => AttendanceSession, { name: 'createAttendanceSession' })
  create(
    @Args('input') input: CreateAttendanceSessionInput,
  ) {
    return this.attendanceService.create(input);
  }

  @Query(() => [AttendanceSession], { name: 'attendanceSessions' })
  findAll(@Args() filter: AttendanceFilterInput) {
    return this.attendanceService.findAll(filter);
  }

  @Query(() => Int, { name: 'attendanceSessionsCount' })
  count(@Args() filter: AttendanceFilterInput) {
    return this.attendanceService.count(filter);
  }

  @Query(() => AttendanceSession, { name: 'attendanceSession', nullable: true })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.attendanceService.findOne(id);
  }

  @Mutation(() => AttendanceRecord, { name: 'updateAttendanceRecord' })
  updateRecord(@Args('input') input: UpdateAttendanceRecordInput) {
    return this.attendanceService.updateRecord(input);
  }

  @Mutation(() => [AttendanceRecord], { name: 'updateAttendanceRecords' })
  updateManyRecords(
    @Args('inputs', { type: () => [UpdateAttendanceRecordInput] })
    inputs: UpdateAttendanceRecordInput[],
  ) {
    return this.attendanceService.updateManyRecords(inputs);
  }

  @Mutation(() => AttendanceSession, { name: 'deleteAttendanceSession' })
  remove(@Args('id', { type: () => String }) id: string) {
    return this.attendanceService.remove(id);
  }

  @Query(() => [Student], { name: 'studentsForAttendance' })
  getStudentsForAttendance(
    @Args('courseId', { type: () => String }) courseId: string,
    @Args('classGroupId', { type: () => String }) classGroupId: string,
  ) {
    return this.attendanceService.getStudentsForAttendance(
      courseId,
      classGroupId,
    );
  }

  @Query(() => [AttendanceRecord], { name: 'attendanceRecordsByStudentId' })
  getAttendanceByStudentId(
    @Args('studentId', { type: () => String }) studentId: string,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.attendanceService.getAttendanceByStudentId(studentId, take);
  }

  @Query(() => AttendanceStats, { name: 'studentAttendanceStats' })
  getStudentAttendanceStats(
    @Args('studentId', { type: () => String }) studentId: string,
  ) {
    return this.attendanceService.getStudentAttendanceStats(studentId);
  }

  @ResolveField(() => Course)
  async course(@Parent() session: AttendanceSession) {
    if (
      session.course &&
      typeof session.course === 'object' &&
      'id' in session.course
    ) {
      return session.course;
    }
    return null;
  }

  @ResolveField(() => ClassGroup)
  async classGroup(@Parent() session: AttendanceSession) {
    if (
      session.classGroup &&
      typeof session.classGroup === 'object' &&
      'id' in session.classGroup
    ) {
      return session.classGroup;
    }
    return null;
  }

  @ResolveField(() => Teacher)
  async teacher(@Parent() session: AttendanceSession) {
    if (
      session.teacher &&
      typeof session.teacher === 'object' &&
      'id' in session.teacher
    ) {
      return session.teacher;
    }
    return null;
  }

  @ResolveField(() => [AttendanceRecord])
  async records(@Parent() session: AttendanceSession) {
    if (session.records && Array.isArray(session.records)) {
      return session.records;
    }
    return [];
  }
}
