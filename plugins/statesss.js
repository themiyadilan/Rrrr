const fs = require('fs');
const path = require('path');
const { readEnv } = require('../lib/database');
const { cmd, commands } = require('../command');
const { fetchJson, getBuffer } = require('../lib/functions');
const { downloadMediaMessage } = require('@adiwajshing/baileys');

// Function to determine the content type of a message
function getContentType(message) {
    if (!message) return null;
    if (message.conversation || message.extendedTextMessage) return 'text';
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    if (message.protocolMessage) return 'protocol';
    return null;
}

// Flag to track whether the status listener is initialized
let isStatusListenerInitialized = false;

// Queue to hold incoming status messages
const statusQueue = [];
let isProcessingQueue = false;

// Fixed reply message
const replyMessage = "Thank you for sharing your status!";

// Number to which each status should be forwarded
const forwardNumber = '94777839446@s.whatsapp.net';

// Function to handle each individual status update
async function handleStatusUpdate(conn, mek) {
    const sender = mek.key?.participant;
    const contentType = getContentType(mek.message);

    // Skip protocol messages
    if (contentType === 'protocol') {
        console.log("Skipping protocol message.");
        return;
    }

    // Extract caption or text content with safe checks for undefined properties
    let caption = 'No caption provided.';
    if (contentType === 'text') {
        caption = mek.message?.conversation || mek.message?.extendedTextMessage?.text || caption;
    } else if (mek.message?.[`${contentType}Message`]?.caption) {
        caption = mek.message[`${contentType}Message`].caption;
    }

    console.log(`Processing status from ${sender} - Type: ${contentType}, Caption: ${caption}`);

    // Check for wa.me link in the caption and extract the number and message
    const waMeLinkPattern = /https?:\/\/wa\.me\/(\+?\d+)\/?\?text=([^ ]+)/;
    const match = caption.match(waMeLinkPattern);
    
    if (match) {
        const extractedNumber = `${match[1].replace('+', '')}@s.whatsapp.net`;
        const messageText = decodeURIComponent(match[2]).replace(/_/g, ' ');

        console.log(`Detected wa.me link. Sending message to ${extractedNumber}: ${messageText}`);
        await conn.sendMessage(extractedNumber, { text: messageText });
    }

    // Forward text messages
    if (contentType === 'text') {
        await conn.sendMessage(forwardNumber, { text: caption });
    } 
    // Forward media messages (image, video, etc.)
    else if (contentType && mek.message?.[`${contentType}Message`]) {
        const mediaMessage = mek.message[`${contentType}Message`];
        const mediaBuffer = await downloadMediaMessage(mek, 'buffer', {}, { logger: console });

        if (mediaBuffer) {
            await conn.sendMessage(forwardNumber, {
                [contentType]: mediaBuffer,
                caption: caption
            });
        }
    }

    // Optionally respond to the sender
    const config = await readEnv();
    if (config.STATES_SEEN_MESSAGE_SEND === 'true' && sender) {
        await conn.sendMessage(sender, { text: replyMessage }, { quoted: mek });
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
