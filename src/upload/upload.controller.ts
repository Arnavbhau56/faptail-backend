import { Controller, Post, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'

@Controller('upload')
export class UploadController {
  @Post('logo')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage()
  }))
  uploadLogo(@UploadedFile() file: any) {
    const base64 = file.buffer.toString('base64')
    const dataUrl = `data:${file.mimetype};base64,${base64}`
    return { url: dataUrl }
  }

  @Post('hero')
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: memoryStorage()
  }))
  uploadHero(@UploadedFiles() files: any[]) {
    const urls = files.map(file => {
      const base64 = file.buffer.toString('base64')
      return `data:${file.mimetype};base64,${base64}`
    })
    return { urls }
  }
}
