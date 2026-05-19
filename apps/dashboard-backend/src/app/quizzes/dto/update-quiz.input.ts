import { PartialType } from '@nestjs/swagger';
import { CreateQuizInput } from './create-quiz.input';

export class UpdateQuizInput extends PartialType(CreateQuizInput) {
    id: string;
}
