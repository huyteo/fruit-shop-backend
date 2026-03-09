import {
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: '123 Đường ABC, Quận 1, TP.HCM' })
  @IsNotEmpty({ message: 'Địa chỉ giao hàng không được để trống' })
  shippingAddress: string;

  @ApiProperty({ example: '0901234567' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  shippingPhone: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  receiverName: string;

  @ApiProperty({ example: 'cod', enum: ['cod', 'banking'] })
  @IsEnum(['cod', 'banking'], {
    message: 'Phương thức thanh toán không hợp lệ',
  })
  paymentMethod: string;

  @ApiProperty({ example: 'Giao buổi sáng', required: false })
  @IsOptional()
  note?: string;

  @ApiProperty({
    type: [OrderItemDto],
    example: [
      { productId: 1, quantity: 2 },
      { productId: 3, quantity: 1 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
