const { readEnv } = require('../lib/database');
const { cmd } = require('../command');

// Handler to manage online presence based on ALLOWS_ONLINE key
cmd({on: "body"}, async (conn, mek, m, { from, isOwner }) => {
    const config = await readEnv();

    // If ALLOWS_ONLINE is false, prevent showing online status and changing last seen
    if (config.ALLOWS_ONLINE === 'false') {
        // Keep the bot active but do not change the last seen or show online status
        await conn.sendPresenceUpdate('paused', from); // Ensure the bot doesn't show online
    }

    // Bot functionalities (messages, commands, etc.) remain operational here
    // Example: Add bot's command handling below without impacting presence status
    // e.g., handling an incoming message, etc.
});
