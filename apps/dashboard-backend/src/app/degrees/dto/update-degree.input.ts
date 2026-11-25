import { PartialType } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreateDegreeInput } from './create-degree.input';

export class UpdateDegreeInput extends PartialType(CreateDegreeInput) {
  @IsString()
  id: string;
}
