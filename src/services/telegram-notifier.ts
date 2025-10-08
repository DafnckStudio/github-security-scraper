/**
 * Telegram Notifier Service
 * Envoie des notifications dans un channel Telegram privé
 */

import { config } from '../config/index.js';
import { SecurityFinding } from '../types/index.js';
import logger from '../utils/logger.js';

interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export class TelegramNotifier {
  private config: TelegramConfig;
  private apiUrl: string;

  constructor() {
    this.config = {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: process.env.TELEGRAM_CHAT_ID || '',
      enabled: process.env.TELEGRAM_NOTIFICATIONS === 'true',
    };

    this.apiUrl = `https://api.telegram.org/bot${this.config.botToken}`;
  }

  /**
   * Envoie un message texte à Telegram
   */
  async sendMessage(text: string, options: any = {}): Promise<boolean> {
    if (!this.config.enabled || !this.config.botToken || !this.config.chatId) {
      logger.debug('Telegram notifications disabled or not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
          ...options,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description}`);
      }

      logger.info('Telegram notification sent successfully');
      return true;
    } catch (error: any) {
      logger.error('Failed to send Telegram notification:', error.message);
      return false;
    }
  }

  /**
   * Formate et envoie une notification pour un nouveau finding
   */
  async notifyFinding(finding: SecurityFinding): Promise<boolean> {
    const emoji = this.getSeverityEmoji(finding.severity);
    const message = this.formatFindingMessage(finding, emoji);

    return this.sendMessage(message);
  }

  /**
   * Formate et envoie une notification pour plusieurs findings
   */
  async notifyBulkFindings(findings: SecurityFinding[]): Promise<boolean> {
    if (findings.length === 0) return false;

    const message = this.formatBulkFindingsMessage(findings);
    return this.sendMessage(message);
  }

  /**
   * Envoie un résumé de scan
   */
  async notifyScanSummary(scanId: string, totalResults: number, findingsCount: number): Promise<boolean> {
    const message = `
🔍 *Scan Terminé*

📊 *Résumé*
\`\`\`
Scan ID    : ${scanId.substring(0, 8)}
Résultats  : ${totalResults}
Findings   : ${findingsCount}
Status     : Completed ✅
\`\`\`

💡 *Dashboard:* [Voir les détails](https://nykctocknzbstdqnfkun.supabase.co)
    `.trim();

    return this.sendMessage(message);
  }

  /**
   * Envoie une alerte d'erreur
   */
  async notifyError(error: string, context?: string): Promise<boolean> {
    const message = `
🚨 *Erreur Scraper*

❌ *Message:* ${error}

${context ? `📝 *Context:* ${context}` : ''}

⏰ *Time:* ${new Date().toISOString()}
    `.trim();

    return this.sendMessage(message);
  }

  /**
   * Test de connexion Telegram
   */
  async testConnection(): Promise<boolean> {
    const message = `
✅ *Test de Connexion*

Le scraper GitHub Security est correctement configuré !

📊 *Configuration:*
\`\`\`
Bot Token  : ${this.config.botToken ? '✓ Configuré' : '✗ Manquant'}
Chat ID    : ${this.config.chatId ? '✓ Configuré' : '✗ Manquant'}
Status     : ${this.config.enabled ? '✓ Activé' : '✗ Désactivé'}
\`\`\`

🚀 Le scraper est prêt à détecter les secrets exposés !
    `.trim();

    return this.sendMessage(message);
  }

  /**
   * Formate un message pour un finding unique
   */
  private formatFindingMessage(finding: SecurityFinding, emoji: string): string {
    const repoUrl = finding.repository_url;
    const fileUrl = finding.metadata?.file_url || repoUrl;
    
    return `
${emoji} *${finding.severity.toUpperCase()} - ${finding.pattern_type}*

🔍 *Repository:* [${finding.repository_name}](${repoUrl})
📁 *File:* \`${finding.file_path || 'N/A'}\`
🔑 *Pattern:* \`${finding.matched_pattern}\`

👤 *Owner:* ${finding.repository_owner}
⏰ *Discovered:* ${new Date(finding.discovered_at!).toLocaleString('fr-FR')}

🔗 [Voir le fichier](${fileUrl})
    `.trim();
  }

  /**
   * Formate un message pour plusieurs findings
   */
  private formatBulkFindingsMessage(findings: SecurityFinding[]): string {
    const critical = findings.filter(f => f.severity === 'critical').length;
    const high = findings.filter(f => f.severity === 'high').length;
    const medium = findings.filter(f => f.severity === 'medium').length;

    let message = `
🚨 *${findings.length} Nouveaux Findings Détectés !*

📊 *Par Sévérité:*
\`\`\`
🔴 Critical : ${critical}
🟠 High     : ${high}
🟡 Medium   : ${medium}
\`\`\`

🔍 *Top 5:*
`;

    // Ajouter les 5 premiers findings
    findings.slice(0, 5).forEach((finding, i) => {
      const emoji = this.getSeverityEmoji(finding.severity);
      message += `
${i + 1}. ${emoji} \`${finding.pattern_type}\` - [${finding.repository_name}](${finding.repository_url})`;
    });

    if (findings.length > 5) {
      message += `\n\n... et ${findings.length - 5} autres`;
    }

    message += '\n\n💡 [Voir le dashboard](https://nykctocknzbstdqnfkun.supabase.co)';

    return message.trim();
  }

  /**
   * Retourne l'emoji correspondant à la sévérité
   */
  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵',
    };
    return emojis[severity] || '⚪';
  }

  /**
   * Vérifie si les notifications Telegram sont configurées
   */
  isConfigured(): boolean {
    return Boolean(
      this.config.enabled &&
      this.config.botToken &&
      this.config.chatId
    );
  }
}

export default new TelegramNotifier();
