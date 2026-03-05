import { Controller, Get, Patch, Body, Req } from '@nestjs/common'
import { TenantService } from './tenant.service'
import type { TenantRequest } from './tenant.middleware'

@Controller('tenant')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  // GET /tenant/config — frontend calls this on load
  @Get('config')
  getConfig(@Req() req: TenantRequest) {
    return this.tenantService.getConfig(req.tenant.id)
  }

  // PATCH /tenant/toggle — admin opens/closes kitchen
  @Patch('toggle')
  toggleOpen(@Req() req: TenantRequest, @Body() body: { is_open: boolean }) {
    return this.tenantService.toggleOpen(req.tenant.id, body.is_open)
  }

  // PATCH /tenant/update — admin updates store information
  @Patch('update')
  updateInfo(@Req() req: TenantRequest, @Body() body: {
    name?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    gst_number?: string
    logo_url?: string
    hero_images?: string[]
  }) {
    return this.tenantService.updateInfo(req.tenant.id, body)
  }
}