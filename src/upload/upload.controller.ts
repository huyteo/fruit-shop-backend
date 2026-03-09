import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UploadService } from './upload.service';
import { extname } from 'path';

const multerOptions = {
  storage: diskStorage({
    destination: './uploads',
    filename: (
      _req: Express.Request,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void,
    ) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname).toLowerCase();
      callback(null, `${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (
    _req: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
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
  },
  limits: { fileSize: 5 * 1024 * 1024 },
};

@ApiTags('Upload')
@Controller('upload')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('single')
  @ApiOperation({ summary: 'Upload 1 ảnh (Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  uploadSingle(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.handleUpload(file);
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Upload nhiều ảnh - tối đa 5 (Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 5, multerOptions))
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.handleMultipleUpload(files);
  }

  @Delete(':filename')
  @ApiOperation({ summary: 'Xóa ảnh (Admin)' })
  deleteFile(@Param('filename') filename: string) {
    return this.uploadService.deleteFile(filename);
  }
}
