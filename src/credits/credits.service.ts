import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreditType } from '@prisma/client'

@Injectable()
export class CreditsService {
  constructor(private prisma: PrismaService) {}

  // Get current credit balance + transactions
  async getBalance(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        credits: true,
        credit_per_order_pct: true,
        name: true,
      },
    })

    if (!tenant) throw new NotFoundException('Tenant not found')

    const transactions = await this.prisma.creditTransaction.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      take: 50,
    })

    return {
      balance: tenant.credits,
      credit_per_order_pct: tenant.credit_per_order_pct,
      transactions,
    }
  }

  // SuperAdmin: add credits to a tenant
  async topupCredits(tenantId: string, amount: number, note?: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be greater than 0')

    const [tenant, transaction] = await this.prisma.$transaction([
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: { credits: { increment: amount } },
      }),
      this.prisma.creditTransaction.create({
        data: {
          tenant_id: tenantId,
          amount,
          type: CreditType.TOPUP,
          note: note ?? `Manual topup of ${amount} credits`,
        },
      }),
    ])

    return {
      new_balance: tenant.credits,
      transaction,
    }
  }

  // Called internally when order is ACCEPTED
  async deductCredit(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { total_amount: true },
    })

    if (!order) throw new NotFoundException('Order not found')

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { credits: true, credit_per_order_pct: true },
    })

    if (!tenant) throw new NotFoundException('Tenant not found')

    const creditAmount = (order.total_amount * tenant.credit_per_order_pct) / 100

    if (tenant.credits < creditAmount) {
      throw new BadRequestException(
        'Insufficient credits. Please topup to continue accepting orders.'
      )
    }

    const [updated, transaction] = await this.prisma.$transaction([
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: { credits: { decrement: creditAmount } },
      }),
      this.prisma.creditTransaction.create({
        data: {
          tenant_id: tenantId,
          amount: -creditAmount,
          type: CreditType.DEDUCTED,
          order_id: orderId,
          note: `Credit deducted for order ${orderId}`,
        },
      }),
    ])

    return { new_balance: updated.credits, transaction }
  }

  // Called internally when order is CANCELLED (refund credit)
  async refundCredit(tenantId: string, orderId: string) {
    // Check if credit was already deducted for this order
    const deduction = await this.prisma.creditTransaction.findFirst({
      where: {
        tenant_id: tenantId,
        order_id: orderId,
        type: CreditType.DEDUCTED,
      },
    })

    if (!deduction) return null // order was never accepted, no refund needed

    const creditAmount = Math.abs(deduction.amount)

    const [updated, transaction] = await this.prisma.$transaction([
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: { credits: { increment: creditAmount } },
      }),
      this.prisma.creditTransaction.create({
        data: {
          tenant_id: tenantId,
          amount: creditAmount,
          type: CreditType.REFUNDED,
          order_id: orderId,
          note: `Credit refunded for cancelled order ${orderId}`,
        },
      }),
    ])

    return { new_balance: updated.credits, transaction }
  }

  // SuperAdmin: get all tenants with balances
  async getAllBalances() {
    const tenants = await this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        credits: true,
        credit_per_order_pct: true,
      },
      orderBy: { credits: 'asc' },
    })

    const transactions = await this.prisma.creditTransaction.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
      include: {
        tenant: {
          select: { name: true },
        },
      },
    })

    return {
      tenants,
      transactions: transactions.map(txn => ({
        ...txn,
        tenant_name: txn.tenant.name,
      })),
    }
  }

  // SuperAdmin: update credit_per_order_pct rate for a tenant
  async updateRate(tenantId: string, credit_per_order_pct: number) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { credit_per_order_pct },
    })
  }
}