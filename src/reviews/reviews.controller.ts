import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

interface RequestWithUser {
  user: { id: number; email: string; role: string };
}

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo đánh giá (Khách hàng)' })
  create(
    @Request() req: RequestWithUser,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(req.user.id, createReviewDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả đánh giá (Admin)' })
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get('featured')
  @ApiOperation({ summary: 'Lấy đánh giá nổi bật (Trang chủ - Public)' })
  getFeatured() {
    return this.reviewsService.getFeatured();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê đánh giá (Trang chủ - Public)' })
  getStats() {
    return this.reviewsService.getStats();
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Lấy đánh giá theo sản phẩm' })
  findByProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.reviewsService.findByProduct(productId);
  }

  @Get('product/:productId/average')
  @ApiOperation({ summary: 'Đánh giá trung bình của sản phẩm' })
  getAverageRating(@Param('productId', ParseIntPipe) productId: number) {
    return this.reviewsService.getAverageRating(productId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa đánh giá (Admin)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.remove(id);
  }
}
