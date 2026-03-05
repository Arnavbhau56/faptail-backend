import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { TenantModule } from './tenant/tenant.module'
import { TenantMiddleware } from './tenant/tenant.middleware'
import { ProductsModule } from './products/products.module'
import { OrdersModule } from './orders/orders.module'
import { InvoicesModule } from './invoices/invoices.module'
import { CreditsModule } from './credits/credits.module'
import { SuperAdminModule } from './superadmin/superadmin.module'
import { AuthModule } from './auth/auth.module'
import { UploadModule } from './upload/upload.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PrismaModule,
    TenantModule,
    ProductsModule,
    OrdersModule,
    InvoicesModule,
    CreditsModule,
    SuperAdminModule,
    UploadModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'auth/admin-login', method: RequestMethod.POST },
        { path: 'auth/create-admin', method: RequestMethod.POST },
        { path: 'superadmin/(.*)', method: RequestMethod.ALL },
        { path: 'credits/all', method: RequestMethod.GET },
        { path: 'credits/topup', method: RequestMethod.POST },
        { path: 'credits/rate', method: RequestMethod.PATCH },
        { path: 'upload/(.*)', method: RequestMethod.ALL },
        { path: 'uploads/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('*')
  }
}
