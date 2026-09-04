import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import * as amqp from 'amqplib';

import {
  ChannelModel,
  ConfirmChannel,
} from 'amqplib';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RabbitmqOutboxService
  implements OnModuleInit, OnModuleDestroy
{
  private connection: ChannelModel;

  private channel: ConfirmChannel;

  private readonly exchange =
    'eventshop.events';

  private interval:
    NodeJS.Timeout | undefined;

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const rabbitmqUrl =
      process.env.RABBITMQ_URL ??
      'amqp://admin:admin@localhost:5672';

    this.connection =
      await amqp.connect(
        rabbitmqUrl,
      );

    this.channel =
      await this.connection.createConfirmChannel();

    await this.channel.assertExchange(
      this.exchange,
      'topic',
      {
        durable: true,
      },
    );

    console.log(
      '✅ Order Outbox Publisher conectado a RabbitMQ',
    );

    this.interval =
      setInterval(
        () => {
          void this.processOutbox();
        },
        2000,
      );

    void this.processOutbox();
  }

  private async processOutbox() {
    try {
      const events =
        await this.prisma.outboxEvent.findMany({
          where: {
            status: 'PENDING',
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 10,
        });

      for (const event of events) {
        try {
          await this.prisma.outboxEvent.update({
            where: {
              id: event.id,
            },
            data: {
              status: 'PROCESSING',
              processingAt: new Date(),
            },
          });

          await this.publish(
            event.eventType,
            event.payload,
          );

          await this.prisma.outboxEvent.update({
            where: {
              id: event.id,
            },
            data: {
              status: 'PUBLISHED',
              publishedAt: new Date(),
            },
          });

          console.log(
            '📤 Outbox publicado:',
            event.eventType,
            event.eventId,
          );
        } catch (error) {
          console.error(
            '❌ Error publicando Outbox:',
            event.eventId,
            error,
          );

          await this.prisma.outboxEvent.update({
            where: {
              id: event.id,
            },
            data: {
              status: 'PENDING',
              processingAt: null,
            },
          });
        }
      }
    } catch (error) {
      console.error(
        '❌ Error procesando Order Outbox:',
        error,
      );
    }
  }

  private publish(
    eventType: string,
    payload: unknown,
  ): Promise<void> {
    const message =
      Buffer.from(
        JSON.stringify({
          pattern: eventType,
          data: payload,
        }),
      );

    return new Promise(
      (
        resolve,
        reject,
      ) => {
        this.channel.publish(
          this.exchange,
          eventType,
          message,
          {
            persistent: true,
            contentType:
              'application/json',
          },
          (error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          },
        );
      },
    );
  }

  async onModuleDestroy() {
    if (this.interval) {
      clearInterval(
        this.interval,
      );
    }

    await this.channel?.close();

    await this.connection?.close();
  }
}