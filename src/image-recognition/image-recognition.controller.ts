import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ImageRecognitionService } from './image-recognition.service';

@ApiTags('Image Recognition')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('image-recognition')
export class ImageRecognitionController {
  constructor(private readonly service: ImageRecognitionService) {}

  @Post('predict')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async predict(@UploadedFile() file: Express.Multer.File): Promise<any> {
    return this.service.recognizeFruit(file.buffer, file.mimetype);
  }
}
