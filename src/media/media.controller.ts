import {
  BadRequestException,
  Controller,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { MediaService, type MediaUploadKind } from './media.service';

@Controller('media')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @RequirePermissions('alertas:update_status', 'reportes:create')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async upload(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname?: string } | undefined,
    @Query('tipo') tipo: string | undefined,
    @Req() req: { user: { sub: string } },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Debe adjuntar una imagen (campo file)');
    }

    const kind: MediaUploadKind = tipo === 'evidencia' ? 'evidencia' : 'reporte';
    const result = await this.mediaService.uploadImage(file, kind, req.user.sub);
    return {
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
    };
  }
}
