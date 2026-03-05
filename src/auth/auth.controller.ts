import { Controller, Post, Body } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AdminRole } from '@prisma/client'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('admin-login')
  adminLogin(@Body() body: { email: string; password: string }) {
    return this.authService.adminLogin(body.email, body.password)
  }

  @Post('create-admin')
  createAdmin(@Body() body: {
    email: string
    password: string
    role: AdminRole
    tenant_id?: string
  }) {
    return this.authService.createAdmin(
      body.email,
      body.password,
      body.role,
      body.tenant_id
    )
  }
}