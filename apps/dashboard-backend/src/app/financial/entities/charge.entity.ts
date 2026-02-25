import { $Enums, Prisma } from '@generated/prisma';
import { Field, Float, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { School } from '../../schools/entities/school.entity';
import { Student } from '../../students/entities/student.entity';
import { StudyPlan } from '../../study-plans/entities/study-plan.entity';

registerEnumType($Enums.ChargeStatus, { name: 'ChargeStatus' });
registerEnumType($Enums.ChargeType, { name: 'ChargeType' });

@ObjectType()
export class Charge {
  @Field(() => String)
  id: string;

  @Field(() => String)
  schoolId: string;

  @Field(() => School)
  school: School;

  @Field(() => Int)
  year: number;

  @Field(() => String)
  studentId: string;

  @Field(() => Student)
  student: Student;

  @Field(() => String, { nullable: true })
  studyPlanId: string | null;

  @Field(() => StudyPlan, { nullable: true })
  studyPlan: StudyPlan | null;

  @Field(() => Float)
  amount: Prisma.Decimal;

  @Field(() => Date)
  dueDate: Date;

  @Field(() => String)
  description: string;

  @Field(() => $Enums.ChargeType)
  chargeType: $Enums.ChargeType;

  @Field(() => $Enums.ChargeStatus)
  status: $Enums.ChargeStatus;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
