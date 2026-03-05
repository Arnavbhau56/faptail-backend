import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common'
import { SuperAdminService } from './superadmin.service'

@Controller('superadmin')
export class SuperAdminController {
  constructor(private superAdminService: SuperAdminService) {}

  // ── TENANTS ─────────────────────────────────────────

  // GET /superadmin/tenants
  @Get('tenants')
  getAllTenants() {
    return this.superAdminService.getAllTenants()
  }

  // POST /superadmin/tenants
  @Post('tenants')
  createTenant(@Body() body: {
    slug: string
    name: string
    domain: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    gst_number?: string
    invoice_prefix: string
    platform_fee_pct?: number
    delivery_fee_pct?: number
    credit_per_order?: number
    credits?: number
  }) {
    return this.superAdminService.createTenant(body)
  }

  // GET /superadmin/tenants/:id
  @Get('tenants/:id')
  getTenantById(@Param('id') id: string) {
    return this.superAdminService.getTenantById(id)
  }

  // PATCH /superadmin/tenants/:id
  @Patch('tenants/:id')
  updateTenant(@Param('id') id: string, @Body() body: {
    name?: string
    slug?: string
    domain?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    gst_number?: string
    invoice_prefix?: string
    platform_fee_pct?: number
    delivery_fee_pct?: number
    credit_per_order_pct?: number
    logo_url?: string
    hero_images?: string[]
  }) {
    return this.superAdminService.updateTenant(id, body)
  }

  // ── ORDERS ──────────────────────────────────────────

  // GET /superadmin/orders?tenant_id=&status=&from=&to=
  @Get('orders')
  getAllOrders(
    @Query('tenant_id') tenant_id?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.superAdminService.getAllOrders({ tenant_id, status, from, to })
  }

  // ── REVENUE ─────────────────────────────────────────

  // GET /superadmin/revenue
  @Get('revenue')
  getRevenue() {
    return this.superAdminService.getRevenue()
  }
}