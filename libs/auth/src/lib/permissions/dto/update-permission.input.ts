import { PartialType } from '@nestjs/swagger';
import { CreatePermissionInput } from './create-permission.input';

export class UpdatePermissionInput extends PartialType(CreatePermissionInput) {
    id: string;
}
