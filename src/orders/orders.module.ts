import { Module, forwardRef } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { CreditsModule } from '../credits/credits.module'
import { InvoicesModule } from '../invoices/invoices.module'

@Module({
  imports: [CreditsModule, forwardRef(() => InvoicesModule)],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}