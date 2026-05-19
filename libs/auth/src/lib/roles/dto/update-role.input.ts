import { PartialType } from '@nestjs/swagger';
import { CreateRoleInput } from './create-role.input';

export class UpdateRoleInput extends PartialType(CreateRoleInput) {
    id: string;
}
