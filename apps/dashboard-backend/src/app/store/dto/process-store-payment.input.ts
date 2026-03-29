import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class ProcessStorePaymentInput {
  @Field(() => String)
  @IsUUID()
  orderId: string;

  /** Simulate failed payment when false (default: success). */
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  simulateSuccess?: boolean;
}
