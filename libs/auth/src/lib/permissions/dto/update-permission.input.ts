import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreatePermissionInput } from './create-permission.input';

@InputType()
export class UpdatePermissionInput extends PartialType(CreatePermissionInput) {
  @Field(() => String)
  id: string;
}
