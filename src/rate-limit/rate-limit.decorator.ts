import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY =
  'rate_limit';

  export type RateLimitIdentifier =
  | 'ip'
  | 'user';

export interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
  identifier?: RateLimitIdentifier;
}

export const RateLimit = (
  options: RateLimitOptions,
) =>
  SetMetadata(
    RATE_LIMIT_KEY,
    options,
  );