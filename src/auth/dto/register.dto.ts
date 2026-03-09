import { IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Hà Khắc Huy' })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ example: '123456' })
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password: string;

  @ApiProperty({ example: '0376410304', required: false })
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '123 Đường ABC, Quận 1, TP.HCM', required: false })
  @IsOptional()
  address?: string;
}
