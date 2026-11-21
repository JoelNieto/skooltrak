import { SUBJECT_ICON_NAMES } from '@/shared';
import { IsIn, IsOptional } from 'class-validator';

export class CreateSubjectInput {
    code: string;
    name: string;

    /** An icon from SUBJECT_ICONS (ACA-001 FR .2); null clears it back to "book-open". */
    @IsOptional()
    @IsIn(SUBJECT_ICON_NAMES, { message: 'Ícono de asignatura inválido' })
    icon?: string | null;
}
