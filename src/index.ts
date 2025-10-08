/**
 * GitHub Security Scraper
 * Main entry point
 */

import logger from './utils/logger.js';

logger.info('GitHub Security Scraper initialized');

export { default as githubScraper } from './services/github-scraper.js';
export { default as supabaseStorage } from './services/supabase-storage.js';
export { default as alertService } from './services/alert-service.js';
export { default as patternMatcher } from './services/pattern-matcher.js';
export * from './types/index.js';

logger.info('All services exported successfully');
