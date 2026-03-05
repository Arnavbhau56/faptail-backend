import { Injectable, NestMiddleware, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { PrismaService } from '../prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'

export interface TenantRequest extends Request {
  tenant: {
    id: string
    slug: string
    name: string
    address: string | null
    city: string | null
    state: string | null
    pincode: string | null
    gst_number: string | null
    is_open: boolean
    invoice_prefix: string
    platform_fee_pct: number
    delivery_fee_pct: number
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    let tenantId: string | null = null;

    // 1. Try x-tenant-id header (for customer frontend)
    const headerTenantId = req.headers['x-tenant-id'] as string;
    if (headerTenantId) {
      tenantId = headerTenantId;
    }

    // 2. Try to get tenant from JWT token (for admin users)
    if (!tenantId) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = this.jwtService.verify(token);
          if (decoded.tenant_id) {
            tenantId = decoded.tenant_id;
          }
        } catch (err) {
          // Token invalid or expired, continue to domain-based lookup
        }
      }
    }

    // 3. Fallback to domain-based lookup
    if (!tenantId) {
      const hostname = req.hostname;
      const tenant = await this.prisma.tenant.findFirst({
        where: { domain: hostname },
        select: { id: true },
      });
      if (tenant) {
        tenantId = tenant.id;
      }
    }

    if (!tenantId) {
      throw new NotFoundException(`Tenant not found`);
    }

    // Fetch full tenant details
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        name: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        gst_number: true,
        is_open: true,
        invoice_prefix: true,
        platform_fee_pct: true,
        delivery_fee_pct: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant not found`);
    }

    req.tenant = tenant;
    next();
  }
}