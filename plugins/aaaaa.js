const { cmd, commands } = require('../command');

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

    try {
      // Check if the contact exists in the contact list
      const contact = await conn.onWhatsApp(sender + '@s.whatsapp.net');
      
      if (contact && contact.length > 0 && contact[0].exists) {
        // If contact exists, react with ✅
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
      } else {
        // If contact does not exist, react with ❌
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      }
    } catch (error) {
      console.error("Error checking contact save status:", error);
      await conn.sendMessage(from, { react: { text: "🤍", key: mek.key } });
    }
  } catch (error) {
    console.error("General error checking contact save status:", error);
  }
});
