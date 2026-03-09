import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: 'confirmed',
    enum: ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'],
  })
  @IsEnum(['pending', 'confirmed', 'shipping', 'completed', 'cancelled'], {
    message: 'Trạng thái đơn hàng không hợp lệ',
  })
  status: string;
}
