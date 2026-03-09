import { IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Trái cây nhiệt đới' })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  name: string;

  @ApiProperty({ example: 'Các loại trái cây vùng nhiệt đới', required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'tropical.jpg', required: false })
  @IsOptional()
  image?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
