import { Controller, Get, Post, Param, Req, Res } from '@nestjs/common'
import { InvoicesService } from './invoices.service'
import type { TenantRequest } from '../tenant/tenant.middleware'
import type { Response } from 'express'
import * as fs from 'fs'
import * as path from 'path'

@Controller('invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  // POST /invoices/generate/:orderId — generate invoice for order
  @Post('generate/:orderId')
  generateInvoice(@Req() req: TenantRequest, @Param('orderId') orderId: string) {
    return this.invoicesService.generateInvoice(req.tenant.id, orderId)
  }

  // GET /invoices/:orderId/download — download PDF
  @Get(':orderId/download')
  async downloadInvoice(
    @Req() req: TenantRequest,
    @Param('orderId') orderId: string,
    @Res() res: Response
  ) {
    const filePath = await this.invoicesService.downloadInvoice(req.tenant.id, orderId)
    const fileName = path.basename(filePath)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    fs.createReadStream(filePath).pipe(res)
  }

  // GET /invoices/:orderId — get invoice details
  @Get(':orderId')
  getInvoice(@Req() req: TenantRequest, @Param('orderId') orderId: string) {
    return this.invoicesService.getInvoice(req.tenant.id, orderId)
  }
}