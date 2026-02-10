import { Pipe, PipeTransform } from '@angular/core';
import { Prisma } from '@generated/prisma';

type Decimal = InstanceType<typeof Prisma.Decimal>;

@Pipe({
  name: 'decimal',
})
export class PrismaDecimalPipe implements PipeTransform {
  transform(value: Decimal | null | undefined): number | string {
    return (value as unknown as number) || '';
  }
}
