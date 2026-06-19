import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,

    private productsService: ProductsService,
  ) {}

  async create(userId: number, createOrderDto: CreateOrderDto): Promise<Order> {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    const orderItems: Partial<OrderItem>[] = [];
    let totalAmount = 0;

    for (const item of createOrderDto.items) {
      const product = await this.productsService.findOne(item.productId);

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Sản phẩm "${product.name}" chỉ còn ${product.stock} ${product.unit}`,
        );
      }

      const subtotal = Number(product.price) * item.quantity;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productPrice: Number(product.price),
        quantity: item.quantity,
        subtotal: subtotal,
      });

      totalAmount += subtotal;
    }

    const SHIPPING_FEE = 20000;
    totalAmount += SHIPPING_FEE;

    const order = this.ordersRepository.create({
      userId: userId,
      shippingAddress: createOrderDto.shippingAddress,
      shippingPhone: createOrderDto.shippingPhone,
      receiverName: createOrderDto.receiverName,
      paymentMethod: createOrderDto.paymentMethod,
      note: createOrderDto.note,
      totalAmount: totalAmount,
      items: orderItems as OrderItem[],
    });

    const savedOrder = await this.ordersRepository.save(order);

    for (const item of createOrderDto.items) {
      const product = await this.productsService.findOne(item.productId);
      product.stock -= item.quantity;
      await this.productsService.update(product.id, {
        stock: product.stock,
      });
    }

    return this.findOne(savedOrder.id);
  }

  async findAll(): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: ['user', 'items'],
      order: { createdAt: 'DESC' },
      select: {
        user: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    });
  }

  async findByUser(userId: number): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'items'],
      select: {
        user: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return order;
  }

  async updateStatus(
    id: number,
    updateStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.findOne(id);

    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['shipping', 'cancelled'],
      shipping: ['completed'],
      completed: [],
      cancelled: [],
    };

    const allowedStatuses = validTransitions[order.status];
    if (!allowedStatuses.includes(updateStatusDto.status)) {
      throw new BadRequestException(
        `Không thể chuyển từ "${order.status}" sang "${updateStatusDto.status}"`,
      );
    }

    if (updateStatusDto.status === 'cancelled') {
      for (const item of order.items) {
        const product = await this.productsService.findOne(item.productId);
        product.stock += item.quantity;
        await this.productsService.update(product.id, {
          stock: product.stock,
        });
      }
    }

    order.status = updateStatusDto.status;
    return this.ordersRepository.save(order);
  }

  async getStatistics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    ordersByStatus: Record<string, number>;
  }> {
    const orders = await this.ordersRepository.find();

    const totalOrders = orders.length;

    const totalRevenue = orders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    const ordersByStatus: Record<string, number> = {};
    orders.forEach((o) => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    });

    return { totalOrders, totalRevenue, ordersByStatus };
  }
}
