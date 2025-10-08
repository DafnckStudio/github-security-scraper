/**
 * Script pour tester la configuration Telegram
 */

import 'dotenv/config';
import telegramNotifier from '../src/services/telegram-notifier.js';
import logger from '../src/utils/logger.js';

async function testTelegram() {
  console.log('═'.repeat(60));
  console.log('📱 Test de Configuration Telegram');
  console.log('═'.repeat(60));
  console.log();

  // Check configuration
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const enabled = process.env.TELEGRAM_NOTIFICATIONS === 'true';

  console.log('📋 Configuration :');
  console.log(`   Bot Token  : ${botToken ? '✅ Configuré' : '❌ Manquant'}`);
  console.log(`   Chat ID    : ${chatId ? '✅ Configuré' : '❌ Manquant'}`);
  console.log(`   Enabled    : ${enabled ? '✅ Activé' : '❌ Désactivé'}`);
  console.log();

  if (!botToken || !chatId || !enabled) {
    console.log('❌ Configuration incomplète !');
    console.log('\n📝 Ajoutez dans .env :');
    console.log('TELEGRAM_NOTIFICATIONS=true');
    console.log('TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz');
    console.log('TELEGRAM_CHAT_ID=-1001234567890');
    console.log('\n💡 Guide : docs/TELEGRAM_SETUP.md');
    console.log('💡 Obtenir Chat ID : npm run get-chat-id\n');
    process.exit(1);
  }

  try {
    console.log('📤 Envoi du message de test...\n');

    const success = await telegramNotifier.testConnection();

    if (success) {
      console.log('═'.repeat(60));
      console.log('✅ TEST RÉUSSI !');
      console.log('═'.repeat(60));
      console.log();
      console.log('📱 Vérifiez votre channel Telegram, vous devriez avoir reçu :');
      console.log('   "✅ Test de Connexion"');
      console.log('   "Le scraper GitHub Security est correctement configuré !"');
      console.log();
      console.log('🎉 Telegram est prêt ! Vous pouvez maintenant déployer.');
      console.log();
    } else {
      throw new Error('Échec de l\'envoi du message');
    }

    // Test d'une notification de finding
    console.log('📤 Envoi d\'un exemple de finding...\n');

    await telegramNotifier.notifyFinding({
      id: 'test-123',
      repository_name: 'example/test-repo',
      repository_url: 'https://github.com/example/test-repo',
      repository_owner: 'example',
      file_path: '.env',
      pattern_type: 'private_key',
      severity: 'critical',
      matched_pattern: 'PRIVATE_KEY=0x***',
      code_snippet: 'PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478...',
      status: 'new',
      discovered_at: new Date().toISOString(),
      metadata: {
        confidence: 95,
        match_count: 1,
      },
    });

    console.log('✅ Exemple de finding envoyé !');
    console.log('📱 Vérifiez votre channel pour voir le format des alertes.\n');

    console.log('═'.repeat(60));
    console.log('🎉 Telegram est 100% fonctionnel !');
    console.log('═'.repeat(60));
    console.log();

  } catch (error: any) {
    console.log('═'.repeat(60));
    console.log('❌ TEST ÉCHOUÉ');
    console.log('═'.repeat(60));
    console.log();
    console.log('Erreur :', error.message);
    console.log();
    console.log('🔧 Vérifications :');
    console.log('   1. Le bot token est correct ?');
    console.log('   2. Le chat ID est correct ?');
    console.log('   3. Le bot est admin du channel ?');
    console.log('   4. Le channel existe bien ?');
    console.log();
    console.log('💡 Guide : docs/TELEGRAM_SETUP.md');
    console.log('💡 Obtenir Chat ID : npm run get-chat-id\n');
    process.exit(1);
  }
}

testTelegram();