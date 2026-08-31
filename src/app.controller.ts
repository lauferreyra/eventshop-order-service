import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { RabbitmqService } from './rabbitmq/rabbitmq.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  @Post('orders')
  createOrder(
    @Body()
    body: {
      eventName: string;
      email: string;
      quantity: number;
    },
  ) {
    const order = {
      id: randomUUID(),
      eventName: body.eventName,
      email: body.email,
      quantity: body.quantity,
      status: 'PENDING',
    };

    this.rabbitmqService.publish(
      'order.created',
      order,
    );

    return order;
  }
}