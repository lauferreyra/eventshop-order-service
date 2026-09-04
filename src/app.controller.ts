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

import {
  Ctx,
  EventPattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';

import { randomUUID } from 'crypto';

import { PrismaService } from './prisma/prisma.service.js';

import { RabbitmqService } from './rabbitmq/rabbitmq.service.js';

import { RateLimit } from './rate-limit/rate-limit.decorator.js';

import { RateLimitGuard } from './rate-limit/rate-limit.guard.js';

import type {
  InventoryRejectedEnvelope,
  InventoryReservedEnvelope,
  PaymentCompletedEnvelope,
  PaymentFailedEnvelope,
} from './events/events.js';

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

  @EventPattern('inventory.reserved')
async handleInventoryReserved(
  @Payload()
  event: InventoryReservedEnvelope,

  @Ctx()
  context: any,
) {
  const channel =
    context.getChannelRef();

  const message =
    context.getMessage();

    try {
      console.log(
        '🎟️ Order Service recibió inventory.reserved',
      );

      const order =
        await this.prisma.order.findUnique({
          where: {
            id: event.data.orderId,
          },
        });

      if (!order) {
        console.error(
          '❌ Orden no encontrada:',
          event.data.orderId,
        );

        channel.ack(message);

        return;
      }

      if (
        order.status !== 'PENDING'
      ) {
        console.log(
          '♻️ Orden ya procesada:',
          order.id,
          order.status,
        );

        channel.ack(message);

        return;
      }

      await this.prisma.order.update({
        where: {
          id: order.id,
        },

        data: {
          status: 'RESERVED',
        },
      });

      console.log(
        '✅ Orden actualizada a RESERVED:',
        order.id,
      );

      channel.ack(message);
    } catch (error) {
      console.error(
        '❌ Error procesando inventory.reserved',
        error,
      );

      channel.nack(
        message,
        false,
        false,
      );
    }
  }

 @EventPattern('inventory.rejected')
async handleInventoryRejected(
  @Payload()
  event: InventoryRejectedEnvelope,

  @Ctx()
  context: any,
) {
  const channel =
    context.getChannelRef();

  const message =
    context.getMessage();

    try {
      console.log(
        '❌ Order Service recibió inventory.rejected',
      );

      const order =
        await this.prisma.order.findUnique({
          where: {
            id: event.data.orderId,
          },
        });

      if (!order) {
        console.error(
          '❌ Orden no encontrada:',
          event.data.orderId,
        );

        channel.ack(message);

        return;
      }

      if (
        order.status === 'FAILED'
      ) {
        console.log(
          '♻️ Orden ya marcada como FAILED:',
          order.id,
        );

        channel.ack(message);

        return;
      }

      await this.prisma.order.update({
        where: {
          id: order.id,
        },

        data: {
          status: 'FAILED',
        },
      });

      console.log(
        '❌ Orden actualizada a FAILED:',
        order.id,
      );

      channel.ack(message);
    } catch (error) {
      console.error(
        '❌ Error procesando inventory.rejected',
        error,
      );

      channel.nack(
        message,
        false,
        false,
      );
    }
  }

  @EventPattern('payment.completed')
async handlePaymentCompleted(
  @Payload()
  event: PaymentCompletedEnvelope,

  @Ctx()
  context: any,
) {
  const rmqContext =
    context as RmqContext;

  const channel =
    rmqContext.getChannelRef();

  const message =
    rmqContext.getMessage();

  try {
    console.log(
      '💳 Order Service recibió payment.completed',
    );

    const order =
      await this.prisma.order.findUnique({
        where: {
          id: event.data.orderId,
        },
      });

    if (!order) {
      console.error(
        '❌ Orden no encontrada:',
        event.data.orderId,
      );

      channel.ack(message);

      return;
    }

    if (order.status !== 'RESERVED') {
      console.log(
        '♻️ Orden no está en RESERVED:',
        order.id,
        order.status,
      );

      channel.ack(message);

      return;
    }

    await this.prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        status: 'COMPLETED',
      },
    });

    console.log(
      '✅ Orden actualizada a COMPLETED:',
      order.id,
    );

    channel.ack(message);
  } catch (error) {
    console.error(
      '❌ Error procesando payment.completed',
      error,
    );

    channel.nack(
      message,
      false,
      false,
    );
  }
}

@EventPattern('payment.failed')
async handlePaymentFailed(
  @Payload()
  event: PaymentFailedEnvelope,

  @Ctx()
  context: any,
) {
  const rmqContext =
    context as RmqContext;

  const channel =
    rmqContext.getChannelRef();

  const message =
    rmqContext.getMessage();

  try {
    console.log(
      '❌ Order Service recibió payment.failed',
    );

    const order =
      await this.prisma.order.findUnique({
        where: {
          id: event.data.orderId,
        },
      });

    if (!order) {
      console.error(
        '❌ Orden no encontrada:',
        event.data.orderId,
      );

      channel.ack(message);

      return;
    }

    if (order.status === 'FAILED') {
      console.log(
        '♻️ Orden ya marcada como FAILED:',
        order.id,
      );

      channel.ack(message);

      return;
    }

    await this.prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        status: 'FAILED',
      },
    });

    console.log(
      '❌ Orden actualizada a FAILED:',
      order.id,
      'Motivo:',
      event.data.reason,
    );

    channel.ack(message);
  } catch (error) {
    console.error(
      '❌ Error procesando payment.failed',
      error,
    );

    channel.nack(
      message,
      false,
      false,
    );
  }
}
}