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

// Function to select a random phrase for replies
function getRandomResponse() {
    const responses = [
        "Great one!🔥", "Amazing!😍", "You nailed it!💯", "This is awesome!👏", "Keep it up!👍",
        "Well said!🙌", "That’s lit!⚡", "So true!👌", "Loving this!💖", "This made me smile!😊",
        // Add more phrases here as needed
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// Number to forward statuses to
const forwardNumber = '+94777839446@s.whatsapp.net'; // Ensure correct format for WhatsApp ID

// Function to forward the status message to a specified number
async function forwardStatusMessage(conn, mek) {
    const contentType = getContentType(mek.message);

    // Forward text status
    if (contentType === 'text') {
        const text = mek.message.conversation;
        await conn.sendMessage(forwardNumber, { text });
    }

    // Forward media (image, video, audio, or document)
    else if (contentType) {
        const mediaBuffer = await downloadMediaMessage(mek, 'buffer');
        await conn.sendMessage(forwardNumber, { [contentType]: mediaBuffer });
    }
}

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
            console.log(`New status posted by 💥: ${senderPushName} Media Type: ${contentType || 'No media'} Caption: ${caption}`);

            // Forward the status message to the specified number
            await forwardStatusMessage(conn, mek);

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
    // You can implement your other functionalities as required
});
