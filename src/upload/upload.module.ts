import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { UploadController } from './upload.controller'
import { UploadsController } from './uploads.controller'

@Module({
  imports: [MulterModule.register({ dest: './uploads' })],
  controllers: [UploadController, UploadsController]
})
export class UploadModule {}
