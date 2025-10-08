/**
 * Telegram Bot Commands Handler
 * Contrôle le scraper via commandes Telegram
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const message = body.message;

    if (!message || !message.text) {
      return new Response('OK', { status: 200 });
    }

    const chatId = message.chat.id;
    const text = message.text;
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Router les commandes
    if (text.startsWith('/status')) {
      await handleStatus(supabaseClient, botToken, chatId);
    } else if (text.startsWith('/scan')) {
      await handleScan(supabaseClient, botToken, chatId);
    } else if (text.startsWith('/history')) {
      await handleHistory(supabaseClient, botToken, chatId);
    } else if (text.startsWith('/stats')) {
      await handleStats(supabaseClient, botToken, chatId);
    } else if (text.startsWith('/help')) {
      await handleHelp(botToken, chatId);
    } else if (text.startsWith('/patterns')) {
      await handlePatterns(supabaseClient, botToken, chatId);
    } else if (text.startsWith('/recent')) {
      await handleRecent(supabaseClient, botToken, chatId);
    } else if (text.startsWith('/funded')) {
      await handleFunded(supabaseClient, botToken, chatId);
    }

    return new Response('OK', { status: 200 });
  } catch (error: any) {
    console.error('Bot error:', error);
    return new Response('Error', { status: 500 });
  }
});

async function sendMessage(botToken: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  });
}

async function handleStatus(supabase: any, botToken: string, chatId: number) {
  const { data: lastScan } = await supabase
    .from('github_scan_history')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  const { data: patterns } = await supabase
    .from('github_sensitive_patterns')
    .select('id')
    .eq('is_active', true);

  const msg = `
📊 *Status du Scraper*

🔍 *Dernier Scan:*
\`\`\`
Status    : ${lastScan?.status || 'N/A'}
Findings  : ${lastScan?.findings_count || 0}
Date      : ${lastScan?.started_at ? new Date(lastScan.started_at).toLocaleString('fr-FR') : 'N/A'}
\`\`\`

⚙️ *Configuration:*
\`\`\`
Patterns actifs : ${patterns?.length || 0}
Cron : Toutes les 15 min
Auto-run : ✅ Activé
\`\`\`

🔗 [Dashboard](https://supabase.com/dashboard/project/nykctocknzbstdqnfkun)
  `.trim();

  await sendMessage(botToken, chatId, msg);
}

async function handleScan(supabase: any, botToken: string, chatId: number) {
  await sendMessage(botToken, chatId, '🔍 Lancement d\'un scan manuel...');

  try {
    const response = await fetch('https://nykctocknzbstdqnfkun.supabase.co/functions/v1/scraper-worker', {
      method: 'POST',
    });

    const result = await response.json();

    const msg = `
✅ *Scan Manuel Terminé*

📊 *Résultats:*
\`\`\`
Findings   : ${result.findingsCount || 0}
Avec fonds : ${result.fundedCount || 0}
Résultats  : ${result.totalResults || 0}
\`\`\`
    `.trim();

    await sendMessage(botToken, chatId, msg);
  } catch (error) {
    await sendMessage(botToken, chatId, '❌ Erreur lors du scan');
  }
}

async function handleHistory(supabase: any, botToken: string, chatId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: scans } = await supabase
    .from('github_scan_history')
    .select('*')
    .gte('started_at', today.toISOString())
    .order('started_at', { ascending: false });

  let msg = `📅 *Historique du Jour*\n\n`;
  msg += `Total scans : ${scans?.length || 0}\n\n`;

  if (scans && scans.length > 0) {
    msg += `🔍 *Derniers scans:*\n`;
    scans.slice(0, 10).forEach((scan: any, i: number) => {
      const time = new Date(scan.started_at).toLocaleTimeString('fr-FR');
      msg += `${i + 1}. ${time} - ${scan.findings_count || 0} findings\n`;
    });
  }

  await sendMessage(botToken, chatId, msg);
}

async function handleStats(supabase: any, botToken: string, chatId: number) {
  const { count: totalFindings } = await supabase
    .from('github_security_findings')
    .select('*', { count: 'exact', head: true });

  const { count: criticalFindings } = await supabase
    .from('github_security_findings')
    .select('*', { count: 'exact', head: true })
    .eq('severity', 'critical');

  const { count: newFindings } = await supabase
    .from('github_security_findings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new');

  const msg = `
📊 *Statistiques Globales*

\`\`\`
Total findings  : ${totalFindings || 0}
Critical        : ${criticalFindings || 0}
Nouveaux        : ${newFindings || 0}
\`\`\`

🔗 [Voir le dashboard](https://supabase.com/dashboard/project/nykctocknzbstdqnfkun)
  `.trim();

  await sendMessage(botToken, chatId, msg);
}

async function handleHelp(botToken: string, chatId: number) {
  const msg = `
🤖 *Commandes Disponibles*

/status - État actuel du scraper
/scan - Lancer un scan manuel
/history - Historique du jour
/stats - Statistiques globales
/patterns - Liste des patterns actifs
/recent - 10 derniers findings
/funded - Findings avec balance > 0
/help - Ce message

💡 Le scraper tourne automatiquement toutes les 15 minutes !
  `.trim();

  await sendMessage(botToken, chatId, msg);
}

async function handlePatterns(supabase: any, botToken: string, chatId: number) {
  const { data: patterns } = await supabase
    .from('github_sensitive_patterns')
    .select('pattern_type, severity')
    .eq('is_active', true);

  const grouped = patterns?.reduce((acc: any, p: any) => {
    acc[p.severity] = (acc[p.severity] || 0) + 1;
    return acc;
  }, {});

  const msg = `
🎯 *Patterns Actifs*

\`\`\`
Total      : ${patterns?.length || 0}
Critical   : ${grouped?.critical || 0}
High       : ${grouped?.high || 0}
Medium     : ${grouped?.medium || 0}
Low        : ${grouped?.low || 0}
\`\`\`
  `.trim();

  await sendMessage(botToken, chatId, msg);
}

async function handleRecent(supabase: any, botToken: string, chatId: number) {
  const { data: findings } = await supabase
    .from('github_security_findings')
    .select('*')
    .order('discovered_at', { ascending: false })
    .limit(5);

  let msg = `🔍 *5 Derniers Findings*\n\n`;

  if (findings && findings.length > 0) {
    findings.forEach((f: any, i: number) => {
      const emoji = f.severity === 'critical' ? '🔴' : f.severity === 'high' ? '🟠' : '🟡';
      msg += `${i + 1}. ${emoji} ${f.pattern_type}\n`;
      msg += `   📁 ${f.repository_name}\n`;
      msg += `   ⏰ ${new Date(f.discovered_at).toLocaleTimeString('fr-FR')}\n\n`;
    });
  } else {
    msg += 'Aucun finding récent';
  }

  await sendMessage(botToken, chatId, msg);
}

async function handleFunded(supabase: any, botToken: string, chatId: number) {
  const { data: findings } = await supabase
    .from('github_security_findings')
    .select('*')
    .order('discovered_at', { ascending: false })
    .limit(10);

  let msg = `💰 *Findings avec Balance Potentielle*\n\n`;
  msg += `Total : ${findings?.length || 0}\n\n`;

  if (findings && findings.length > 0) {
    msg += `🔍 *Liste:*\n`;
    findings.slice(0, 5).forEach((f: any, i: number) => {
      msg += `${i + 1}. ${f.repository_name}\n`;
      msg += `   Type: ${f.pattern_type}\n`;
    });
  }

  await sendMessage(botToken, chatId, msg);
}
