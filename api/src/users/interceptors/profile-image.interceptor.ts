import {
  FileInterceptor
} from '@nestjs/platform-express'
import { BadRequestException } from '@nestjs/common'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export const ProfileImageInterceptor = FileInterceptor('profileImage', {
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new BadRequestException('Apenas arquivos de imagem são permitidos (jpg, png, webp)'), false)
    }
  },
})
