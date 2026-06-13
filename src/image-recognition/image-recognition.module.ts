import { Module } from '@nestjs/common';
import { ImageRecognitionController } from './image-recognition.controller';
import { ImageRecognitionService } from './image-recognition.service';

@Module({
  controllers: [ImageRecognitionController],
  providers: [ImageRecognitionService],
})
export class ImageRecognitionModule {}
