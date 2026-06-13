import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  private uploadToCloudinary(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'halona' },
        (error, result) => {
          if (error) {
            return reject(
              new Error(error.message || 'Cloudinary upload error'),
            );
          }
          if (!result) return reject(new Error('Upload thất bại'));
          resolve(result);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async handleUpload(
    file: Express.Multer.File,
  ): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('Không có file nào được upload');
    }
    const result = await this.uploadToCloudinary(file);
    return {
      url: result.secure_url, // URL Cloudinary đầy đủ (https://res.cloudinary.com/...)
      filename: result.public_id,
    };
  }

  async handleMultipleUpload(
    files: Express.Multer.File[],
  ): Promise<{ url: string; filename: string }[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Không có file nào được upload');
    }
    const results = await Promise.all(
      files.map((file) => this.uploadToCloudinary(file)),
    );
    return results.map((result) => ({
      url: result.secure_url,
      filename: result.public_id,
    }));
  }

  async deleteFile(filename: string): Promise<{ message: string }> {
    // filename giờ là public_id của Cloudinary
    await cloudinary.uploader.destroy(filename);
    return { message: 'Xóa file thành công' };
  }
}
