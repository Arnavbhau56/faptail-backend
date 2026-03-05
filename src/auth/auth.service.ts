import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { AdminRole } from '@prisma/client'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async adminLogin(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } })
    if (!admin) throw new UnauthorizedException('Invalid email or password')

    const match = await bcrypt.compare(password, admin.password)
    if (!match) throw new UnauthorizedException('Invalid email or password')

    let tenant_slug: string | null = null
    if (admin.tenant_id) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: admin.tenant_id },
        select: { slug: true },
      })
      tenant_slug = tenant?.slug ?? null
    }

    const token = this.jwtService.sign({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      tenant_id: admin.tenant_id,
    })

    return {
      token,
      role: admin.role,
      tenant_id: admin.tenant_id,
      tenant_slug,
    }
  }

  async createAdmin(email: string, password: string, role: AdminRole, tenant_id?: string) {
    const existing = await this.prisma.adminUser.findUnique({ where: { email } })
    if (existing) throw new BadRequestException('Email already exists')

    const hashed = await bcrypt.hash(password, 10)
    return this.prisma.adminUser.create({
      data: { email, password: hashed, role, tenant_id: tenant_id ?? null },
      select: { id: true, email: true, role: true, tenant_id: true },
    })
  }
}