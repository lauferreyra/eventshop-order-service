import {
  Body,
  Controller,
  Inject,
  Post,
} from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(
    @Inject('RABBITMQ_SERVICE')
    private readonly rabbitClient: ClientProxy,
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
      id: crypto.randomUUID(),
      eventName: body.eventName,
      email: body.email,
      quantity: body.quantity,
      status: 'PENDING',
    };

    this.rabbitClient.emit('order.created', order);

    return order;
  }
}