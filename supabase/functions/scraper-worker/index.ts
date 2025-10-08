/**
 * Supabase Edge Function - GitHub Security Scraper Worker
 * Runs as a serverless cron job with Telegram notifications
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Telegram notification helper
async function sendTelegramNotification(message: string): Promise<void> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
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
      console.log('Telegram notification sent');
    }
  } catch (error) {
    console.error('Telegram error:', error);
  }
}

interface SensitivePattern {
  id: string;
  pattern_name: string;
  pattern_regex: string;
  pattern_type: string;
  severity: string;
  is_active: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const githubToken = Deno.env.get('GITHUB_TOKEN');
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN not configured');
    }

    console.log('🚀 Starting GitHub security scan...');

    // Create scan history
    const { data: scan, error: scanError } = await supabaseClient
      .from('github_scan_history')
      .insert({
        scan_type: 'code',
        query: 'Edge Function scan',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (scanError) throw scanError;
    const scanId = scan.id;

    // Get active patterns
    const { data: patterns, error: patternsError } = await supabaseClient
      .from('github_sensitive_patterns')
      .select('*')
      .eq('is_active', true);

    if (patternsError) throw patternsError;

    if (!patterns || patterns.length === 0) {
      throw new Error('No active patterns found');
    }

    console.log(`Loaded ${patterns.length} active patterns`);

    // Build search queries
    const searchQueries = [
      'PRIVATE_KEY OR WALLET_KEY OR SECRET_KEY OR MNEMONIC OR SEED_PHRASE',
      'INFURA_ID OR ALCHEMY_KEY OR ETHERSCAN_API_KEY',
      'filename:.env',
    ];

    let totalResults = 0;
    let findingsCount = 0;

    for (const query of searchQueries) {
      try {
        // Search GitHub
        const searchUrl = `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=30`;
        const response = await fetch(searchUrl, {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) {
          console.error(`GitHub API error: ${response.status}`);
          continue;
        }

        const data = await response.json();
        totalResults += data.items?.length || 0;

        console.log(`Found ${data.items?.length || 0} results for query`);

        // Process each result
        for (const item of data.items || []) {
          try {
            // Get file content
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

            // Match patterns
            for (const pattern of patterns as SensitivePattern[]) {
              try {
                const regex = new RegExp(pattern.pattern_regex, 'gi');
                const matches = content.match(regex);

                if (matches && matches.length > 0) {
                  // Check if already exists
                  const { data: existing } = await supabaseClient
                    .from('github_security_findings')
                    .select('id')
                    .eq('repository_url', item.repository.html_url)
                    .eq('file_path', item.path)
                    .limit(1);

                  if (existing && existing.length > 0) {
                    continue;
                  }

                  // Create finding
                  const { error: findingError } = await supabaseClient
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
                    console.log(`🚨 Finding created: ${pattern.pattern_name}`);
                  }
                }
              } catch (patternError) {
                console.error(`Pattern error:`, patternError);
              }
            }
          } catch (itemError) {
            console.error(`Item processing error:`, itemError);
          }
        }
      } catch (queryError) {
        console.error(`Query error:`, queryError);
      }
    }

    // Update scan history
    await supabaseClient
      .from('github_scan_history')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_results: totalResults,
        findings_count: findingsCount,
      })
      .eq('id', scanId);

    console.log(`✅ Scan completed: ${findingsCount} findings from ${totalResults} results`);

    // Send Telegram notification
    if (findingsCount > 0) {
      await sendTelegramNotification(`
🔍 *Scan Terminé - Supabase Edge Function*

📊 *Résumé*
\`\`\`
Scan ID    : ${scanId.substring(0, 8)}
Résultats  : ${totalResults}
Findings   : ${findingsCount}
Status     : Completed ✅
\`\`\`

💡 *Dashboard:* [Voir les détails](https://nykctocknzbstdqnfkun.supabase.co)
      `.trim());
    }

    return new Response(
      JSON.stringify({
        success: true,
        scanId,
        totalResults,
        findingsCount,
        message: `Scan completed successfully`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
