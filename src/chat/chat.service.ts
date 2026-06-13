import { Injectable, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import axios from 'axios';

interface AiResponse {
  response: string;
}

@Injectable()
export class ChatService {
  private readonly AI_URL = 'http://localhost:8001/chat';

  constructor(
    @InjectRepository(ChatMessage)
    private chatRepository: Repository<ChatMessage>,
  ) {}

  async sendMessage(userId: number, message: string, imageUrl?: string) {
    // Lấy lịch sử
    const history = await this.chatRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const formattedHistory = history
      .reverse()
      .filter((h) => h.role && h.content)
      .map((h) => ({
        role: h.role as string,
        content: h.content as string,
      }));

    // ✅ Lưu tin nhắn user với imageUrl
    const userMessage = this.chatRepository.create({
      userId,
      role: 'user',
      content: message,
      ...(imageUrl && { imageUrl }),
    });
    await this.chatRepository.save(userMessage);

    try {
      // Gửi request với imageUrl
      const requestData: {
        user_id: number;
        message: string;
        history: { role: string; content: string }[];
        imageUrl?: string;
      } = {
        user_id: userId,
        message,
        history: formattedHistory,
      };

      // Nếu có ảnh, thêm imageUrl vào request
      if (imageUrl) {
        // Convert relative URL to absolute URL
        const fullImageUrl = `http://192.168.100.31:3000${imageUrl}`;
        requestData.imageUrl = fullImageUrl;
      }

      const response = await axios.post<AiResponse>(this.AI_URL, requestData, {
        timeout: 60000,
      });

      const aiResponse = response.data.response;

      // Lưu tin nhắn AI (không có ảnh)
      const assistantMessage = this.chatRepository.create({
        userId,
        role: 'assistant',
        content: aiResponse,
      });
      await this.chatRepository.save(assistantMessage);

      return {
        success: true,
        userMessage: message,
        aiResponse,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('AI Server error:', errorMessage);
      throw new HttpException('AI Server không phản hồi', 500);
    }
  }

  // ✅ SỬA: Transform imageUrl sang format app cần
  async getChatHistory(userId: number) {
    const messages = await this.chatRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    // ✅ Transform imageUrl → image
    const transformed = messages.map((msg) => {
      const result = {
        id: msg.id,
        role: msg.role,
        content: msg.content,
        image: msg.imageUrl
          ? `http://192.168.100.31:3000${msg.imageUrl}`
          : null,
        createdAt: msg.createdAt,
      };
      return result;
    });

    return transformed;
  }

  async clearHistory(userId: number) {
    await this.chatRepository.delete({ userId });
    return { success: true, message: 'Đã xóa lịch sử chat' };
  }
}
