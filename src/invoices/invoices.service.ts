import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import PDFDocument from 'pdfkit'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  private getInvoicesDir(): string {
    const dir = path.join(process.cwd(), 'invoices')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    return dir
  }

  async generateInvoice(tenantId: string, orderId: string): Promise<string> {
    // 1. Fetch order with all details
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, tenant_id: tenantId },
      include: {
        items: true,
        tenant: true,
        invoice: true,
      },
    })

    if (!order) throw new NotFoundException('Order not found')

    // 2. If invoice already exists, return existing path
    if (order.invoice?.pdf_path) return order.invoice.pdf_path

    // 3. Generate invoice number
    const invoiceCount = await this.prisma.invoice.count({
      where: { tenant_id: tenantId },
    })
    const invoice_number = `${order.tenant.invoice_prefix}-INV-${String(invoiceCount + 1).padStart(4, '0')}`

    // 4. Generate PDF
    const fileName = `${invoice_number}.pdf`
    const filePath = path.join(this.getInvoicesDir(), fileName)

    await this.buildPDF(order, invoice_number, filePath)

    // 5. Save invoice record in DB
    await this.prisma.invoice.create({
      data: {
        tenant_id: tenantId,
        order_id: orderId,
        invoice_number,
        pdf_path: filePath,
        gst_number: order.tenant.gst_number,
      },
    })

    return filePath
  }

  private buildPDF(order: any, invoiceNumber: string, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 30 })
      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      const W = doc.page.width
      const m = 30  // margin

      // ── HEADER ──────────────────────────────────────
      doc.fontSize(13).font('Helvetica-Bold')
        .text(order.tenant.name, m, 30, { align: 'center', width: W - m * 2 })

      doc.fontSize(8).font('Helvetica')
        .text(order.tenant.address ?? '', { align: 'center' })
        .text(`${order.tenant.city ?? ''}, ${order.tenant.state ?? ''} ${order.tenant.pincode ?? ''}`, { align: 'center' })

      if (order.tenant.gst_number) {
        doc.text(`GSTIN: ${order.tenant.gst_number}`, { align: 'center' })
      }

      doc.moveDown(0.3)
      doc.moveTo(m, doc.y).lineTo(W - m, doc.y).stroke()
      doc.moveDown(0.3)

      doc.fontSize(10).font('Helvetica-Bold')
        .text('Tax Invoice', { align: 'center' })

      doc.moveDown(0.3)
      doc.moveTo(m, doc.y).lineTo(W - m, doc.y).stroke()
      doc.moveDown(0.4)

      // ── ORDER INFO ──────────────────────────────────
      doc.fontSize(8).font('Helvetica')
      const dateStr = new Date(order.created_at).toLocaleString('en-IN')
      doc.text(`Order ID: ${order.order_number}`, m, doc.y)
      doc.text(`Date: ${dateStr}`, m, doc.y - doc.currentLineHeight(), {
        align: 'right', width: W - m * 2
      })
      doc.moveDown(0.3)
      doc.text('Payment: Online')
      doc.moveDown(0.3)

      doc.moveTo(m, doc.y).lineTo(W - m, doc.y).stroke()
      doc.moveDown(0.4)

      // ── CUSTOMER DETAILS ────────────────────────────
      doc.fontSize(9).font('Helvetica-Bold').text('Customer details')
      doc.fontSize(8).font('Helvetica')
        .text(`Name: ${order.customer_name}`)
        .text(`Mobile: ${order.customer_phone}`)
      if (order.customer_email) doc.text(`Email: ${order.customer_email}`)

      doc.moveDown(0.3)
      doc.moveTo(m, doc.y).lineTo(W - m, doc.y).stroke()
      doc.moveDown(0.4)

      // ── ITEMS TABLE ──────────────────────────────────
      const col = {
        item: m,
        qty: W * 0.58,
        price: W * 0.72,
        amount: W - m,
      }

      doc.fontSize(8.5).font('Helvetica-Bold')
      doc.text('Item', col.item, doc.y, { continued: false })
      const headerY = doc.y - doc.currentLineHeight()
      doc.text('Qty',    col.qty,    headerY, { width: 30 })
      doc.text('Price',  col.price,  headerY, { width: 40 })
      doc.text('Amount', col.amount - 35, headerY, { width: 35, align: 'right' })

      doc.moveDown(0.2)
      doc.moveTo(m, doc.y).lineTo(W - m, doc.y).stroke()
      doc.moveDown(0.3)

      doc.fontSize(8).font('Helvetica')
      for (const item of order.items) {
        const rowY = doc.y
        doc.text(item.name, col.item, rowY, { width: col.qty - col.item - 5 })
        doc.text(String(item.quantity), col.qty, rowY, { width: 30 })
        doc.text(`${item.price.toFixed(2)}`, col.price, rowY, { width: 40 })
        doc.text(`${item.subtotal.toFixed(2)}`, col.amount - 35, rowY, { width: 35, align: 'right' })
        doc.moveDown(0.5)
      }

      doc.moveTo(m, doc.y).lineTo(W - m, doc.y).stroke()
      doc.moveDown(0.4)

      // ── TOTALS ───────────────────────────────────────
      const addTotalRow = (label: string, value: number | string, bold = false) => {
        const font = bold ? 'Helvetica-Bold' : 'Helvetica'
        const size = bold ? 9.5 : 8.5
        doc.fontSize(size).font(font)
        const rowY = doc.y
        doc.text(label, m, rowY, { width: W - m * 2 - 60 })
        const valStr = typeof value === 'number'
          ? (value === 0 ? 'FREE' : `Rs.${value.toFixed(2)}`)
          : value
        doc.text(valStr, W - m - 60, rowY, { width: 60, align: 'right' })
        doc.moveDown(0.4)
      }

      addTotalRow('Item Total', order.subtotal)
      addTotalRow('Delivery', order.delivery_fee)
      addTotalRow(`Platform Fee`, order.platform_fee)

      doc.moveTo(m, doc.y).lineTo(W - m, doc.y).stroke()
      doc.moveDown(0.3)

      addTotalRow('Total Amount', order.total_amount, true)

      doc.moveDown(0.5)
      doc.moveTo(m, doc.y).lineTo(W - m, doc.y).lineWidth(0.3).stroke()
      doc.moveDown(0.4)

      // ── FOOTER ───────────────────────────────────────
      doc.fontSize(7).font('Helvetica')
        .text('Thank you for your order!', { align: 'center' })
        .text('This is a computer generated invoice.', { align: 'center' })

      doc.end()
      stream.on('finish', resolve)
      stream.on('error', reject)
    })
  }

  async downloadInvoice(tenantId: string, orderId: string) {
    // Generate if not exists, return path
    const filePath = await this.generateInvoice(tenantId, orderId)
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Invoice file not found')
    }
    return filePath
  }

  async getInvoice(tenantId: string, orderId: string) {
    return this.prisma.invoice.findFirst({
      where: { tenant_id: tenantId, order_id: orderId },
    })
  }
}