import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  async findAll(): Promise<any[]> {
    const products = await this.productsRepository.find({
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
    return this.attachRatings(products);
  }

  async findByCategory(categoryId: number): Promise<any[]> {
    const products = await this.productsRepository.find({
      where: { categoryId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
    return this.attachRatings(products);
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    if (updateProductDto.categoryId) {
      delete (product as unknown as Record<string, unknown>).category;
    }

    Object.assign(product, updateProductDto);
    await this.productsRepository.save(product);

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
    return { message: 'Xóa sản phẩm thành công' };
  }

  async search(keyword: string): Promise<any[]> {
    const products = await this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.name LIKE :keyword', { keyword: `%${keyword}%` })
      .orderBy('product.createdAt', 'DESC')
      .getMany();
    return this.attachRatings(products);
  }

  private async attachRatings(products: Product[]): Promise<any[]> {
    if (products.length === 0) return [];

    const ids = products.map((p) => p.id);

    const ratings = await this.productsRepository
      .createQueryBuilder('product')
      .leftJoin('reviews', 'review', 'review.product_id = product.id')
      .select('product.id', 'productId')
      .addSelect('AVG(review.rating)', 'average')
      .addSelect('COUNT(review.id)', 'total')
      .where('product.id IN (:...ids)', { ids })
      .groupBy('product.id')
      .getRawMany<{
        productId: number;
        average: string | null;
        total: string;
      }>();

    const map = new Map(
      ratings.map((r) => [
        Number(r.productId),
        {
          avgRating: r.average ? parseFloat(Number(r.average).toFixed(1)) : 0,
          reviewCount: parseInt(r.total, 10) || 0,
        },
      ]),
    );

    return products.map((p) => ({
      ...p,
      avgRating: map.get(p.id)?.avgRating ?? 0,
      reviewCount: map.get(p.id)?.reviewCount ?? 0,
    }));
  }
}
