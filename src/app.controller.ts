import {
  Body,
  Controller,
  Post,
  UseGuards
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
    private readonly rabbitmqService:
      RabbitmqService,
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
  ) {

    /*
     * Creamos nuestra orden.
     *
     * Este ID identifica a la ORDEN,
     * no al evento RabbitMQ.
     */

    const order = {
      id:
        randomUUID(),

      eventName:
        body.eventName,

      email:
        body.email,

      quantity:
        body.quantity,

      status:
        'PENDING',
    };


    /*
     * Publicamos order.created.
     *
     * RabbitmqService se encarga
     * de construir el EventEnvelope.
     */

    this.rabbitmqService.publish(
      'order.created',

      order,
    );


    /*
     * La API devuelve la orden.
     */

    return order;
  }
}