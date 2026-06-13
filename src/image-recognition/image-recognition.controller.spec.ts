import { Test, TestingModule } from '@nestjs/testing';
import { ImageRecognitionController } from './image-recognition.controller';

describe('ImageRecognitionController', () => {
  let controller: ImageRecognitionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImageRecognitionController],
    }).compile();

    controller = module.get<ImageRecognitionController>(ImageRecognitionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
