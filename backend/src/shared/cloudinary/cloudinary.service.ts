/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Express } from 'express';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  original_filename: string;
  bytes: number;
  format: string;
  resource_type: string;
  created_at: string;
  width?: number;
  height?: number;
  folder: string;
}

export enum TriLinkUploadType {
  USER_AVATAR = 'user_avatar',
  VEHICLE_IMAGE = 'vehicle_image',
}

export interface TriLinkUploadConfig {
  uploadType: TriLinkUploadType;
  maxSizeBytes: number;
  allowedFormats: string[];
  folder: string;
  transformations?: any;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_KEY,
    });
    this.logger.log('Cloudinary service initialized successfully');
  }

  private getUploadConfig(uploadType: TriLinkUploadType): TriLinkUploadConfig {
    const configs: Record<TriLinkUploadType, TriLinkUploadConfig> = {
      [TriLinkUploadType.USER_AVATAR]: {
        uploadType: TriLinkUploadType.USER_AVATAR,
        maxSizeBytes: 2 * 1024 * 1024,
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'trilink/users/avatars',
        transformations: {
          width: 400,
          height: 400,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto',
          format: 'auto',
        },
      },
      [TriLinkUploadType.VEHICLE_IMAGE]: {
        uploadType: TriLinkUploadType.VEHICLE_IMAGE,
        maxSizeBytes: 5 * 1024 * 1024,
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'trilink/vehicles/images',
        transformations: {
          width: 800,
          height: 600,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
    };
    return configs[uploadType];
  }

  private validateFile(
    file: Express.Multer.File,
    config: TriLinkUploadConfig,
  ): void {
    if (!file) throw new BadRequestException('No file provided');

    // Log detailed file information for debugging
    this.logger.log('File validation details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer_length: file.buffer?.length,
      fieldname: file.fieldname,
      encoding: file.encoding,
    });

    // Check if buffer exists and has content
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File buffer is empty or missing');
    }

    // Check for minimum file size (typical JPEG header is at least 100+ bytes)
    // Temporarily disabled for debugging
    // if (file.size < 100) {
    //   throw new BadRequestException(
    //     `File appears to be corrupted or empty. Size: ${file.size} bytes`,
    //   );
    // }

    if (file.size > config.maxSizeBytes) {
      const maxSizeMB = (config.maxSizeBytes / (1024 * 1024)).toFixed(1);
      throw new BadRequestException(
        `File size exceeds ${maxSizeMB}MB for ${config.uploadType}`,
      );
    }

    const fileExtension = file.originalname?.split('.').pop()?.toLowerCase();
    if (!fileExtension || !config.allowedFormats.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid file format. Allowed: ${config.allowedFormats.join(', ')}`,
      );
    }

    const allowedMimeTypes = this.getMimeTypesForFormats(config.allowedFormats);
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid MIME type. Expected: ${allowedMimeTypes.join(', ')}`,
      );
    }
  }

  private getMimeTypesForFormats(formats: string[]): string[] {
    const mimeTypeMap: Record<string, string[]> = {
      jpg: ['image/jpeg'],
      jpeg: ['image/jpeg'],
      png: ['image/png'],
      webp: ['image/webp'],
    };
    return formats.flatMap((format) => mimeTypeMap[format] || []);
  }

  private generatePublicId(
    config: TriLinkUploadConfig,
    entityId?: string | number,
    entityType?: string,
  ): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    if (entityId && entityType) {
      return `${config.folder}/${entityType}/${entityId}/${config.uploadType}_${timestamp}_${randomString}`;
    }
    return `${config.folder}/${config.uploadType}_${timestamp}_${randomString}`;
  }

  async uploadAvatar(
    file: Express.Multer.File,
    userId: string,
    oldImageUrl?: string,
  ): Promise<CloudinaryUploadResult> {
    if (oldImageUrl) {
      const oldPublicId = this.extractPublicIdFromUrl(oldImageUrl);
      await this.deleteFile(oldPublicId).catch((e) =>
        this.logger.warn(`Failed to delete old avatar: ${e.message}`),
      );
    }
    return this.uploadFile(file, TriLinkUploadType.USER_AVATAR, {
      entityId: userId,
      entityType: 'user',
      tags: ['avatar', 'user'],
      context: { user_id: userId },
    });
  }

  async uploadVehicleImage(
    file: Express.Multer.File,
    vehicleId: string,
    oldImageUrl?: string,
  ): Promise<CloudinaryUploadResult> {
    if (oldImageUrl) {
      const oldPublicId = this.extractPublicIdFromUrl(oldImageUrl);
      await this.deleteFile(oldPublicId).catch((e) =>
        this.logger.warn(`Failed to delete old vehicle image: ${e.message}`),
      );
    }
    return this.uploadFile(file, TriLinkUploadType.VEHICLE_IMAGE, {
      entityId: vehicleId,
      entityType: 'vehicle',
      tags: ['vehicle', 'image'],
      context: { vehicle_id: vehicleId },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadType: TriLinkUploadType,
    options?: {
      entityId?: string | number;
      entityType?: string;
      tags?: string[];
      context?: Record<string, any>;
    },
  ): Promise<CloudinaryUploadResult> {
    const config = this.getUploadConfig(uploadType);

    // Enhanced file validation
    this.validateFile(file, config);

    // Additional buffer validation
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File buffer is empty or missing');
    }

    // Check for minimum realistic file size
    if (file.buffer.length < 100) {
      throw new BadRequestException(
        `File appears to be corrupted. Buffer size: ${file.buffer.length} bytes`,
      );
    }

    const publicId = this.generatePublicId(
      config,
      options?.entityId,
      options?.entityType,
    );

    // Log upload details for debugging
    this.logger.log(`Uploading ${uploadType} with config:`, {
      resource_type: 'image',
      public_id: publicId,
      transformations: config.transformations,
      file_size: file.size,
      file_mimetype: file.mimetype,
      buffer_size: file.buffer.length,
    });

    const uploadOptions: any = {
      public_id: publicId,
      resource_type: 'image', // Explicitly set to 'image' not 'auto'
      folder: config.folder, // Explicitly set folder
      tags: [
        uploadType,
        ...(options?.tags || []),
        ...(options?.entityType ? [options.entityType] : []),
        ...(options?.entityId
          ? [`${options.entityType}-${options.entityId}`]
          : []),
      ].filter(Boolean),
      context: {
        upload_type: uploadType,
        uploaded_at: new Date().toISOString(),
        ...(options?.context || {}),
      },
      // Force image processing
      invalidate: true,
      overwrite: false,
      unique_filename: true,
    };

    // Apply transformations
    if (config.transformations) {
      uploadOptions.transformation = config.transformations;
    }

    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      // Create buffer from file data to ensure it's properly formatted
      const bufferToUpload = Buffer.isBuffer(file.buffer)
        ? file.buffer
        : Buffer.from(file.buffer);

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: any, result: any) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`, {
              error_details: error,
              upload_options: uploadOptions,
              file_info: {
                size: file.size,
                mimetype: file.mimetype,
                buffer_length: file.buffer?.length,
                originalname: file.originalname,
              },
            });
            reject(new BadRequestException(`Upload failed: ${error.message}`));
          } else if (result) {
            this.logger.log(`Upload successful: ${result.secure_url}`);

            // Verify the URL format is correct
            if (!result.secure_url.includes('/image/upload/')) {
              this.logger.warn(`Unexpected URL format: ${result.secure_url}`);
            }

            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              url: result.url,
              original_filename: result.original_filename || file.originalname,
              bytes: result.bytes,
              format: result.format,
              resource_type: result.resource_type,
              created_at: result.created_at,
              width: result.width,
              height: result.height,
              folder: result.folder || config.folder,
            });
          } else {
            reject(
              new BadRequestException('Upload failed: No result returned'),
            );
          }
        },
      );

      // Enhanced error handling for the stream
      uploadStream.on('error', (streamError) => {
        this.logger.error('Upload stream error:', streamError);
        reject(new BadRequestException(`Stream error: ${streamError.message}`));
      });

      try {
        // Write the buffer and end the stream
        uploadStream.write(bufferToUpload);
        uploadStream.end();
      } catch (streamWriteError: any) {
        this.logger.error('Error writing to upload stream:', streamWriteError);
        reject(
          new BadRequestException(
            `Stream write error: ${streamWriteError.message}`,
          ),
        );
      }
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      this.logger.log(`Deleting file with public_id: ${publicId}`);
      const result: any = await cloudinary.uploader.destroy(publicId);
      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new BadRequestException(
          `Failed to delete file: ${result.result}`,
        );
      }
      this.logger.log(`Successfully deleted file: ${publicId}`);
    } catch (error: any) {
      this.logger.error(
        `File deletion failed: ${error?.message || 'Unknown error'}`,
      );
      throw error;
    }
  }

  extractPublicIdFromUrl(url: string): string {
    try {
      if (!url || !url.includes('cloudinary.com')) return '';
      const matches = url.match(/\/([^\/]+)\.[^\/]+$/);
      if (matches && matches[1]) return matches[1];
      const parts = url.split('/');
      const fileWithExtension = parts[parts.length - 1];
      const publicId = fileWithExtension.split('.')[0];
      const trilinkIndex = parts.indexOf('trilink');
      if (trilinkIndex !== -1) {
        const folderParts = parts.slice(trilinkIndex);
        folderParts[folderParts.length - 1] = publicId;
        return folderParts.join('/');
      }
      return publicId;
    } catch {
      this.logger.warn(`Failed to extract public_id from URL: ${url}`);
      return '';
    }
  }
}
