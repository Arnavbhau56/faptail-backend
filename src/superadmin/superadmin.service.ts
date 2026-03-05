import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  // ── TENANTS ─────────────────────────────────────────

  async getAllTenants() {
    return this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        is_open: true,
        credits: true,
        credit_per_order_pct: true,
        gst_number: true,
        invoice_prefix: true,
        platform_fee_pct: true,
        delivery_fee_pct: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    })
  }

  async createTenant(data: {
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
    return this.prisma.tenant.create({ data })
  }

  async getTenantById(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: { select: { orders: true, products: true } },
      },
    })
    if (!tenant) throw new NotFoundException('Tenant not found')
    return tenant
  }

  async updateTenant(tenantId: string, data: any) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
    })
  }

  // ── ORDERS ──────────────────────────────────────────

  async getAllOrders(filters: {
    tenant_id?: string
    status?: string
    from?: string
    to?: string
  }) {
    return this.prisma.order.findMany({
      where: {
        ...(filters.tenant_id ? { tenant_id: filters.tenant_id } : {}),
        ...(filters.status ? { status: filters.status as any } : {}),
        ...(filters.from || filters.to ? {
          created_at: {
            ...(filters.from ? { gte: new Date(filters.from) } : {}),
            ...(filters.to ? { lte: new Date(filters.to) } : {}),
          }
        } : {}),
      },
      include: {
        tenant: { select: { name: true, slug: true } },
        items: true,
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    })
  }

  // ── REVENUE ─────────────────────────────────────────

  async getRevenue() {
    const now = new Date()
    const startOfDay = new Date(now.setHours(0, 0, 0, 0))
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [today, thisWeek, thisMonth, perTenant] = await Promise.all([
      // Today's orders
      this.prisma.order.aggregate({
        where: { created_at: { gte: startOfDay }, payment_status: 'PAID' },
        _sum: { total_amount: true },
        _count: true,
      }),
      // This week
      this.prisma.order.aggregate({
        where: { created_at: { gte: startOfWeek }, payment_status: 'PAID' },
        _sum: { total_amount: true },
        _count: true,
      }),
      // This month
      this.prisma.order.aggregate({
        where: { created_at: { gte: startOfMonth }, payment_status: 'PAID' },
        _sum: { total_amount: true },
        _count: true,
      }),
      // Per tenant breakdown
      this.prisma.order.groupBy({
        by: ['tenant_id'],
        where: { payment_status: 'PAID' },
        _sum: { total_amount: true },
        _count: true,
      }),
    ])

    // Get tenant names for breakdown
    const tenants = await this.prisma.tenant.findMany({
      select: { id: true, name: true, slug: true }
    })

    const breakdown = perTenant.map(t => ({
      tenant: tenants.find(ten => ten.id === t.tenant_id),
      total_revenue: t._sum.total_amount,
      total_orders: t._count,
    }))

    return {
      today: { revenue: today._sum.total_amount, orders: today._count },
      this_week: { revenue: thisWeek._sum.total_amount, orders: thisWeek._count },
      this_month: { revenue: thisMonth._sum.total_amount, orders: thisMonth._count },
      per_tenant: breakdown,
    }
  }
}