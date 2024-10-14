const fs = require('fs');
const path = require('path');
const { readEnv } = require('../lib/database');
const { cmd, commands } = require('../command');
const { downloadMediaMessage } = require('@adiwajshing/baileys');

// Flag to track status listener initialization
let isStatusListenerInitialized = false;

// Store all statuses posted by the bot with their message ID
let statusMap = {};

// Ensure the connection is passed properly
async function initializeStatusListener(conn) {
    if (isStatusListenerInitialized) return; // Prevent reinitialization

    // Load configuration
    const config = await readEnv();

    // Listen for new messages, including status updates
    conn.ev.on('messages.upsert', async (mek) => {
        mek = mek.messages[0]; // Get the first message from the array
        if (!mek.message) return; // Check if the message exists

        // Handle ephemeral messages
        mek.message = (getContentType(mek.message) === 'ephemeralMessage')
            ? mek.message.ephemeralMessage.message
            : mek.message;

        // Check if the message is from status updates
        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            const sender = mek.key.participant; // Get the participant who posted the status
            const senderPushName = mek.pushName || sender; // Get the push name or use the sender number if not available
            const contentType = getContentType(mek.message);
            const caption = mek.message.conversation || mek.message.caption || 'No caption provided.';

            // Log the output with sender's push name, content type, and caption
            console.log(`🌟 New status posted by 💥: ${senderPushName} | Media Type: ${contentType || 'No media'} | Caption: "${caption}"`);

            // If the bot posted the status, store it in the statusMap with its message ID
            if (sender === conn.user.id) {
                statusMap[mek.key.id] = {
                    contentType: contentType,
                    message: mek.message,
                    caption: caption
                };
                console.log(`✅ Status saved in memory with ID: ${mek.key.id}`);
            }

            // Check the config to decide whether to send the status seen message
            if (config.STATES_SEEN_MESSAGE_SEND_SEND === 'true') {
                const message = `${config.STATES_SEEN_MESSAGE}`;
                await conn.sendMessage(sender, { text: message });
                console.log(`👁️ Status seen message sent to: ${senderPushName}`);
            }
        }
    });

    isStatusListenerInitialized = true; // Mark the listener as initialized
    console.log('🚀 Status listener initialized successfully.');
}

// Function to send the replied-to status
async function sendRepliedStatus(conn, replyTo, statusId) {
    const status = statusMap[statusId];
    if (!status) {
        console.log('⚠️ No status found for this reply.');
        return;
    }

    const { contentType, message, caption } = status;

    // Send back the status media (if any) along with the caption
    if (contentType === 'image') {
        await conn.sendMessage(replyTo, { image: message.imageMessage, caption });
        console.log('📷 Image status sent.');
    } else if (contentType === 'video') {
        await conn.sendMessage(replyTo, { video: message.videoMessage, caption });
        console.log('🎥 Video status sent.');
    } else if (contentType === 'audio') {
        await conn.sendMessage(replyTo, { audio: message.audioMessage, ptt: true }); // Send as voice note
        console.log('🎙️ Audio status sent.');
    } else {
        await conn.sendMessage(replyTo, { text: caption });
        console.log('📝 Text status sent.');
    }
}

// Command handler (if needed)
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    // Initialize the status listener if it's not already done
    await initializeStatusListener(conn);

    // Check if someone replied to the bot's status
    if (from !== 'status@broadcast' && mek.message) {
        const contentType = getContentType(mek.message);

        // If someone replies to the bot's status
        if (contentType === 'conversation' || contentType === 'extendedTextMessage') {
            const replyTo = mek.key.remoteJid; // The person who replied
            const replyMessageId = mek.message.extendedTextMessage?.contextInfo?.stanzaId; // Get the ID of the replied status
            
            if (replyMessageId && statusMap[replyMessageId]) {
                const config = await readEnv();

                if (config.STATES_DOWNLOAD === 'true') {
                    // Send the status that was replied to
                    await sendRepliedStatus(conn, replyTo, replyMessageId);
                    console.log(`📩 Status with ID: ${replyMessageId} sent to ${replyTo}`);
                }
            } else {
                console.log('❌ No valid status found for the reply.');
            }
        }
    }
});

// Function to determine the content type of a message
function getContentType(message) {
    if (!message) return null;
    if (message.conversation) return 'text';
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    if (message.extendedTextMessage) return 'extendedTextMessage';
    return null;
                                                }
