import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/** IAM-001 FR .11–.12: create the invitee's account and accept the invitation. */
export class AcceptOrgInvitationInput {
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
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiProperty()
  @Equals(true, { message: 'Debes aceptar los términos' })
  acceptTerms: boolean;
}
