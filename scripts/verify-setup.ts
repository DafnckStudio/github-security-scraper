/**
 * Script de vérification de l'installation
 * Vérifie que tous les composants sont correctement configurés
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config/index.js';
import logger from '../src/utils/logger.js';

interface CheckResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

const results: CheckResult[] = [];

function addResult(name: string, status: CheckResult['status'], message: string) {
  results.push({ name, status, message });
  const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);
}

async function verifySupabaseConnection(): Promise<void> {
  try {
    const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
    const { data, error } = await supabase.from('github_sensitive_patterns').select('count');
    
    if (error) throw error;
    addResult('Supabase Connection', 'success', 'Connected successfully');
  } catch (error: any) {
    addResult('Supabase Connection', 'error', error.message);
  }
}

async function verifyPatterns(): Promise<void> {
  try {
    const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
    const { data, error } = await supabase
      .from('github_sensitive_patterns')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    
    const count = data?.length || 0;
    if (count === 0) {
      addResult('Sensitive Patterns', 'error', 'No active patterns found');
    } else if (count < 12) {
      addResult('Sensitive Patterns', 'warning', `Only ${count} patterns found (expected 12)`);
    } else {
      addResult('Sensitive Patterns', 'success', `${count} active patterns configured`);
    }
  } catch (error: any) {
    addResult('Sensitive Patterns', 'error', error.message);
  }
}

async function verifyTables(): Promise<void> {
  try {
    const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
    
    const tables = [
      'github_sensitive_patterns',
      'github_scan_history',
      'github_security_findings',
      'github_security_alerts'
    ];
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        addResult(`Table: ${table}`, 'error', error.message);
      }
    }
    
    addResult('Database Tables', 'success', 'All 4 tables accessible');
  } catch (error: any) {
    addResult('Database Tables', 'error', error.message);
  }
}

async function verifyGitHubToken(): Promise<void> {
  if (!config.github.token) {
    addResult('GitHub Token', 'error', 'GITHUB_TOKEN not set in .env');
    return;
  }
  
  try {
    const response = await fetch('https://api.github.com/rate_limit', {
      headers: {
        'Authorization': `token ${config.github.token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const coreLimit = data.resources.core.limit;
    const searchLimit = data.resources.search.limit;
    
    if (coreLimit < 5000) {
      addResult('GitHub Token', 'warning', `Token has limited rate limit: ${coreLimit}/hour`);
    } else {
      addResult('GitHub Token', 'success', `Valid token with ${coreLimit}/hour core + ${searchLimit}/min search`);
    }
  } catch (error: any) {
    addResult('GitHub Token', 'error', error.message);
  }
}

function verifyConfig(): void {
  if (!config.supabase.url) {
    addResult('Config: Supabase URL', 'error', 'SUPABASE_URL not set');
  } else {
    addResult('Config: Supabase URL', 'success', 'Configured');
  }
  
  if (!config.supabase.serviceRoleKey) {
    addResult('Config: Service Role Key', 'error', 'SUPABASE_SERVICE_ROLE_KEY not set');
  } else {
    addResult('Config: Service Role Key', 'success', 'Configured');
  }
  
  addResult('Config: Scan Interval', 'success', `${config.scraper.intervalMinutes} minutes`);
  addResult('Config: Max Results', 'success', `${config.github.maxResultsPerScan} per scan`);
  addResult('Config: Notifications', config.scraper.enableNotifications ? 'success' : 'warning', 
    config.scraper.enableNotifications ? 'Enabled' : 'Disabled');
}

async function main() {
  console.log('='.repeat(60));
  console.log('🔐 GitHub Security Scraper - Setup Verification');
  console.log('='.repeat(60));
  console.log();
  
  console.log('📋 Configuration Checks');
  console.log('-'.repeat(60));
  verifyConfig();
  console.log();
  
  console.log('🔗 External Services');
  console.log('-'.repeat(60));
  await verifyGitHubToken();
  await verifySupabaseConnection();
  console.log();
  
  console.log('💾 Database Checks');
  console.log('-'.repeat(60));
  await verifyTables();
  await verifyPatterns();
  console.log();
  
  // Summary
  console.log('='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  
  console.log(`✅ Success: ${successCount}`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log();
  
  if (errorCount > 0) {
    console.log('❌ Setup verification FAILED');
    console.log('Please fix the errors above before running the scraper.');
    process.exit(1);
  } else if (warningCount > 0) {
    console.log('⚠️  Setup verification PASSED with warnings');
    console.log('The scraper can run, but some features may not work optimally.');
    process.exit(0);
  } else {
    console.log('✅ Setup verification PASSED');
    console.log('🚀 Ready to start scanning! Run: npm run scraper:start');
    process.exit(0);
  }
}

main();
