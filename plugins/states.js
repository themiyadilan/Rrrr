const fs = require('fs');
const { readEnv } = require('../lib/database');
const { cmd } = require('../command');
const { downloadMediaMessage } = require('@adiwajshing/baileys'); // Ensure you have this package

// Function to determine the content type of a message
function getContentType(message) {
    if (!message) return null;
    if (message.conversation) return 'text';
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    return null;
}

// Flag to track whether the status listener is initialized
let isStatusListenerInitialized = false;

// Initialize the status listener
async function initializeStatusListener(conn) {
    if (isStatusListenerInitialized) return; // Prevent reinitialization

    const config = await readEnv();

    // Listen for new messages, including status updates
    conn.ev.on('messages.upsert', async (mek) => {
        mek = mek.messages[0]; // Get the first message from the array
        if (!mek.message) return; // Check if the message exists

        // Handle ephemeral messages
        mek.message = mek.message.ephemeralMessage
            ? mek.message.ephemeralMessage.message
            : mek.message;

        // Check if the message is from status updates
        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            const sender = mek.key.participant; // Get the sender
            console.log(`New status posted by: ${sender}`);

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
    let caption = mek.message.conversation || mek.message.caption || 'No caption provided.';

    try {
        let media;

        // Log the message for debugging
        console.log('Message content:', JSON.stringify(mek.message, null, 2));

        switch (contentType) {
            case 'image':
                if (mek.message.imageMessage) {
                    media = await downloadMediaMessage(mek.message.imageMessage);
                    await conn.sendMessage(ownerJid, {
                        image: media,
                        caption: caption,
                    });
                    console.log(`Forwarded image status to ${ownerJid}`);
                } else {
                    console.log('Image message is not present.');
                }
                break;

            case 'video':
                if (mek.message.videoMessage) {
                    media = await downloadMediaMessage(mek.message.videoMessage);
                    await conn.sendMessage(ownerJid, {
                        video: media,
                        caption: caption,
                    });
                    console.log(`Forwarded video status to ${ownerJid}`);
                } else {
                    console.log('Video message is not present.');
                }
                break;

            case 'audio':
                if (mek.message.audioMessage) {
                    media = await downloadMediaMessage(mek.message.audioMessage);
                    await conn.sendMessage(ownerJid, {
                        audio: media,
                        caption: caption,
                    });
                    console.log(`Forwarded audio status to ${ownerJid}`);
                } else {
                    console.log('Audio message is not present.');
                }
                break;

            case 'document':
                if (mek.message.documentMessage) {
                    media = await downloadMediaMessage(mek.message.documentMessage);
                    await conn.sendMessage(ownerJid, {
                        document: media,
                        caption: caption,
                    });
                    console.log(`Forwarded document status to ${ownerJid}`);
                } else {
                    console.log('Document message is not present.');
                }
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
    await initializeStatusListener(conn);
    // Additional command handling code can go here
});
