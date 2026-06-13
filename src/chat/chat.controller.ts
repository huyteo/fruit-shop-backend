import { Controller, Post, Get, Delete, Body, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import type { UserPayload } from '../common/decorators/get-user.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('message')
  async sendMessage(
    @GetUser() user: UserPayload,
    @Body('message') message: string,
    @Body('imageUrl') imageUrl?: string,
  ) {
    return this.chatService.sendMessage(user.id, message, imageUrl);
  }

  @Get('history')
  async getHistory(@GetUser() user: UserPayload) {
    return this.chatService.getChatHistory(user.id);
  }

  @Delete('history')
  async clearHistory(@GetUser() user: UserPayload) {
    return this.chatService.clearHistory(user.id);
  }
}
