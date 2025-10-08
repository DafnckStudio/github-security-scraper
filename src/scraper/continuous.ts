/**
 * GitHub Security Scraper - Continuous Mode
 * Runs forever, performing scans at regular intervals
 */

import cron from 'node-cron';
import logger from '../utils/logger.js';
import githubScraper from '../services/github-scraper.js';
import alertService from '../services/alert-service.js';
import supabaseStorage from '../services/supabase-storage.js';
import telegramNotifier from '../services/telegram-notifier.js';
import { config } from '../config/index.js';

let isScanning = false;
let scanCount = 0;

async function performScheduledScan() {
  if (isScanning) {
    logger.warn('⏸️  Previous scan still running, skipping this interval');
    return;
  }

  isScanning = true;
  scanCount++;

  try {
    logger.info('='.repeat(60));
    logger.info(`🔐 Starting scheduled scan #${scanCount}`);
    logger.info(`Time: ${new Date().toISOString()}`);
    logger.info('='.repeat(60));

    // Check rate limit before scanning
    const rateLimit = await githubScraper.getRateLimitStatus();
    if (rateLimit && rateLimit.remaining < 10) {
      logger.warn('⚠️  Rate limit too low, skipping this scan');
      logger.info(`Rate limit resets at: ${new Date(rateLimit.reset * 1000).toISOString()}`);
      return;
    }

    // Perform scan
    const result = await githubScraper.performScan();

    logger.info(`Scan #${scanCount} completed:`, {
      scanId: result.scanId,
      totalResults: result.totalResults,
      findingsCount: result.findingsCount,
    });

    // Process alerts
    if (result.findingsCount > 0) {
      logger.info('Processing alerts...');
      await alertService.processFindings();
      
      // Send Telegram notification
      if (telegramNotifier.isConfigured()) {
        await telegramNotifier.notifyScanSummary(
          result.scanId || 'unknown',
          result.totalResults,
          result.findingsCount
        );
      }
    }

    // Get statistics
    const stats = await supabaseStorage.getStatistics();
    logger.info('Current statistics:', stats);

    if (result.findingsCount > 0) {
      logger.warn(`🚨 ${result.findingsCount} new security findings detected!`);
    } else {
      logger.info('✅ No new findings in this scan');
    }
  } catch (error) {
    logger.error(`Error in scan #${scanCount}:`, error);
  } finally {
    isScanning = false;
    logger.info(`Next scan scheduled in ${config.scraper.intervalMinutes} minutes`);
    logger.info('='.repeat(60));
  }
}

async function main() {
  try {
    logger.info('='.repeat(60));
    logger.info('🔐 GitHub Security Scraper - Continuous Mode');
    logger.info('='.repeat(60));

    // Display configuration
    logger.info('Configuration:', {
      interval: `${config.scraper.intervalMinutes} minutes`,
      maxResults: config.github.maxResultsPerScan,
      notifications: config.scraper.enableNotifications,
      dryRun: config.scraper.dryRun,
    });

    if (config.scraper.dryRun) {
      logger.warn('⚠️  DRY RUN MODE - No data will be saved');
    }

    // Get initial statistics
    const stats = await supabaseStorage.getStatistics();
    logger.info('Initial statistics:', stats);

    // Test Telegram connection
    if (telegramNotifier.isConfigured()) {
      logger.info('Testing Telegram connection...');
      await telegramNotifier.testConnection();
    }

    // Create cron schedule
    const cronExpression = `*/${config.scraper.intervalMinutes} * * * *`;
    logger.info(`Cron schedule: ${cronExpression}`);
    logger.info('='.repeat(60));

    // Run first scan immediately
    logger.info('Running initial scan...');
    await performScheduledScan();

    // Schedule recurring scans
    logger.info(`Scheduling recurring scans every ${config.scraper.intervalMinutes} minutes...`);
    cron.schedule(cronExpression, performScheduledScan);

    logger.info('✅ Continuous scraper started successfully');
    logger.info('Press Ctrl+C to stop');

    // Keep process alive
    process.on('SIGINT', () => {
      logger.info('Shutting down gracefully...');
      logger.info(`Total scans performed: ${scanCount}`);
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down...');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
