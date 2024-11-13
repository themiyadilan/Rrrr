const { cmd, commands } = require('../command');
const { fetchJson } = require('../lib/functions');

cmd({
  pattern: "save?",
  desc: "Check if contact is saved",
  category: "main",
  react: "",
  filename: __filename
}, async (conn, mek, m, { from, sender, isOwner }) => {
  try {
    // Only allow the bot owner to use this command
    if (!isOwner) return;

    // Attempt to check if the contact is on WhatsApp using fetchJson
    try {
      const contact = await fetchJson(`https://api.whatsapp.com/v1/contacts/${sender}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      // If the contact exists, we assume it's saved and react with ✅
      if (contact && contact.status === 'active') {
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
      } else {
        // If the contact does not exist or is inactive, react with ❌
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      }
    } catch (error) {
      // If there's an error, assume the contact is not saved
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
  } catch (error) {
    console.error("Error checking contact save status:", error);
  }
});
