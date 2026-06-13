import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { OrdersService } from '../orders/orders.service';
import { AuthGuard } from '@nestjs/passport';
import type {
  MomoCreateResponse,
  MomoIpnPayload,
  CreatePaymentDto,
} from './payment.types';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly ordersService: OrdersService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('momo/create')
  async create(@Body() dto: CreatePaymentDto) {
    const result: MomoCreateResponse =
      await this.paymentService.createMomoPayment(dto);
    return {
      payUrl: result.payUrl,
      deeplink: result.deeplink,
      qrCodeUrl: result.qrCodeUrl,
    };
  }

  @Post('momo/ipn')
  @HttpCode(204)
  async ipn(@Body() payload: MomoIpnPayload) {
    console.log('🔔 IPN nhận được từ MoMo:', payload);

    if (!this.paymentService.verifyIpnSignature(payload)) {
      return;
    }

    const realOrderId = Number(payload.orderId.split('-')[0]);

    try {
      if (payload.resultCode === 0) {
        await this.ordersService.updateStatus(realOrderId, {
          status: 'confirmed',
        });
      } else {
        await this.ordersService.updateStatus(realOrderId, {
          status: 'cancelled',
        });
      }
    } catch {
      // Nuốt lỗi state machine để MoMo không retry liên tục
    }

    return;
  }
}
