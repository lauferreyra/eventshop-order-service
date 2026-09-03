import { Module } from '@nestjs/common';

import { RedisModule } from '../redis/redis.module.js';

import { RateLimitService } from './rate-limit.service.js';

import { RateLimitGuard } from './rate-limit.guard.js';

@Module({
  imports: [
    RedisModule,
  ],

  providers: [
    RateLimitService,
    RateLimitGuard,
  ],

  exports: [
    RateLimitService,
    RateLimitGuard,
  ],
})
export class RateLimitModule {}