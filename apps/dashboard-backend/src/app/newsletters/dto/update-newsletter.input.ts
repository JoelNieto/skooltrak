import { PartialType } from '@nestjs/swagger';
import { CreateNewsletterInput } from './create-newsletter.input';

export class UpdateNewsletterInput extends PartialType(CreateNewsletterInput) {
    id: string;
}
