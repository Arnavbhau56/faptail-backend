import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common'
import { ProductsService } from './products.service'
import type { TenantRequest } from '../tenant/tenant.middleware'

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  getProducts(@Req() req: TenantRequest, @Query('category') categorySlug?: string) {
    return this.productsService.getProducts(req.tenant.id, categorySlug)
  }

  @Get('admin/all')
  getAllProducts(@Req() req: TenantRequest) {
    return this.productsService.getAllProducts(req.tenant.id)
  }

  @Get('categories')
  getCategories(@Req() req: TenantRequest) {
    return this.productsService.getCategories(req.tenant.id)
  }

  @Get('categories/all')
  getAllCategories(@Req() req: TenantRequest) {
    return this.productsService.getAllCategories(req.tenant.id)
  }

  @Post('categories')
  createCategory(@Req() req: TenantRequest, @Body() body: { name: string, slug?: string, image?: string, sort_order?: number, is_active?: boolean }) {
    return this.productsService.createCategory(req.tenant.id, body)
  }

  @Patch('categories/:id')
  updateCategory(@Req() req: TenantRequest, @Param('id') id: string, @Body() body: { name?: string, slug?: string, image?: string, sort_order?: number, is_active?: boolean }) {
    return this.productsService.updateCategory(req.tenant.id, id, body)
  }

  @Delete('categories/:id')
  deleteCategory(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.productsService.deleteCategory(req.tenant.id, id)
  }

  @Post()
  createProduct(@Req() req: TenantRequest, @Body() body: {
    name: string
    description?: string
    price: number
    category_id?: string
    image_url?: string
    sort_order?: number
  }) {
    return this.productsService.createProduct(req.tenant.id, body)
  }

  @Patch(':id/toggle')
  toggleAvailability(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.productsService.toggleAvailability(req.tenant.id, id)
  }

  @Patch(':id')
  updateProduct(@Req() req: TenantRequest, @Param('id') id: string, @Body() body: {
    name?: string
    description?: string
    price?: number
    category_id?: string
    image_url?: string
    sort_order?: number
  }) {
    return this.productsService.updateProduct(req.tenant.id, id, body)
  }

  @Delete(':id')
  deleteProduct(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.productsService.deleteProduct(req.tenant.id, id)
  }
}