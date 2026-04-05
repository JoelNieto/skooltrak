import { $Enums, Prisma } from '@generated/prisma';
import { ForbiddenException, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { AddToCartInput } from './dto/add-to-cart.input';
import { CheckoutStoreInput } from './dto/checkout-store.input';
import { CreateStoreCategoryInput } from './dto/create-store-category.input';
import { CreateStoreProductInput } from './dto/create-store-product.input';
import { ProcessStorePaymentInput } from './dto/process-store-payment.input';
import { UpdateCartItemInput } from './dto/update-cart-item.input';
import { UpdateStoreCategoryInput } from './dto/update-store-category.input';
import { UpdateStoreOrderStatusInput } from './dto/update-store-order-status.input';
import { UpdateStoreProductInput } from './dto/update-store-product.input';

const variantOrder = { sortOrder: 'asc' as const };

const productInclude = {
  category: true,
  variants: { orderBy: variantOrder },
} as const;

const cartInclude = {
  variant: {
    include: {
      product: { include: productInclude },
    },
  },
} as const;

const orderInclude = {
  items: {
    include: {
      product: { include: productInclude },
      variant: true,
    },
  },
} as const;

@Injectable({ scope: Scope.REQUEST })
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CONTEXT) private readonly context: { req: Request },
  ) {}

  private get ctx() {
    return this.context.req.user as {
      organizationId: string | null;
      userId: string;
      permissions?: string[];
    };
  }

  private get orgId(): string {
    const id = this.ctx.organizationId;
    if (!id) {
      throw new ForbiddenException('Organización requerida.');
    }
    return id;
  }

  private async ensureSchoolInOrg(schoolId: string) {
    const school = await this.prisma.school.findFirst({
      where: { id: schoolId, organizationId: this.orgId },
      select: { id: true },
    });
    if (!school) {
      throw new ForbiddenException('Escuela no encontrada o sin acceso.');
    }
    return school;
  }

  private async ensureProductInOrg(productId: string) {
    const product = await this.prisma.storeProduct.findFirst({
      where: {
        id: productId,
        school: { organizationId: this.orgId },
      },
      include: productInclude,
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado.');
    }
    return product;
  }

  // --- Categories (admin) ---
  async createCategory(input: CreateStoreCategoryInput) {
    await this.ensureSchoolInOrg(input.schoolId);
    return this.prisma.storeCategory.create({
      data: {
        schoolId: input.schoolId,
        name: input.name,
        description: input.description ?? null,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  }

  async updateCategory(input: UpdateStoreCategoryInput) {
    const existing = await this.prisma.storeCategory.findFirst({
      where: {
        id: input.id,
        school: { organizationId: this.orgId },
      },
    });
    if (!existing) throw new NotFoundException('Categoría no encontrada.');
    return this.prisma.storeCategory.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.storeCategory.findFirst({
      where: { id, school: { organizationId: this.orgId } },
    });
    if (!existing) throw new NotFoundException('Categoría no encontrada.');
    await this.prisma.storeCategory.delete({ where: { id } });
    return true;
  }

  storeCategories(schoolId: string) {
    return this.prisma.storeCategory.findMany({
      where: {
        schoolId,
        school: { organizationId: this.orgId },
        active: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  storeCategoriesAdmin(schoolId: string) {
    return this.prisma.storeCategory.findMany({
      where: {
        schoolId,
        school: { organizationId: this.orgId },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  // --- Products ---
  storeProducts(schoolId: string, search?: string | null, categoryId?: string | null) {
    return this.prisma.storeProduct.findMany({
      where: {
        schoolId,
        school: { organizationId: this.orgId },
        active: true,
        ...(categoryId ? { categoryId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { variants: { some: { label: { contains: search, mode: 'insensitive' } } } },
              ],
            }
          : {}),
      },
      include: productInclude,
      orderBy: { name: 'asc' },
    });
  }

  async storeProduct(id: string) {
    const p = await this.prisma.storeProduct.findFirst({
      where: {
        id,
        school: { organizationId: this.orgId },
        active: true,
      },
      include: productInclude,
    });
    return p;
  }

  storeProductsAdmin(schoolId: string) {
    return this.prisma.storeProduct.findMany({
      where: {
        schoolId,
        school: { organizationId: this.orgId },
      },
      include: productInclude,
      orderBy: { name: 'asc' },
    });
  }

  async createProduct(input: CreateStoreProductInput) {
    await this.ensureSchoolInOrg(input.schoolId);
    if (input.categoryId) {
      const cat = await this.prisma.storeCategory.findFirst({
        where: { id: input.categoryId, schoolId: input.schoolId },
      });
      if (!cat) throw new ForbiddenException('Categoría inválida para esta escuela.');
    }
    return this.prisma.storeProduct.create({
      data: {
        schoolId: input.schoolId,
        categoryId: input.categoryId ?? null,
        name: input.name,
        description: input.description ?? null,
        price: new Prisma.Decimal(input.price),
        imageUrl: input.imageUrl ?? null,
        active: input.active ?? true,
        variants: {
          create: input.variants.map((v, i) => ({
            label: v.label.trim(),
            stock: v.stock,
            sortOrder: v.sortOrder ?? i,
          })),
        },
      },
      include: productInclude,
    });
  }

  async updateProduct(input: UpdateStoreProductInput) {
    const existing = await this.prisma.storeProduct.findFirst({
      where: { id: input.id, school: { organizationId: this.orgId } },
      include: { variants: true },
    });
    if (!existing) throw new NotFoundException('Producto no encontrado.');
    if (input.categoryId !== undefined && input.categoryId !== null) {
      const cat = await this.prisma.storeCategory.findFirst({
        where: { id: input.categoryId, schoolId: existing.schoolId },
      });
      if (!cat) throw new ForbiddenException('Categoría inválida.');
    }
    if (input.variants !== undefined) {
      if (input.variants.length < 1) {
        throw new ForbiddenException('Debe haber al menos una talla o variante con stock.');
      }
      await this.prisma.$transaction(async (tx) => {
        const incomingIds = new Set(input.variants!.filter((v) => v.id).map((v) => v.id!));
        const toDelete = existing.variants.filter((v) => !incomingIds.has(v.id)).map((v) => v.id);
        if (toDelete.length) {
          await tx.storeProductVariant.deleteMany({
            where: { id: { in: toDelete }, productId: input.id },
          });
        }
        let i = 0;
        for (const v of input.variants!) {
          const label = v.label.trim();
          const sortOrder = v.sortOrder ?? i;
          i += 1;
          if (v.id) {
            const row = await tx.storeProductVariant.findFirst({
              where: { id: v.id, productId: input.id },
            });
            if (!row) throw new ForbiddenException('Variante inválida.');
            await tx.storeProductVariant.update({
              where: { id: v.id },
              data: { label, stock: v.stock, sortOrder },
            });
          } else {
            await tx.storeProductVariant.create({
              data: { productId: input.id, label, stock: v.stock, sortOrder },
            });
          }
        }
      });
    }
    return this.prisma.storeProduct.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.price !== undefined ? { price: new Prisma.Decimal(input.price) } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      },
      include: productInclude,
    });
  }

  async deleteProduct(id: string) {
    const existing = await this.prisma.storeProduct.findFirst({
      where: { id, school: { organizationId: this.orgId } },
    });
    if (!existing) throw new NotFoundException('Producto no encontrado.');
    await this.prisma.storeProduct.delete({ where: { id } });
    return true;
  }

  // --- Cart ---
  async myCart(schoolId: string) {
    await this.ensureSchoolInOrg(schoolId);
    const userId = this.ctx.userId;
    return this.prisma.storeCartItem.findMany({
      where: {
        userId,
        variant: { product: { schoolId } },
      },
      include: cartInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async addToCart(input: AddToCartInput) {
    const variant = await this.prisma.storeProductVariant.findFirst({
      where: {
        id: input.variantId,
        product: {
          school: { organizationId: this.orgId },
        },
      },
      include: { product: { include: productInclude } },
    });
    if (!variant) {
      throw new NotFoundException('Variante no encontrada.');
    }
    if (!variant.product.active) {
      throw new ForbiddenException('Producto no disponible.');
    }
    const available = variant.stock;
    const userId = this.ctx.userId;
    const existing = await this.prisma.storeCartItem.findUnique({
      where: { userId_variantId: { userId, variantId: variant.id } },
    });
    const nextQty = (existing?.quantity ?? 0) + input.quantity;
    if (nextQty > available) {
      throw new ForbiddenException('Stock insuficiente.');
    }
    return this.prisma.storeCartItem.upsert({
      where: { userId_variantId: { userId, variantId: variant.id } },
      create: {
        userId,
        variantId: variant.id,
        quantity: input.quantity,
      },
      update: { quantity: nextQty },
      include: cartInclude,
    });
  }

  async updateCartItem(input: UpdateCartItemInput) {
    const userId = this.ctx.userId;
    const row = await this.prisma.storeCartItem.findFirst({
      where: { id: input.cartItemId, userId },
      include: { variant: { include: { product: true } } },
    });
    if (!row) throw new NotFoundException('Ítem no encontrado.');
    await this.ensureProductInOrg(row.variant.productId);
    if (input.quantity > row.variant.stock) {
      throw new ForbiddenException('Stock insuficiente.');
    }
    return this.prisma.storeCartItem.update({
      where: { id: input.cartItemId },
      data: { quantity: input.quantity },
      include: cartInclude,
    });
  }

  async removeFromCart(cartItemId: string) {
    const userId = this.ctx.userId;
    const row = await this.prisma.storeCartItem.findFirst({
      where: { id: cartItemId, userId },
    });
    if (!row) throw new NotFoundException('Ítem no encontrado.');
    await this.prisma.storeCartItem.delete({ where: { id: cartItemId } });
    return true;
  }

  async clearCart(schoolId: string) {
    await this.ensureSchoolInOrg(schoolId);
    const userId = this.ctx.userId;
    await this.prisma.storeCartItem.deleteMany({
      where: { userId, variant: { product: { schoolId } } },
    });
    return true;
  }

  // --- Orders ---
  async checkout(input: CheckoutStoreInput) {
    await this.ensureSchoolInOrg(input.schoolId);
    const userId = this.ctx.userId;
    const items = await this.prisma.storeCartItem.findMany({
      where: { userId, variant: { product: { schoolId: input.schoolId } } },
      include: { variant: { include: { product: true } } },
    });
    if (!items.length) {
      throw new ForbiddenException('El carrito está vacío.');
    }
    let total = new Prisma.Decimal(0);
    for (const line of items) {
      if (!line.variant.product.active || line.quantity > line.variant.stock) {
        throw new ForbiddenException(`Stock insuficiente para: ${line.variant.product.name} (${line.variant.label})`);
      }
      total = total.add(new Prisma.Decimal(line.variant.product.price).mul(line.quantity));
    }
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.storeOrder.create({
        data: {
          schoolId: input.schoolId,
          userId,
          total,
          status: $Enums.StoreOrderStatus.PENDING,
          paymentStatus: $Enums.StorePaymentStatus.PENDING,
          notes: input.notes ?? null,
          items: {
            create: items.map((line) => ({
              productId: line.variant.productId,
              variantId: line.variantId,
              variantLabel: line.variant.label,
              quantity: line.quantity,
              unitPrice: line.variant.product.price,
            })),
          },
        },
        include: orderInclude,
      });
      for (const line of items) {
        await tx.storeProductVariant.update({
          where: { id: line.variantId },
          data: { stock: { decrement: line.quantity } },
        });
      }
      await tx.storeCartItem.deleteMany({
        where: { userId, variant: { product: { schoolId: input.schoolId } } },
      });
      return created;
    });
    return order;
  }

  async processPayment(input: ProcessStorePaymentInput) {
    const order = await this.prisma.storeOrder.findFirst({
      where: {
        id: input.orderId,
        school: { organizationId: this.orgId },
      },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado.');
    if (order.userId !== this.ctx.userId) {
      throw new ForbiddenException('No autorizado.');
    }
    const success = input.simulateSuccess !== false;
    if (!success) {
      return this.prisma.storeOrder.update({
        where: { id: order.id },
        data: {
          paymentStatus: $Enums.StorePaymentStatus.FAILED,
        },
        include: orderInclude,
      });
    }
    return this.prisma.storeOrder.update({
      where: { id: order.id },
      data: {
        paymentStatus: $Enums.StorePaymentStatus.PAID,
        status: $Enums.StoreOrderStatus.CONFIRMED,
      },
      include: orderInclude,
    });
  }

  myOrders(schoolId: string) {
    return this.prisma.storeOrder.findMany({
      where: {
        schoolId,
        userId: this.ctx.userId,
        school: { organizationId: this.orgId },
      },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async storeOrder(id: string) {
    const order = await this.prisma.storeOrder.findFirst({
      where: {
        id,
        school: { organizationId: this.orgId },
      },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Pedido no encontrado.');
    if (order.userId !== this.ctx.userId && !this.ctx.permissions?.includes('MANAGE_STORE')) {
      throw new ForbiddenException('No autorizado.');
    }
    return order;
  }

  storeOrdersAdmin(schoolId: string) {
    return this.prisma.storeOrder.findMany({
      where: {
        schoolId,
        school: { organizationId: this.orgId },
      },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(input: UpdateStoreOrderStatusInput) {
    const order = await this.prisma.storeOrder.findFirst({
      where: {
        id: input.orderId,
        school: { organizationId: this.orgId },
      },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado.');
    return this.prisma.storeOrder.update({
      where: { id: input.orderId },
      data: { status: input.status },
      include: orderInclude,
    });
  }
}
