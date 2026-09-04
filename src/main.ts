import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import {
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app =
    await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,

    options: {
      urls: [
        process.env.RABBITMQ_URL ??
          'amqp://admin:admin@localhost:5672',
      ],

      queue: 'order_queue',

      queueOptions: {
        durable: true,
      },

      noAck: false,
    },
  });

  await app.startAllMicroservices();

  await app.listen(
    process.env.PORT ?? 3001,
  );
}

bootstrap();