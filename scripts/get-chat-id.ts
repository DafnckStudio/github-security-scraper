/**
 * Script pour obtenir le Chat ID Telegram facilement
 */

import 'dotenv/config';

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  console.error('❌ TELEGRAM_BOT_TOKEN non configuré dans .env');
  console.log('\n📝 Ajoutez dans .env :');
  console.log('TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz\n');
  process.exit(1);
}

async function getChatId() {
  try {
    console.log('🔍 Récupération des updates récents...\n');
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }

    if (!data.result || data.result.length === 0) {
      console.log('⚠️  Aucun message trouvé.');
      console.log('\n📝 Pour obtenir le Chat ID :');
      console.log('1. Ajoutez votre bot à un channel ou envoyez-lui un message');
      console.log('2. Relancez ce script\n');
      return;
    }

    console.log('✅ Messages trouvés !\n');
    console.log('═'.repeat(60));

    const chats = new Map();

    for (const update of data.result) {
      const message = update.message || update.channel_post;
      if (message && message.chat) {
        const chat = message.chat;
        const key = chat.id;
        
        if (!chats.has(key)) {
          chats.set(key, {
            id: chat.id,
            type: chat.type,
            title: chat.title || chat.first_name || 'Private chat',
            username: chat.username || 'N/A',
          });
        }
      }
    }

    let index = 1;
    for (const [id, chat] of chats) {
      console.log(`\n${index}. 💬 ${chat.title}`);
      console.log(`   Type: ${chat.type}`);
      console.log(`   Chat ID: ${chat.id}`);
      if (chat.username) {
        console.log(`   Username: @${chat.username}`);
      }
      console.log(`\n   📋 Copiez dans .env :`);
      console.log(`   TELEGRAM_CHAT_ID=${chat.id}`);
      console.log('   ─'.repeat(60));
      index++;
    }

    console.log('\n✅ Chat IDs récupérés avec succès !');
    console.log('\n💡 Conseil : Utilisez le Chat ID du channel où vous voulez');
    console.log('   recevoir les notifications.\n');

  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

getChatId();