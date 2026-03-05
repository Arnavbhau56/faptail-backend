import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateOrderDto } from './orders.dto'
import { OrderStatus, PaymentStatus } from '@prisma/client'
import Razorpay from 'razorpay'
import * as crypto from 'crypto'
import { CreditsService } from '../credits/credits.service'
import { InvoicesService } from '../invoices/invoices.service'

@Injectable()
export class OrdersService {
  private razorpay: Razorpay

  constructor(
    private prisma: PrismaService,
    private creditsService: CreditsService,
    @Inject(forwardRef(() => InvoicesService))
    private invoicesService: InvoicesService,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }

  private async generateOrderNumber(tenantId: string, prefix: string): Promise<string> {
    const count = await this.prisma.order.count({ where: { tenant_id: tenantId } })
    const padded = String(count + 1).padStart(4, '0')
    return `${prefix}-${padded}`
  }

  async createOrder(
    tenantId: string,
    invoicePrefix: string,
    platformFeePct: number,
    deliveryFeePct: number,
    dto: CreateOrderDto
  ) {
    const productIds = dto.items.map(i => i.product_id)
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, tenant_id: tenantId, is_available: true },
    })

    if (products.length !== dto.items.length) {
      throw new BadRequestException('One or more products are unavailable or invalid')
    }

    // Calculate totals
    let subtotal = 0
    const orderItems = dto.items.map(item => {
      const product = products.find(p => p.id === item.product_id)
      if (!product) throw new BadRequestException(`Product ${item.product_id} not found`)

      const itemSubtotal = product.price * item.quantity
      subtotal += itemSubtotal
      return {
        product_id: item.product_id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      }
    })

    // Fees from tenant settings (snapshot at order time)
    const platform_fee = parseFloat((subtotal * platformFeePct / 100).toFixed(2))
    const delivery_fee = parseFloat((subtotal * deliveryFeePct / 100).toFixed(2))
    const total_amount = parseFloat((subtotal + platform_fee + delivery_fee).toFixed(2))
    const order_number = await this.generateOrderNumber(tenantId, invoicePrefix)

    // Create Razorpay order
    const razorpayOrder = await this.razorpay.orders.create({
      amount: Math.round(total_amount * 100), // paise
      currency: 'INR',
      receipt: order_number,
    })

    // Save order to DB
    const order = await this.prisma.order.create({
      data: {
        tenant_id: tenantId,
        order_number,
        customer_name: dto.customer_name,
        customer_phone: dto.customer_phone,
        customer_email: dto.customer_email,
        notes: dto.notes,
        subtotal,
        platform_fee,
        delivery_fee,
        total_amount,
        razorpay_order_id: razorpayOrder.id,
        items: { create: orderItems },
      },
      include: { items: true },
    })

    return {
      order,
      razorpay: {
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
      },
    }
  }

  async verifyPayment(tenantId: string, dto: {
    order_id: string
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }) {
    // 1. Verify signature
    const body = dto.razorpay_order_id + '|' + dto.razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET ?? '')
      .update(body)
      .digest('hex')

    if (expectedSignature !== dto.razorpay_signature) {
      throw new BadRequestException('Invalid payment signature')
    }

    // 2. Update order payment status
    const order = await this.prisma.order.update({
      where: { id: dto.order_id, tenant_id: tenantId },
      data: {
        payment_status: PaymentStatus.PAID,
        razorpay_payment_id: dto.razorpay_payment_id,
      },
      include: { items: true },
    })

    return { success: true, order }
  }

  async getOrders(tenantId: string, status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: {
        tenant_id: tenantId,
        ...(status ? { status } : {}),
      },
      include: { items: true, invoice: true },
      orderBy: { created_at: 'desc' },
    })
  }

  async getOrderById(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, tenant_id: tenantId },
      include: { items: true, invoice: true },
    })
    if (!order) throw new NotFoundException('Order not found')
    return order
  }

  async updateStatus(tenantId: string, orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, tenant_id: tenantId },
    })
    if (!order) throw new NotFoundException('Order not found')

    const validTransitions: Record<string, OrderStatus[]> = {
      PENDING: ['READY', 'CANCELLED'],
      READY: ['SHIPPED'],
      SHIPPED: [],
      CANCELLED: [],
    }

    if (!validTransitions[order.status].includes(status)) {
      throw new BadRequestException(
        `Cannot move order from ${order.status} to ${status}`
      )
    }

    // Deduct credit and generate invoice when READY (accepted)
    if (status === OrderStatus.READY) {
      await this.creditsService.deductCredit(tenantId, orderId)
      
      // Generate invoice with PDF
      await this.invoicesService.generateInvoice(tenantId, orderId)
    }

    // Refund credit when CANCELLED
    if (status === OrderStatus.CANCELLED) {
      await this.creditsService.refundCredit(tenantId, orderId)
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true, invoice: true },
    })
  }

  async cancelOrder(tenantId: string, orderId: string) {
    return this.updateStatus(tenantId, orderId, OrderStatus.CANCELLED)
  }
}