import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
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
  async getFeatured() {
    const reviews = await this.reviewsRepository.find({
      where: { rating: MoreThanOrEqual(4) },
      relations: ['user'],
      select: {
        user: { id: true, name: true, avatar: true },
      },
      order: { createdAt: 'DESC' },
      take: 3,
    });

    return reviews.map((r) => ({
      name: r.user?.name || 'Khách hàng',
      role: 'Khách hàng đã mua hàng',
      content: r.comment || '',
      rating: r.rating,
      tag: 'Đã mua hàng',
      avatar: r.user?.avatar || null,
    }));
  }

  async getStats() {
    const all = await this.reviewsRepository.find({
      select: { id: true, rating: true },
    });
    const total = all.length;

    if (total === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { '5': 0, '4': 0, '3': 0, '1-2': 0 },
      };
    }

    const sum = all.reduce((acc, r) => acc + r.rating, 0);
    const average = parseFloat((sum / total).toFixed(1));

    const count5 = all.filter((r) => r.rating === 5).length;
    const count4 = all.filter((r) => r.rating === 4).length;
    const count3 = all.filter((r) => r.rating === 3).length;
    const count12 = all.filter((r) => r.rating <= 2).length;

    const pct = (n: number) => Math.round((n / total) * 100);

    return {
      average,
      total,
      distribution: {
        '5': pct(count5),
        '4': pct(count4),
        '3': pct(count3),
        '1-2': pct(count12),
      },
    };
  }
}
