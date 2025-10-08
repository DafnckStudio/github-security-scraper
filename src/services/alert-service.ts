import { SecurityFinding, SecurityAlert } from '../types/index.js';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
import supabaseStorage from './supabase-storage.js';

export class AlertService {
  /**
   * Process alerts for new findings
   */
  async processFindings(): Promise<void> {
    if (!config.scraper.enableNotifications) {
      logger.info('Notifications disabled, skipping alert processing');
      return;
    }

    try {
      // Get critical findings that haven't been notified
      const findings = await supabaseStorage.getFindingsBySeverity('critical');

      logger.info(`Processing ${findings.length} critical findings for alerts`);

      for (const finding of findings) {
        if (finding.notification_sent) {
          continue;
        }

        await this.sendAlerts(finding);
      }
    } catch (error) {
      logger.error('Error processing findings for alerts:', error);
    }
  }

  /**
   * Send all configured alerts for a finding
   */
  private async sendAlerts(finding: SecurityFinding): Promise<void> {
    const alerts: Promise<void>[] = [];

    // Email alert
    if (config.alerts.email) {
      alerts.push(this.sendEmailAlert(finding));
    }

    // Webhook alert
    if (config.alerts.webhookUrl) {
      alerts.push(this.sendWebhookAlert(finding));
    }

    await Promise.all(alerts);

    // Mark finding as notified
    // Note: This would be done through supabaseStorage but we don't have update method for findings yet
    logger.info(`All alerts sent for finding ${finding.id}`);
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(finding: SecurityFinding): Promise<void> {
    try {
      const alert: Omit<SecurityAlert, 'id'> = {
        finding_id: finding.id!,
        alert_type: 'email',
        recipient: config.alerts.email!,
        message: this.formatEmailMessage(finding),
        status: 'pending',
      };

      const alertId = await supabaseStorage.createAlert(alert);

      if (alertId) {
        // In production, you would integrate with an email service here
        // For now, we just log
        logger.info(`Email alert created: ${alertId}`, {
          recipient: alert.recipient,
          finding: finding.id,
        });

        // Simulate sending
        await supabaseStorage.updateAlert(alertId, {
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Error sending email alert:', error);
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(finding: SecurityFinding): Promise<void> {
    try {
      const alert: Omit<SecurityAlert, 'id'> = {
        finding_id: finding.id!,
        alert_type: 'webhook',
        recipient: config.alerts.webhookUrl!,
        message: this.formatWebhookMessage(finding),
        status: 'pending',
      };

      const alertId = await supabaseStorage.createAlert(alert);

      if (alertId) {
        // Send POST request to webhook
        const response = await fetch(config.alerts.webhookUrl!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: alert.message,
            severity: finding.severity,
            repository: finding.repository_name,
            file: finding.file_path,
            pattern_type: finding.pattern_type,
            timestamp: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          await supabaseStorage.updateAlert(alertId, {
            status: 'sent',
            sent_at: new Date().toISOString(),
          });
          logger.info(`Webhook alert sent: ${alertId}`);
        } else {
          throw new Error(`Webhook returned ${response.status}`);
        }
      }
    } catch (error: any) {
      logger.error('Error sending webhook alert:', error);
    }
  }

  /**
   * Format email message
   */
  private formatEmailMessage(finding: SecurityFinding): string {
    return `
🚨 CRITICAL SECURITY ALERT 🚨

A sensitive ${finding.pattern_type} has been detected in a public GitHub repository.

Repository: ${finding.repository_name}
Owner: ${finding.repository_owner}
File: ${finding.file_path || 'N/A'}
Severity: ${finding.severity.toUpperCase()}

URL: ${finding.repository_url}

Pattern detected: ${finding.matched_pattern}

Code snippet:
\`\`\`
${finding.code_snippet}
\`\`\`

Metadata: ${JSON.stringify(finding.metadata, null, 2)}

Please investigate immediately and take appropriate action:
1. Contact the repository owner
2. Report to GitHub Security
3. Verify if the credentials are still active
4. Rotate the exposed secrets if necessary

Discovered at: ${finding.discovered_at}
    `.trim();
  }

  /**
   * Format webhook message (Slack format)
   */
  private formatWebhookMessage(finding: SecurityFinding): string {
    return `🚨 *CRITICAL SECURITY ALERT*\n\nSensitive *${finding.pattern_type}* detected in public repository!\n\n*Repository:* ${finding.repository_name}\n*File:* ${finding.file_path}\n*Severity:* ${finding.severity.toUpperCase()}\n\n<${finding.repository_url}|View Repository>`;
  }

  /**
   * Send GitHub issue alert (for critical findings)
   */
  async sendGitHubIssueAlert(finding: SecurityFinding): Promise<void> {
    // This would create a security advisory or issue on the repository
    // Requires additional GitHub permissions
    logger.info('GitHub issue alert (not implemented yet)', { finding: finding.id });
  }
}

export default new AlertService();
