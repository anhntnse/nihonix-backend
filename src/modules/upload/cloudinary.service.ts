import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('cloudinary.cloudName'),
      api_key: this.configService.get('cloudinary.apiKey'),
      api_secret: this.configService.get('cloudinary.apiSecret'),
      secure: true,
    });
  }

  /**
   * Upload image from buffer
   * @param file - Express.Multer.File
   * @param folder - Cloudinary folder path
   * @param publicId - Optional public_id for the image
   */
  async uploadImage(
    file: Express.Multer.File,
    folder?: string,
    publicId?: string,
  ): Promise<UploadApiResponse> {
    const uploadFolder = folder || this.configService.get('cloudinary.uploadFolder') || 'nihonix';
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must not exceed 10MB');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: uploadFolder,
          public_id: publicId,
          resource_type: 'image',
          transformation: [
            { width: 1000, height: 1000, crop: 'limit' }, // Max dimensions
            { quality: 'auto' }, // Auto quality optimization
            { fetch_format: 'auto' }, 
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result as UploadApiResponse);
          }
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async uploadAvatar(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadApiResponse> {
    const buffer = file.buffer;
    const jpeg = buffer?.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const png = buffer?.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const webp = buffer?.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    if (!jpeg && !png && !webp) throw new BadRequestException('Choose a JPEG, PNG or WebP image');
    const baseFolder = this.configService.get('cloudinary.uploadFolder') || 'nihonix';
    const avatarFolder = `${baseFolder}/avatars`;
    
    return this.uploadImage(
      file,
      avatarFolder,
      `avatar_${userId}`, 
    );
  }

  async deleteAvatar(userId: string) {
    const baseFolder = this.configService.get('cloudinary.uploadFolder') || 'nihonix';
    await this.deleteImage(baseFolder + '/avatars/avatar_' + userId);
  }

  async deleteImage(publicId: string): Promise<any> {
    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw new BadRequestException('Failed to delete image');
    }
  }

  getOptimizedUrl(
    publicId: string,
    width?: number,
    height?: number,
  ): string {
    return cloudinary.url(publicId, {
      transformation: [
        { width: width || 500, height: height || 500, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
      secure: true,
    });
  }
}
