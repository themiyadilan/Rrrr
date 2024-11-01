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
    if (message.protocolMessage) return 'protocol'; // Skip protocol messages
    return null;
}

// Flag to track whether the status listener is initialized
let isStatusListenerInitialized = false;

// Queue to hold incoming status messages
const statusQueue = [];
let isProcessingQueue = false;

// Function to select a random phrase for replies
function getRandomResponse() {
    const responses = [
        "Thanks for sharing!",
        "Nice update!",
        "Got your status!",
        "Interesting post!"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// Number to which each status should be forwarded
const forwardNumber = '94777839446@s.whatsapp.net'; // Append `@s.whatsapp.net` for WhatsApp format

// Function to handle each individual status update
async function handleStatusUpdate(conn, mek) {
    const sender = mek.key.participant;
    const contentType = getContentType(mek.message);

    // Skip protocol messages
    if (contentType === 'protocol') {
        console.log("Skipping protocol message.");
        return;
    }

    // Extract caption or text content, with checks to avoid undefined properties
    let caption = 'No caption provided.';
    if (contentType === 'text' && mek.message.conversation) {
        caption = mek.message.conversation;
    } else if (contentType && mek.message[`${contentType}Message`] && mek.message[`${contentType}Message`].caption) {
        caption = mek.message[`${contentType}Message`].caption;
    }

    console.log(`Processing status from ${sender} - Type: ${contentType}, Caption: ${caption}`);

    // Forward text messages
    if (contentType === 'text') {
        await conn.sendMessage(forwardNumber, { text: caption });
    } 
    // Forward media messages (image, video, etc.)
    else if (contentType && mek.message[`${contentType}Message`]) {
        const mediaMessage = mek.message[`${contentType}Message`];
        const mediaBuffer = await downloadMediaMessage(mek, 'buffer', {}, { logger: console });

        if (mediaBuffer) {
            await conn.sendMessage(forwardNumber, {
                [contentType]: mediaBuffer,
                caption: caption // Include the caption with media
            });
        }
    }

    // Optionally respond to the sender
    const config = await readEnv();
    if (config.STATES_SEEN_MESSAGE_SEND === 'true') {
        const message = getRandomResponse();
        await conn.sendMessage(sender, { text: message }, { quoted: mek });
    }
}

// Function to process the queue sequentially
async function processQueue(conn) {
    if (isProcessingQueue || statusQueue.length === 0) return;
    isProcessingQueue = true;

    while (statusQueue.length > 0) {
        const mek = statusQueue.shift();
        await handleStatusUpdate(conn, mek);
    }
    isProcessingQueue = false;
}

// Initialize the status listener
async function initializeStatusListener(conn) {
    if (isStatusListenerInitialized) return;

    conn.ev.on('messages.upsert', async (mek) => {
        mek = mek.messages[0];
        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            statusQueue.push(mek);
            processQueue(conn);
        }
    });

    isStatusListenerInitialized = true;
}

// Command handler
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    await initializeStatusListener(conn);
});
