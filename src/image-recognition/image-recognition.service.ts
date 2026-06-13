import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';

interface PredictResponse {
  success: boolean;
  is_fruit: boolean;
  fruit: string | null;
  fruit_en: string | null;
  confidence: number;
  top3: { name_en: string; name_vi: string; confidence: number }[];
  message: string;
}

@Injectable()
export class ImageRecognitionService {
  private readonly AI_URL =
    process.env.AI_SERVER_URL || 'http://localhost:8000';

  async recognizeFruit(
    fileBuffer: Buffer,
    mimetype: string,
  ): Promise<PredictResponse> {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: 'image.jpg',
        contentType: mimetype,
      });

      const response: AxiosResponse<PredictResponse> = await axios.post(
        `${this.AI_URL}/predict`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 30000,
        },
      );

      return response.data;
    } catch (error) {
      if (
        error instanceof Error &&
        (error as NodeJS.ErrnoException).code === 'ECONNREFUSED'
      ) {
        throw new HttpException(
          'AI Server chưa khởi động',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw new HttpException(
        'Lỗi nhận diện ảnh',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
