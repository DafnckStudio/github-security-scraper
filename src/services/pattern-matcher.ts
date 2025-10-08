import { SensitivePattern } from '../types/index.js';
import logger from '../utils/logger.js';

export interface MatchResult {
  pattern: SensitivePattern;
  matches: string[];
  confidence: number;
}

export class PatternMatcher {
  /**
   * Test a text snippet against all patterns
   */
  matchPatterns(text: string, patterns: SensitivePattern[]): MatchResult[] {
    const results: MatchResult[] = [];

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern.pattern_regex, 'gi');
        const matches = this.extractMatches(text, regex);

        if (matches.length > 0) {
          const confidence = this.calculateConfidence(pattern, matches, text);
          
          results.push({
            pattern,
            matches,
            confidence,
          });

          logger.debug(`Pattern matched: ${pattern.pattern_name}`, {
            matches_count: matches.length,
            confidence,
          });
        }
      } catch (error) {
        logger.error(`Error testing pattern ${pattern.pattern_name}:`, error);
      }
    }

    return results;
  }

  /**
   * Extract all matches from text using regex
   */
  private extractMatches(text: string, regex: RegExp): string[] {
    const matches: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      matches.push(match[0]);
      // Prevent infinite loops with zero-width matches
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }

    return matches;
  }

  /**
   * Calculate confidence score (0-100) for a match
   * Higher score = more likely to be a real secret
   */
  private calculateConfidence(
    pattern: SensitivePattern,
    matches: string[],
    fullText: string
  ): number {
    let score = 50; // Base score

    // Factor 1: Pattern type weight
    const typeWeights: Record<string, number> = {
      private_key: 40,
      seed_phrase: 40,
      mnemonic: 40,
      api_key: 30,
      database_credential: 25,
      wallet_address: 15,
    };
    score += typeWeights[pattern.pattern_type] || 20;

    // Factor 2: Multiple matches increase confidence
    if (matches.length > 1) {
      score += Math.min(matches.length * 2, 10);
    }

    // Factor 3: Check for common false positive indicators
    const falsePositiveIndicators = [
      'example',
      'test',
      'demo',
      'placeholder',
      'your_',
      'xxx',
      '000000',
      'aaaa',
      'replace',
      'insert',
    ];

    const textLower = fullText.toLowerCase();
    let falsePositiveCount = 0;
    for (const indicator of falsePositiveIndicators) {
      if (textLower.includes(indicator)) {
        falsePositiveCount++;
      }
    }

    score -= falsePositiveCount * 15;

    // Factor 4: Check if it's in a config example or documentation
    if (textLower.includes('example') || textLower.includes('.md') || textLower.includes('readme')) {
      score -= 20;
    }

    // Factor 5: Check for entropy (randomness) in crypto keys
    if (['private_key', 'api_key', 'seed_phrase'].includes(pattern.pattern_type)) {
      const avgEntropy = this.calculateAverageEntropy(matches);
      if (avgEntropy > 4) {
        score += 15;
      } else if (avgEntropy < 2) {
        score -= 20;
      }
    }

    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate Shannon entropy to detect randomness
   * Higher entropy = more random = more likely to be a real secret
   */
  private calculateAverageEntropy(strings: string[]): number {
    if (strings.length === 0) return 0;

    const entropies = strings.map((str) => this.calculateEntropy(str));
    return entropies.reduce((a, b) => a + b, 0) / entropies.length;
  }

  private calculateEntropy(str: string): number {
    const freq: Record<string, number> = {};
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    const len = str.length;
    for (const char in freq) {
      const p = freq[char] / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Validate if a match is likely a real secret
   */
  isLikelyRealSecret(matchResult: MatchResult): boolean {
    return matchResult.confidence >= 60;
  }

  /**
   * Sanitize sensitive data for logging
   */
  sanitizeForLogging(text: string): string {
    // Only show first and last 4 characters
    if (text.length <= 8) return '***';
    return `${text.substring(0, 4)}...${text.substring(text.length - 4)}`;
  }
}

export default new PatternMatcher();
