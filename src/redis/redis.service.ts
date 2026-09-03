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
  private redis: Redis;

  async onModuleInit() {
    this.redis = new Redis({
      host:
        process.env.REDIS_HOST ??
        'localhost',

      port:
        Number(
          process.env.REDIS_PORT ??
            6379,
        ),
    });

    console.log(
      `✅ Redis conectado a ${process.env.REDIS_HOST ?? 'localhost'}:${process.env.REDIS_PORT ?? 6379}`,
    );
  }

  async set(
    key: string,
    value: string,
    ttl?: number,
  ) {
    if (ttl) {
      await this.redis.set(
        key,
        value,
        'EX',
        ttl,
      );

      return;
    }

    await this.redis.set(
      key,
      value,
    );
  }

  async get(
    key: string,
  ): Promise<string | null> {
    return this.redis.get(key);
  }

  async delete(
    key: string,
  ) {
    return this.redis.del(key);
  }

  async expire(
    key: string,
    seconds: number,
  ) {
    return this.redis.expire(
      key,
      seconds,
    );
  }

  async ttl(
    key: string,
  ) {
    return this.redis.ttl(key);
  }

  async eval<T>(
    script: string,
    numKeys: number,
    ...args: string[]
  ): Promise<T> {
    return this.redis.eval(
      script,
      numKeys,
      ...args,
    ) as T;
  }

  async onModuleDestroy() {
    await this.redis?.quit();
  }
}