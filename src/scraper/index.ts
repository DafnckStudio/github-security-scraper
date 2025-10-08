/**
 * GitHub Security Scraper - Single Scan
 * Performs one scan and exits
 */

import logger from '../utils/logger.js';
import githubScraper from '../services/github-scraper.js';
import alertService from '../services/alert-service.js';
import supabaseStorage from '../services/supabase-storage.js';
import { config } from '../config/index.js';

async function main() {
  try {
    logger.info('='.repeat(60));
    logger.info('🔐 GitHub Security Scraper - Single Scan Mode');
    logger.info('='.repeat(60));

    // Check configuration
    if (config.scraper.dryRun) {
      logger.warn('⚠️  DRY RUN MODE - No data will be saved');
    }

    // Display configuration
    logger.info('Configuration:', {
      maxResults: config.github.maxResultsPerScan,
      notifications: config.scraper.enableNotifications,
      dryRun: config.scraper.dryRun,
    });

    // Check GitHub rate limit
    const rateLimit = await githubScraper.getRateLimitStatus();
    if (rateLimit) {
      logger.info('GitHub API Rate Limit:', {
        remaining: rateLimit.remaining,
        limit: rateLimit.limit,
        reset: new Date(rateLimit.reset * 1000).toISOString(),
      });

      if (rateLimit.remaining < 10) {
        logger.warn('⚠️  Low rate limit remaining, consider waiting');
      }
    }

    // Get current statistics
    const statsBefore = await supabaseStorage.getStatistics();
    logger.info('Current statistics:', statsBefore);

    // Perform scan
    logger.info('Starting scan...');
    const result = await githubScraper.performScan();

    logger.info('Scan completed:', {
      scanId: result.scanId,
      totalResults: result.totalResults,
      findingsCount: result.findingsCount,
    });

    // Process alerts for new findings
    if (result.findingsCount > 0) {
      logger.info('Processing alerts for new findings...');
      await alertService.processFindings();
    }

    // Get updated statistics
    const statsAfter = await supabaseStorage.getStatistics();
    logger.info('Updated statistics:', statsAfter);

    // Summary
    logger.info('='.repeat(60));
    logger.info('✅ Scan Summary:');
    logger.info(`   Total results scanned: ${result.totalResults}`);
    logger.info(`   New findings: ${result.findingsCount}`);
    logger.info(`   Critical findings (total): ${statsAfter.critical_findings}`);
    logger.info(`   Total findings (all time): ${statsAfter.total_findings}`);
    logger.info('='.repeat(60));

    process.exit(0);
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
