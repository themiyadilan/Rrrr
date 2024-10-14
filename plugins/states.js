const fs = require('fs');
const path = require('path');
const { readEnv } = require('../lib/database');
const { cmd, commands } = require('../command');
const { fetchJson } = require('../lib/functions'); // Assuming you have this function
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
            console.log(`New status posted by: ${sender}`);

            // Check the config to decide whether to send the status seen message
            if (config.STATES_SEEN_MESSAGE_SEND_SEND === 'true') {
                const message = `${config.STATES_SEEN_MESSAGE}`;
                await conn.sendMessage(sender, { text: message });
            }

            // Check if STATES_DOWNLOAD is enabled
            if (config.STATES_DOWNLOAD === 'true') {
                const ownerNumber = config.OWNER_NUMBER; // Get owner's number from config
                const ownerJid = `${ownerNumber}@s.whatsapp.net`; // Format the owner's number

                // Forward the status content to the owner
                await forwardStatusToOwner(conn, mek, ownerJid);
            }
        }
    });

    isStatusListenerInitialized = true; // Mark the listener as initialized
}

// Function to forward status content to the owner
async function forwardStatusToOwner(conn, mek, ownerJid) {
    const contentType = getContentType(mek.message);
    let caption = mek.message.conversation || mek.message.caption || '';

    try {
        let media;

        switch (contentType) {
            case 'image':
                media = await downloadMediaMessage(mek.message.imageMessage);
                await conn.sendMessage(ownerJid, {
                    image: media,
                    caption: caption || 'No caption provided.',
                });
                console.log(`Forwarded image status to ${ownerJid}`);
                break;
            case 'video':
                media = await downloadMediaMessage(mek.message.videoMessage);
                await conn.sendMessage(ownerJid, {
                    video: media,
                    caption: caption || 'No caption provided.',
                });
                console.log(`Forwarded video status to ${ownerJid}`);
                break;
            case 'audio':
                media = await downloadMediaMessage(mek.message.audioMessage);
                await conn.sendMessage(ownerJid, {
                    audio: media,
                    caption: caption || 'No caption provided.',
                });
                console.log(`Forwarded audio status to ${ownerJid}`);
                break;
            case 'document':
                media = await downloadMediaMessage(mek.message.documentMessage);
                await conn.sendMessage(ownerJid, {
                    document: media,
                    caption: caption || 'No caption provided.',
                });
                console.log(`Forwarded document status to ${ownerJid}`);
                break;
            default:
                console.log('Unsupported content type for forwarding:', contentType);
                break;
        }
    } catch (error) {
        console.error('Error forwarding status:', error);
    }
}

// Command handler (if needed)
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    // Initialize the status listener if it's not already done
    await initializeStatusListener(conn);

    // Additional command handling code can go here
    // You can implement your other functionalities as required
});
