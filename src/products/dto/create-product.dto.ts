import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 1 })
  @IsNumber({}, { message: 'Category ID phải là số' })
  categoryId: number;

  @ApiProperty({ example: 'Xoài cát Hòa Lộc' })
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  name: string;

  @ApiProperty({ example: 'Xoài cát Hòa Lộc loại 1, ngọt thanh, thơm đậm' })
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  description: string;

  @ApiProperty({ example: 85000 })
  @IsNumber({}, { message: 'Giá phải là số' })
  price: number;

  @ApiProperty({ example: 'xoai-hoa-loc.jpg', required: false })
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({
    example: ['xoai-1.jpg', 'xoai-2.jpg', 'xoai-3.jpg'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiProperty({ example: 100 })
  @IsNumber({}, { message: 'Số lượng tồn kho phải là số' })
  stock: number;

  @ApiProperty({ example: 'kg' })
  @IsNotEmpty({ message: 'Đơn vị tính không được để trống' })
  unit: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}
