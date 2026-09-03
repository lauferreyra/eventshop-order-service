import {
  Body,
  Controller,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';

import { randomUUID } from 'crypto';

import {
  RabbitmqService,
} from './rabbitmq/rabbitmq.service.js';

import { RateLimit } from './rate-limit/rate-limit.decorator.js';
import { RateLimitGuard } from './rate-limit/rate-limit.guard.js';

@Controller()
export class AppController {
  constructor(
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  @Post('orders')
  @UseGuards(RateLimitGuard)
  @RateLimit({
    limit: 5,
    windowSeconds: 60,
    identifier: 'ip',
  })
  createOrder(
    @Body()
    body: {
      eventName: string;
      email: string;
      quantity: number;
    },

    @Headers('X-Correlation-ID')
    correlationId: string,
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
      correlationId,
    );

    return order;
  }
}