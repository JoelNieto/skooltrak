import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class ProcessStorePaymentInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  orderId: string;

  /** Simulate failed payment when false (default: success). */
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  simulateSuccess?: boolean;
}
