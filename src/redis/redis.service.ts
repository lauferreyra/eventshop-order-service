import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { Redis } from 'ioredis';

@Injectable()
export class RedisService
  implements OnModuleInit, OnModuleDestroy
{
  private redis!: Redis;

  async onModuleInit() {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
    });

    await this.redis.ping();

    console.log('✅ Order Redis conectado');
  }

  async set(
    key: string,
    value: string,
  ): Promise<void> {
    await this.redis.set(key, value);
  }

  async get(
    key: string,
  ): Promise<string | null> {
    return this.redis.get(key);
  }

  async delete(
    key: string,
  ): Promise<void> {
    await this.redis.del(key);
  }

  async expire(
    key: string,
    seconds: number,
  ): Promise<void> {
    await this.redis.expire(
      key,
      seconds,
    );
  }

  async ttl(
    key: string,
  ): Promise<number> {
    return this.redis.ttl(key);
  }

  async eval(
    script: string,
    keys: string[],
    args: string[],
  ): Promise<unknown> {
    return this.redis.eval(
      script,
      keys.length,
      ...keys,
      ...args,
    );
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}