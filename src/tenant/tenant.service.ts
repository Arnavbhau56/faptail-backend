import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async getConfig(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        name: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        logo_url: true,
        is_open: true,
        hero_images: true,
      },
    })
  }

  async toggleOpen(tenantId: string, is_open: boolean) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { is_open },
    })
  }

  async updateInfo(tenantId: string, data: {
    name?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    gst_number?: string
  }) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
    })
  }
}