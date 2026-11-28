import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** IAM-001 FR .15: the first school of an invited organization. */
export class CreateFirstSchoolInput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Nombre de la escuela requerido' })
  @MaxLength(120)
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Nombre corto requerido' })
  @MaxLength(10, { message: 'Máximo 10 caracteres' })
  shortName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  currentYear?: number;
}
