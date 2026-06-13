import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1, { message: 'Đánh giá tối thiểu 1 sao' })
  @Max(5, { message: 'Đánh giá tối đa 5 sao' })
  rating: number;

  @ApiProperty({
    example: 'Trái cây tươi ngon, giao hàng nhanh',
    required: false,
  })
  @IsOptional()
  comment?: string;
}
