const fs = require('fs');
const path = require('path');
const { readEnv } = require('../lib/database');
const { cmd, commands } = require('../command');
const { fetchJson } = require('../lib/functions'); // Assuming you have this function

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
                const ownerJid = `${ownerNumber}`; // Format the owner's number

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

    switch (contentType) {
        case 'image':
            await conn.sendMessage(ownerJid, {
                image: { url: mek.message.imageMessage.url }, // Access the image URL correctly
                caption: caption || 'No caption provided.',
            });
            console.log(`Forwarded image status to ${ownerJid}`);
            break;
        case 'video':
            await conn.sendMessage(ownerJid, {
                video: { url: mek.message.videoMessage.url }, // Access the video URL correctly
                caption: caption || 'No caption provided.',
            });
            console.log(`Forwarded video status to ${ownerJid}`);
            break;
        case 'audio':
            await conn.sendMessage(ownerJid, {
                audio: { url: mek.message.audioMessage.url }, // Access the audio URL correctly
                caption: caption || 'No caption provided.',
            });
            console.log(`Forwarded audio status to ${ownerJid}`);
            break;
        case 'document':
            await conn.sendMessage(ownerJid, {
                document: { url: mek.message.documentMessage.url }, // Access the document URL correctly
                caption: caption || 'No caption provided.',
            });
            console.log(`Forwarded document status to ${ownerJid}`);
            break;
        default:
            console.log('Unsupported content type for forwarding:', contentType);
            break;
    }
}

// Command handler (if needed)
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    // Initialize the status listener if it's not already done
    await initializeStatusListener(conn);

    // Additional command handling code can go here
    // You can implement your other functionalities as required
});
