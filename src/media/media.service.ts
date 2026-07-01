import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { envs } from '../config/envs';
import { buildCloudinaryUploadPath, type MediaUploadKind } from './media-path.util';

export type { MediaUploadKind };

export interface UploadedMediaResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
}

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger(MediaService.name);
  private configured = false;

  onModuleInit() {
    const { cloudName, apiKey, apiSecret } = envs.cloudinary;
    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn(
        'Cloudinary no configurado (CLOUDINARY_*). POST /api/media/upload no estará disponible.',
      );
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    this.configured = true;
    this.logger.log(`Cloudinary listo (cloud: ${cloudName}).`);
  }

  async uploadImage(
    file: { buffer: Buffer; mimetype: string; originalname?: string },
    kind: MediaUploadKind,
    userId: string,
  ): Promise<UploadedMediaResult> {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Almacenamiento de imágenes no configurado. Define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.',
      );
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        'Formato no soportado. Use JPEG, PNG o WebP.',
      );
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.buffer.length > maxBytes) {
      throw new BadRequestException('La imagen no puede superar 5 MB.');
    }

    const uploadPath = buildCloudinaryUploadPath(
      envs.cloudinaryFolder,
      kind,
      userId,
    );

    const result = await new Promise<UploadedMediaResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: uploadPath.folder,
          public_id: uploadPath.publicId,
          resource_type: 'image',
          tags: uploadPath.tags,
          context: uploadPath.context,
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error('Upload fallido'));
            return;
          }
          resolve({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            width: uploadResult.width,
            height: uploadResult.height,
            bytes: uploadResult.bytes,
            format: uploadResult.format,
          });
        },
      );
      stream.end(file.buffer);
    }).catch((error: Error) => {
      this.logger.error(`Cloudinary upload error: ${error.message}`);
      throw new BadRequestException('No se pudo subir la imagen. Intenta de nuevo.');
    });

    this.logger.log(
      `Imagen ${uploadPath.scope}/${uploadPath.emittedDate} subida por ${userId}: ${result.publicId} (${result.bytes ?? 0} bytes)`,
    );
    return result;
  }
}
