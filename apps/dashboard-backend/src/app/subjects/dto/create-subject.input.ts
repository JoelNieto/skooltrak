import { SUBJECT_ICON_NAMES } from '@/shared';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSubjectInput {
    code: string;
    name: string;

    /** An icon from SUBJECT_ICONS (ACA-001 FR .2); null clears it back to "book-open". */
    @IsOptional()
    @IsIn(SUBJECT_ICON_NAMES, { message: 'Ícono de asignatura inválido' })
    icon?: string | null;

    /** Area grouping the subject on Mis cursos (ACA-001 BR .14); empty or null clears it. */
    @IsOptional()
    @IsString()
    @MaxLength(60, { message: 'El área admite 60 caracteres como máximo' })
    area?: string | null;
}
