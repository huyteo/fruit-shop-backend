import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }): Promise<User> {
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = this.usersRepository.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      phone: userData.phone,
      address: userData.address,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async toggleActive(id: number): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    user.isActive = !user.isActive;
    return this.usersRepository.save(user);
  }
}
