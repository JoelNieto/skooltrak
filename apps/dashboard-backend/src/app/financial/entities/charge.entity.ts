import { $Enums, Prisma } from '@generated/prisma';
import { Field, Float, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ClassGroup } from '../../class-groups/entities/class-group.entity';
import { School } from '../../schools/entities/school.entity';
import { Student } from '../../students/entities/student.entity';

registerEnumType($Enums.ChargeStatus, { name: 'ChargeStatus' });
registerEnumType($Enums.ChargeType, { name: 'ChargeType' });

@ObjectType()
export class Charge
  implements
    Prisma.ChargeGetPayload<{
      include: { school: true; student: true; classGroup: true };
    }>
{
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
  classGroupId: string | null;

  @Field(() => ClassGroup, { nullable: true })
  classGroup: ClassGroup | null;

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
