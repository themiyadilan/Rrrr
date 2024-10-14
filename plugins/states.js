const fs = require('fs');
const path = require('path');
const { readEnv } = require('../lib/database');
const { cmd, commands } = require('../command');
const { downloadMediaMessage, getContentType } = require('@adiwajshing/baileys');

// Flag for listener initialization
let isStatusListenerInitialized = false;
let statusMap = {}; // Cache for storing statuses by message ID

// Initialize status listener if not already done
const initializeStatusListener = async (conn) => {
    if (isStatusListenerInitialized) return;

    try {
        const config = await readEnv();

        conn.ev.on('messages.upsert', async ({ messages: [message] }) => {
            if (!message || !message.message) return;

            message.message = getContentType(message.message) === 'ephemeralMessage'
                ? message.message.ephemeralMessage.message
                : message.message;

            if (message.key?.remoteJid === 'status@broadcast') {
                const { participant: sender, id: messageId } = message.key;
                const senderPushName = message.pushName || sender;
                const contentType = getContentType(message.message);
                const caption = message.message.conversation || message.message.caption || 'No caption provided.';

                console.log(`🌟 Status posted by: ${senderPushName} | Media Type: ${contentType || 'No media'} | Caption: "${caption}"`);

                // Cache status if the bot posted it
                if (sender === conn.user.id) {
                    statusMap[messageId] = { contentType, message: message.message, caption };
                    console.log(`✅ Status saved with ID: ${messageId}`);
                }

                // Optionally send "status seen" message
                if (config.STATES_SEEN_MESSAGE_SEND_SEND === 'true') {
                    await conn.sendMessage(sender, { text: config.STATES_SEEN_MESSAGE });
                    console.log(`👁️ Status seen message sent to: ${senderPushName}`);
                }
            }
        });

        isStatusListenerInitialized = true;
        console.log('🚀 Status listener initialized successfully.');
    } catch (error) {
        console.error('❌ Error initializing status listener:', error);
    }
};

// Send status reply based on the cached status
const sendRepliedStatus = async (conn, replyTo, statusId) => {
    const status = statusMap[statusId];
    if (!status) {
        console.log('⚠️ No status found for this reply.');
        return;
    }

    const { contentType, message, caption } = status;

    try {
        const sendOptions = {
            image: { image: message.imageMessage, caption },
            video: { video: message.videoMessage, caption },
            audio: { audio: message.audioMessage, ptt: true },
            default: { text: caption }
        };

        await conn.sendMessage(replyTo, sendOptions[contentType] || sendOptions.default);
        console.log(`${contentType === 'image' ? '📷' : contentType === 'video' ? '🎥' : contentType === 'audio' ? '🎙️' : '📝'} Status sent.`);
    } catch (error) {
        console.error('❌ Error sending status reply:', error);
    }
};

// Command handler for replying to statuses
cmd({ on: "body" }, async (conn, mek, m, { from, body }) => {
    try {
        await initializeStatusListener(conn);

        if (body.startsWith("!statusreply")) {
            const statusId = body.split(" ")[1]; // Expecting the status ID after the command
            await sendRepliedStatus(conn, from, statusId);
        }
    } catch (error) {
        console.error('❌ Error in command handler:', error);
    }
});
