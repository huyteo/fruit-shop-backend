import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
  ) {}

  async create(
    userId: number,
    createReviewDto: CreateReviewDto,
  ): Promise<Review> {
    const existingReview = await this.reviewsRepository.findOne({
      where: {
        userId: userId,
        productId: createReviewDto.productId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('Bạn đã đánh giá sản phẩm này rồi');
    }

    const review = this.reviewsRepository.create({
      userId: userId,
      productId: createReviewDto.productId,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
    });

    return this.reviewsRepository.save(review);
  }

  async findAll(): Promise<Review[]> {
    return this.reviewsRepository.find({
      relations: ['user', 'product'],
      select: {
        user: {
          id: true,
          name: true,
          email: true,
        },
        product: {
          id: true,
          name: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByProduct(productId: number): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { productId },
      relations: ['user'],
      select: {
        user: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    await this.reviewsRepository.remove(review);
    return { message: 'Xóa đánh giá thành công' };
  }

  async getAverageRating(
    productId: number,
  ): Promise<{ average: number; total: number }> {
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .addSelect('COUNT(review.id)', 'total')
      .where('review.product_id = :productId', { productId })
      .getRawOne<{ average: string | null; total: string }>();

    return {
      average: result ? parseFloat(Number(result.average).toFixed(1)) : 0,
      total: result ? parseInt(result.total, 10) : 0,
    };
  }
}
