import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class InvitedAdminInput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Nombre requerido' })
  @MaxLength(80)
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Apellido requerido' })
  @MaxLength(80)
  lastName: string;

  @ApiProperty()
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email: string;
}

/** IAM-001 FR .1–.2: create an organization together with its first admin invitation. */
export class CreateOrganizationWithInvitationInput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Nombre requerido' })
  @MaxLength(120)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ type: InvitedAdminInput })
  @ValidateNested()
  @Type(() => InvitedAdminInput)
  admin: InvitedAdminInput;

  /** When false the invitation is created without sending the email (FR .2). Defaults to true. */
  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}
