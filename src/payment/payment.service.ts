import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';
import {
  MomoCreateResponse,
  MomoIpnPayload,
  CreatePaymentDto,
} from './payment.types';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentService {
  private readonly partnerCode = process.env.MOMO_PARTNER_CODE!;
  private readonly accessKey = process.env.MOMO_ACCESS_KEY!;
  private readonly secretKey = process.env.MOMO_SECRET_KEY!;
  private readonly endpoint = process.env.MOMO_ENDPOINT!;
  constructor(private readonly ordersService: OrdersService) {}
  private sign(rawSignature: string): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');
  }

  async createMomoPayment(dto: CreatePaymentDto): Promise<MomoCreateResponse> {
    const { orderId, platform } = dto;

    const order = await this.ordersService.findOne(orderId);
    const amount = Number(order.totalAmount);
    const momoOrderId = `${orderId}-${Date.now()}`;
    const requestId = momoOrderId;
    const orderInfo = `Thanh toan don hang Halona Fruits #${orderId}`;
    const requestType = 'captureWallet';
    const extraData = '';

    const redirectUrl =
      platform === 'app'
        ? 'halonafruits://payment-result'
        : process.env.MOMO_REDIRECT_URL!;
    const ipnUrl = process.env.MOMO_IPN_URL!;

    const rawSignature =
      `accessKey=${this.accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${momoOrderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${this.partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = this.sign(rawSignature);

    const body = {
      partnerCode: this.partnerCode,
      partnerName: 'Halona Fruits',
      storeId: 'HalonaStore',
      requestId,
      amount: String(amount),
      orderId: momoOrderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      requestType,
      autoCapture: true,
      extraData,
      signature,
    };

    try {
      // Ép kiểu generic cho axios để không còn 'unknown'
      const { data } = await axios.post<MomoCreateResponse>(
        this.endpoint,
        body,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        },
      );
      return data;
    } catch {
      throw new BadRequestException('Không tạo được thanh toán MoMo');
    }
  }

  verifyIpnSignature(payload: MomoIpnPayload): boolean {
    const raw =
      `accessKey=${this.accessKey}` +
      `&amount=${payload.amount}` +
      `&extraData=${payload.extraData}` +
      `&message=${payload.message}` +
      `&orderId=${payload.orderId}` +
      `&orderInfo=${payload.orderInfo}` +
      `&orderType=${payload.orderType}` +
      `&partnerCode=${payload.partnerCode}` +
      `&payType=${payload.payType}` +
      `&requestId=${payload.requestId}` +
      `&responseTime=${payload.responseTime}` +
      `&resultCode=${payload.resultCode}` +
      `&transId=${payload.transId}`;
    return this.sign(raw) === payload.signature;
  }
}
