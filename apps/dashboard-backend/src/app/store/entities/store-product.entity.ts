import { Prisma } from '@generated/prisma';
import { Field, Float, ObjectType } from '@nestjs/graphql';
import { StoreCategory } from './store-category.entity';
import { StoreProductVariant } from './store-product-variant.entity';

@ObjectType()
export class StoreProduct {
  @Field(() => String)
  id: string;

  @Field(() => String)
  schoolId: string;

  @Field(() => String, { nullable: true })
  categoryId: string | null;

  @Field(() => StoreCategory, { nullable: true })
  category: StoreCategory | null;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => Float)
  price: Prisma.Decimal;

  @Field(() => String, { nullable: true })
  imageUrl: string | null;

  @Field(() => Boolean)
  active: boolean;

  @Field(() => [StoreProductVariant])
  variants: StoreProductVariant[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
