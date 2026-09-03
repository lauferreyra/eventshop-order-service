import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module.js';
import { RedisModule } from './redis/redis.module.js';
import { RateLimitModule } from './rate-limit/rate-limit.module.js';

@Module({
  imports: [RabbitmqModule, RedisModule, RateLimitModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}