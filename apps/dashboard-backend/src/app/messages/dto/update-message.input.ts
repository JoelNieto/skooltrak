import { CreateMessageInput } from './create-message.input';
import { PartialType } from '@nestjs/swagger';
export class UpdateMessageInput extends PartialType(CreateMessageInput) {
    id: number;
}
