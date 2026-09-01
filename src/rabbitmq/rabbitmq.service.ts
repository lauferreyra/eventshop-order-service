import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import * as amqp from 'amqplib';

import {
  Channel,
  ChannelModel,
} from 'amqplib';

import { randomUUID } from 'crypto';

@Injectable()
export class RabbitmqService
  implements
    OnModuleInit,
    OnModuleDestroy
{
  private connection: ChannelModel;

  private channel: Channel;

  private readonly exchange =
    'eventshop.events';


  async onModuleInit() {
    this.connection =
      await amqp.connect(
        'amqp://admin:admin@localhost:5672',
      );

    this.channel =
      await this.connection.createChannel();

    await this.channel.assertExchange(
      this.exchange,
      'topic',
      {
        durable: true,
      },
    );

    console.log(
      '✅ Order Service conectado a RabbitMQ',
    );
  }


  /*
   * =====================================================
   * PUBLICAR EVENTO
   * =====================================================
   */

  publish<T>(
    eventType: string,
    data: T,
  ) {
    /*
     * Generamos el ID del evento
     * en el momento de publicarlo.
     */

    const event = {
      eventId:
        randomUUID(),

      eventType,

      version: 1,

      occurredAt:
        new Date().toISOString(),

      data,
    };


    /*
     * RabbitMQ recibe:
     *
     * {
     *   pattern: 'order.created',
     *   data: {
     *     eventId,
     *     eventType,
     *     version,
     *     occurredAt,
     *     data
     *   }
     * }
     */

    const message =
      Buffer.from(
        JSON.stringify({
          pattern: eventType,

          data: event,
        }),
      );


    this.channel.publish(
      this.exchange,

      eventType,

      message,

      {
        persistent: true,

        contentType:
          'application/json',
      },
    );
  }


  async onModuleDestroy() {
    await this.channel?.close();

    await this.connection?.close();
  }
}