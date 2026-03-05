import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './orders.dto'
import { OrderStatus } from '@prisma/client'
import type { TenantRequest } from '../tenant/tenant.middleware'

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) { }

  @Post()
  createOrder(@Req() req: TenantRequest, @Body() body: CreateOrderDto) {
    return this.ordersService.createOrder(
      req.tenant.id,
      req.tenant.invoice_prefix,
      req.tenant.platform_fee_pct,
      req.tenant.delivery_fee_pct,
      body
    )
  }

  // POST /orders/verify-payment — called after Razorpay success
  @Post('verify-payment')
  verifyPayment(@Req() req: TenantRequest, @Body() body: {
    order_id: string
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }) {
    return this.ordersService.verifyPayment(req.tenant.id, body)
  }

  @Get()
  getOrders(@Req() req: TenantRequest, @Query('status') status?: OrderStatus) {
    return this.ordersService.getOrders(req.tenant.id, status)
  }

  @Get(':id')
  getOrderById(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.ordersService.getOrderById(req.tenant.id, id)
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req: TenantRequest,
    @Param('id') id: string,
    @Body() body: { status: OrderStatus }
  ) {
    return this.ordersService.updateStatus(req.tenant.id, id, body.status)
  }

  @Patch(':id/cancel')
  cancelOrder(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.ordersService.cancelOrder(req.tenant.id, id)
  }
}
