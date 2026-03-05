import { Module } from '@nestjs/common'
import { CreditsService } from './credits.service'
import { CreditsController } from './credits.controller'

@Module({
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService],  // exported so OrdersModule can use it
})
export class CreditsModule {}