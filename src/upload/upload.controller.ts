import { Controller, Post, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'

@Controller('upload')
export class UploadController {
  @Post('logo')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/logos',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, `logo-${uniqueSuffix}${extname(file.originalname)}`)
      }
    })
  }))
  uploadLogo(@UploadedFile() file: any) {
    return { url: `/uploads/logos/${file.filename}` }
  }

  @Post('hero')
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: diskStorage({
      destination: './uploads/hero',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, `hero-${uniqueSuffix}${extname(file.originalname)}`)
      }
    })
  }))
  uploadHero(@UploadedFiles() files: any[]) {
    const urls = files.map(file => `/uploads/hero/${file.filename}`)
    return { urls }
  }
}
