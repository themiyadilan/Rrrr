const { cmd } = require('../command');

cmd({
  pattern: "menuu",
  desc: "Display main menu",
  category: "main",
  filename: __filename
}, async (conn, mek, m, {
  from, reply
}) => {
  try {
    // Send the main menu reply
    await reply(`*Dila MD BOT Main Menu*

_reply the relevant number and get the relevant menu_

owner menu - 1
downloaded menu - 2
states menu - 3`);

    // Proper way to listen for user replies with `.on`
    conn.ev.on('messages.upsert', async (msg) => {
      const message = msg.messages[0];
      if (!message.key.remoteJid === from || message.key.fromMe) return; // Check the correct chat and ensure it's not a self-message
      
      const userReply = message.message?.conversation || '';
      if (!userReply) return;

      switch (userReply.trim()) {
        case '1':
          await conn.sendMessage(from, { text: '*Owner Menu*\n\ntype owner command ✅' }, { quoted: mek });
          break;
        case '2':
          await conn.sendMessage(from, { text: '*Downloaded Menu*\n\ntype downloaded command💥' }, { quoted: mek });
          break;
        case '3':
          await conn.sendMessage(from, { text: '*States Menu*\n\ntype states command❌' }, { quoted: mek });
          break;
        default:
          await conn.sendMessage(from, { text: 'Invalid response. Please reply with 1, 2, or 3.' }, { quoted: mek });
      }
    });
  } catch (e) {
    console.error(e);
    await reply(`Error: ${e.message}`);
  }
});
