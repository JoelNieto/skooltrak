import { PartialType } from '@nestjs/swagger';
import { CreateOrganizationInput } from './create-organization.input';

export class UpdateOrganizationInput extends PartialType(
  CreateOrganizationInput
) {
    id: string;
}
