import 'dotenv/config';
import { ScraperConfig } from '../types/index.js';

export const config: ScraperConfig = {
  github: {
    token: process.env.GITHUB_TOKEN || '',
    maxResultsPerScan: parseInt(process.env.MAX_RESULTS_PER_SCAN || '100', 10),
  },
  supabase: {
    url: process.env.SUPABASE_URL || 'https://nykctocknzbstdqnfkun.supabase.co',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  scraper: {
    intervalMinutes: parseInt(process.env.SCRAPER_INTERVAL_MINUTES || '15', 10),
    enableNotifications: process.env.ENABLE_NOTIFICATIONS === 'true',
    dryRun: process.env.DRY_RUN === 'true',
  },
  alerts: {
    email: process.env.ALERT_EMAIL,
    webhookUrl: process.env.WEBHOOK_URL,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validation
if (!config.github.token && !config.scraper.dryRun) {
  throw new Error('GITHUB_TOKEN is required. Please set it in .env file.');
}

if (!config.supabase.serviceRoleKey && !config.scraper.dryRun) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required. Please set it in .env file.');
}

export default config;
