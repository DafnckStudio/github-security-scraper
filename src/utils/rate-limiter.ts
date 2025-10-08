import logger from './logger.js';

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

export class RateLimiter {
  private rateLimitInfo: RateLimitInfo | null = null;

  updateRateLimitInfo(headers: any): void {
    if (headers['x-ratelimit-limit']) {
      this.rateLimitInfo = {
        limit: parseInt(headers['x-ratelimit-limit'], 10),
        remaining: parseInt(headers['x-ratelimit-remaining'], 10),
        reset: new Date(parseInt(headers['x-ratelimit-reset'], 10) * 1000),
      };

      logger.info('Rate limit updated:', {
        remaining: this.rateLimitInfo.remaining,
        limit: this.rateLimitInfo.limit,
        reset: this.rateLimitInfo.reset.toISOString(),
      });
    }
  }

  async waitIfNeeded(): Promise<void> {
    if (!this.rateLimitInfo) return;

    if (this.rateLimitInfo.remaining < 10) {
      const now = new Date();
      const waitTime = this.rateLimitInfo.reset.getTime() - now.getTime();

      if (waitTime > 0) {
        logger.warn(`Rate limit approaching. Waiting ${waitTime}ms until reset...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime + 1000));
        logger.info('Rate limit reset. Resuming...');
      }
    }
  }

  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  isRateLimited(): boolean {
    if (!this.rateLimitInfo) return false;
    return this.rateLimitInfo.remaining === 0;
  }
}

export default new RateLimiter();
