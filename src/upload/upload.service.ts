import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, extname } from 'path';

@Injectable()
export class UploadService {
  private readonly uploadPath = join(process.cwd(), 'uploads');

  constructor() {
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  handleUpload(file: Express.Multer.File): { url: string; filename: string } {
    if (!file) {
      throw new BadRequestException('Không có file nào được upload');
    }

    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
    };
  }

  handleMultipleUpload(
    files: Express.Multer.File[],
  ): { url: string; filename: string }[] {
    if (!files || files.length === 0) {
      throw new BadRequestException('Không có file nào được upload');
    }

    return files.map((file) => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
    }));
  }

  deleteFile(filename: string): { message: string } {
    const filePath = join(this.uploadPath, filename);

    if (existsSync(filePath)) {
      unlinkSync(filePath);
      return { message: 'Xóa file thành công' };
    }

    throw new BadRequestException('File không tồn tại');
  }

  static imageFileFilter(
    _req: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ): void {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return callback(
        new BadRequestException(
          'Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)',
        ),
        false,
      );
    }

    callback(null, true);
  }

  static generateFilename(
    _req: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void,
  ): void {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname).toLowerCase();
    callback(null, `${uniqueSuffix}${ext}`);
  }
}
