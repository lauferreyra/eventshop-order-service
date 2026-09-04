import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { randomUUID } from 'crypto';

import { PrismaService } from './prisma/prisma.service.js';
import { RabbitmqService } from './rabbitmq/rabbitmq.service.js';
import { RateLimit } from './rate-limit/rate-limit.decorator.js';
import { RateLimitGuard } from './rate-limit/rate-limit.guard.js';

@Controller()
export class AppController {
  constructor(
    private readonly rabbitmqService: RabbitmqService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('orders')
  @UseGuards(RateLimitGuard)
  @RateLimit({
    limit: 5,
    windowSeconds: 60,
    identifier: 'ip',
  })
  async createOrder(
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

    await this.prisma.order.create({
      data: order,
    });

    this.rabbitmqService.publish(
      'order.created',
      order,
      correlationId,
    );

    return order;
  }

  @Get('orders/:id')
  async getOrder(
    @Param('id') id: string,
  ) {
    const order =
      await this.prisma.order.findUnique({
        where: {
          id,
        },
      });

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    return order;
  }
}