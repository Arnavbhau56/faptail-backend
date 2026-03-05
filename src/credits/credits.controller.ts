import { Controller, Get, Post, Patch, Body, Param, Req } from '@nestjs/common'
import { CreditsService } from './credits.service'
import type { TenantRequest } from '../tenant/tenant.middleware'

@Controller('credits')
export class CreditsController {
  constructor(private creditsService: CreditsService) {}

  // GET /credits — admin sees their own balance + history
  @Get()
  getBalance(@Req() req: TenantRequest) {
    return this.creditsService.getBalance(req.tenant.id)
  }

  // POST /credits/topup — superadmin adds credits to a tenant
  @Post('topup')
  topup(@Body() body: { tenant_id: string; amount: number; note?: string }) {
    return this.creditsService.topupCredits(body.tenant_id, body.amount, body.note)
  }

  // GET /credits/all — superadmin sees all tenant balances
  @Get('all')
  getAllBalances() {
    return this.creditsService.getAllBalances()
  }

  // PATCH /credits/rate — superadmin updates credit per order rate
  @Patch('rate')
  updateRate(@Body() body: { tenant_id: string; credit_per_order: number }) {
    return this.creditsService.updateRate(body.tenant_id, body.credit_per_order)
  }
}