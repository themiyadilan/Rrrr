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

    // Check if the contact is saved in the bot's contacts
    const contact = await conn.isOnWhatsApp(sender);

    if (contact) {
      // If contact is saved, react with ✅
      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } else {
      // If contact is not saved, react with ❌
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
  } catch (error) {
    console.error("Error checking contact save status:", error);
  }
});
