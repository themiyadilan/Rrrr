const { readEnv } = require('../lib/database');
const { cmd } = require('../command');
const { downloadMediaMessage } = require('@adiwajshing/baileys');

// Function to determine the content type of a message
function getContentType(message) {
    if (!message) return null;
    if (message.conversation || message.extendedTextMessage) return 'text';
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    if (message.stickerMessage) return 'sticker';
    return null;
}

// Command handler for FUN_CHAT
cmd({ on: "body" }, async (conn, mek, m, { from }) => {
    const config = await readEnv();

    // Check if FUN_CHAT is enabled and if the chat is private (not a group)
    if (config.FUN_CHAT === 'true' && mek.key.remoteJid && !mek.key.remoteJid.includes('@g.us')) {
        const contentType = getContentType(mek.message);

        // Respond with the same text message
        if (contentType === 'text') {
            const text = mek.message.conversation || mek.message.extendedTextMessage?.text;
            await conn.sendMessage(from, { text });
        } 
        // Respond with the same media message (image, video, audio, document, or sticker)
        else if (contentType && mek.message[`${contentType}Message`]) {
            const mediaBuffer = await downloadMediaMessage(mek, 'buffer', {}, { logger: console });
            if (mediaBuffer) {
                await conn.sendMessage(from, { 
                    [contentType]: mediaBuffer,
                    caption: mek.message[`${contentType}Message`].caption || ''
                });
            }
        }
    }
});
