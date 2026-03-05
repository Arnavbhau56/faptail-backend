import { Controller, Get, Param, Res } from '@nestjs/common'
import type { Response } from 'express'
import { join } from 'path'
import * as fs from 'fs'

@Controller('uploads')
export class UploadsController {
  @Get('logos/:filename')
  serveLogo(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', 'logos', filename)
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath)
    }
    return res.status(404).send('File not found')
  }

  @Get('hero/:filename')
  serveHero(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', 'hero', filename)
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath)
    }
    return res.status(404).send('File not found')
  }
}
