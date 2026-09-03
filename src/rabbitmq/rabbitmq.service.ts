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
  const rabbitmqUrl =
    process.env.RABBITMQ_URL ??
    'amqp://admin:admin@localhost:5672';

  this.connection =
    await amqp.connect(
      rabbitmqUrl,
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
    correlationId: string,
  ) {
    /*
     * Generamos el ID del evento.
     *
     * IMPORTANTE:
     *
     * eventId != correlationId
     *
     * eventId identifica ESTE evento.
     *
     * correlationId identifica TODA la operación.
     */

    const event = {
      eventId:
        randomUUID(),

      eventType,

      version: 1,

      occurredAt:
        new Date().toISOString(),

      correlationId,

      data,
    };


    /*
     * RabbitMQ recibe:
     *
     * {
     *   pattern: 'order.created',
     *
     *   data: {
     *     eventId,
     *     eventType,
     *     version,
     *     occurredAt,
     *     correlationId,
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