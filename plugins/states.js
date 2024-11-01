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

// Storage for bot-posted statuses
let botStatuses = {};

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

    // Check if this is a status posted by the bot
    if (mek.key.fromMe) {
        // Store the bot's status for future replies
        botStatuses[mek.key.id] = mek;
        console.log(`Stored bot status: ${mek.key.id}`);
        return;
    }

    // If someone replies to a bot's status, send the original status back
    if (mek.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const quotedStatusId = mek.message.extendedTextMessage.contextInfo.stanzaId;
        
        if (botStatuses[quotedStatusId]) {
            console.log(`User ${sender} replied to bot's status. Sending original status back.`);
            await resendStatus(conn, sender, botStatuses[quotedStatusId]);
        } else {
            console.log(`No bot status found for quoted ID: ${quotedStatusId}`);
        }
    }
}

// Function to resend a stored status
async function resendStatus(conn, recipient, statusMek) {
    const contentType = getContentType(statusMek.message);
    const caption = statusMek.message[`${contentType}Message`]?.caption || 'Here’s the status you replied to.';

    console.log(`Resending status to ${recipient}: Content Type: ${contentType}, Caption: ${caption}`);

    if (contentType === 'text') {
        await conn.sendMessage(recipient, { text: statusMek.message.conversation });
    } else if (['image', 'video', 'audio', 'document'].includes(contentType)) {
        const mediaBuffer = await downloadMediaMessage(statusMek, 'buffer', {}, { logger: console });
        await conn.sendMessage(recipient, { [contentType]: mediaBuffer, caption });
    } else {
        console.warn(`Unsupported content type: ${contentType}`);
    }

    // Optionally respond to the sender
    const config = await readEnv();
    if (config.STATES_SEEN_MESSAGE_SEND === 'true' && recipient) {
        const message = getRandomResponse();
        await conn.sendMessage(recipient, { text: message });
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
