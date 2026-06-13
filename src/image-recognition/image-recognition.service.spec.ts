import { Test, TestingModule } from '@nestjs/testing';
import { ImageRecognitionService } from './image-recognition.service';

describe('ImageRecognitionService', () => {
  let service: ImageRecognitionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageRecognitionService],
    }).compile();

    service = module.get<ImageRecognitionService>(ImageRecognitionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
