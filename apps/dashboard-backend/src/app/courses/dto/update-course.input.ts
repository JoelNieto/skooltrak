import { PartialType } from '@nestjs/swagger';
import { CreateCourseInput } from './create-course.input';

export class UpdateCourseInput extends PartialType(CreateCourseInput) {
    id: string;
}
