import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module.js';

@Module({
  imports: [RabbitmqModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}