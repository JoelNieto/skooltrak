import { Pipe, PipeTransform } from '@angular/core';
import { Prisma } from '@prisma/client';

@Pipe({
  name: 'decimal',
})
export class PrismaDecimalPipe implements PipeTransform {
  transform(value: Prisma.Decimal): number | string {
    console.log(typeof value);
    return (value as unknown as number) || '';
  }
}
