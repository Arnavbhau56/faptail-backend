import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getProducts(tenantId: string, categorySlug?: string) {
    const where: any = { tenant_id: tenantId, is_available: true }
    
    if (categorySlug) {
      where.category = { slug: categorySlug }
    }
    
    return this.prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: [{ category: { sort_order: 'asc' } }, { sort_order: 'asc' }],
    })
  }

  async getAllProducts(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenant_id: tenantId },
      include: { category: true },
      orderBy: [{ category: { sort_order: 'asc' } }, { sort_order: 'asc' }],
    })
  }

  async createProduct(tenantId: string, data: {
    name: string
    description?: string
    price: number
    category_id?: string
    image_url?: string
    sort_order?: number
  }) {
    return this.prisma.product.create({
      data: { ...data, tenant_id: tenantId },
    })
  }

  async updateProduct(tenantId: string, productId: string, data: {
    name?: string
    description?: string
    price?: number
    category_id?: string
    image_url?: string
    sort_order?: number
    is_available?: boolean
  }) {
    return this.prisma.product.update({
      where: { id: productId, tenant_id: tenantId },
      data,
    })
  }

  async toggleAvailability(tenantId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, tenant_id: tenantId },
    })

    if (!product) throw new NotFoundException('Product not found')

    return this.prisma.product.update({
      where: { id: productId },
      data: { is_available: !product.is_available },
    })
  }

  async deleteProduct(tenantId: string, productId: string) {
    return this.prisma.product.delete({
      where: { id: productId, tenant_id: tenantId },
    })
  }

  async getCategories(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenant_id: tenantId, is_active: true },
      orderBy: { sort_order: 'asc' },
    })
  }

  async getAllCategories(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenant_id: tenantId },
      orderBy: { sort_order: 'asc' },
    })
  }

  async createCategory(tenantId: string, data: { name: string, slug?: string, image?: string, sort_order?: number, is_active?: boolean }) {
    return this.prisma.category.create({
      data: { ...data, tenant_id: tenantId },
    })
  }

  async updateCategory(tenantId: string, categoryId: string, data: { name?: string, slug?: string, image?: string, sort_order?: number, is_active?: boolean }) {
    return this.prisma.category.update({
      where: { id: categoryId, tenant_id: tenantId },
      data,
    })
  }

  async deleteCategory(tenantId: string, categoryId: string) {
    return this.prisma.category.delete({
      where: { id: categoryId, tenant_id: tenantId },
    })
  }
}