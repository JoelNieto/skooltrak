import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const productInclude = {
  category: true,
} as const;

@Injectable()
export class StorePublicService {
  constructor(private readonly prisma: PrismaService) {}

  async publicSchoolsDirectory() {
    const rows = await this.prisma.school.findMany({
      where: { slug: { not: null } },
      select: { id: true, name: true, slug: true, currencyCode: true, logo: true },
      orderBy: { name: 'asc' },
    });
    return rows
      .filter((r): r is typeof r & { slug: string } => r.slug != null && r.slug.length > 0)
      .map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        currencyCode: r.currencyCode,
        logoUrl: r.logo?.trim() ? r.logo : null,
      }));
  }

  async schoolBySlug(slug: string) {
    const school = await this.prisma.school.findFirst({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        currencyCode: true,
        logo: true,
      },
    });
    if (!school?.slug) {
      throw new NotFoundException('Escuela no encontrada.');
    }
    return {
      id: school.id,
      name: school.name,
      slug: school.slug,
      currencyCode: school.currencyCode,
      logoUrl: school.logo?.trim() ? school.logo : null,
    };
  }

  publicStoreCategories(schoolId: string) {
    return this.prisma.storeCategory.findMany({
      where: {
        schoolId,
        active: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  publicStoreProducts(schoolId: string, search?: string | null, categoryId?: string | null) {
    return this.prisma.storeProduct.findMany({
      where: {
        schoolId,
        active: true,
        ...(categoryId ? { categoryId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: productInclude,
      orderBy: { name: 'asc' },
    });
  }

  async publicStoreProduct(id: string) {
    const p = await this.prisma.storeProduct.findFirst({
      where: {
        id,
        active: true,
      },
      include: productInclude,
    });
    return p ?? null;
  }
}
