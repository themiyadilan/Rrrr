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

// Storage for bot-posted statuses
let botStatuses = {};

// Function to handle each individual status update
async function handleStatusUpdate(conn, mek) {
    try {
        const sender = mek.key?.participant;
        const contentType = getContentType(mek.message);

        // Skip protocol messages
        if (contentType === 'protocol') {
            console.log("Skipping protocol message.");
            return;
        }

        // Check if this is a status posted by the bot
        if (mek.key.fromMe) {
            // Store the bot's status for future replies
            botStatuses[mek.key.id] = mek;
            console.log(`Stored bot status: ${mek.key.id}`);
            return;
        }

        // Check if someone replied to the bot's status
        if (mek.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quotedStatusId = mek.message.extendedTextMessage.contextInfo.stanzaId;

            // If the quoted message is a bot's status, send it back to the replier
            if (botStatuses[quotedStatusId]) {
                console.log(`User ${sender} replied to bot's status. Sending original status back.`);
                await resendStatus(conn, sender, botStatuses[quotedStatusId]);
            } else {
                console.log(`Quoted status ID ${quotedStatusId} not found in bot statuses.`);
            }
        }

        // Check if the bot replied to a status posted by someone else
        if (mek.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quotedMessage = mek.message.extendedTextMessage.contextInfo.quotedMessage;
            const quotedStatusId = mek.message.extendedTextMessage.contextInfo.stanzaId;

            // If the bot replied to someone else's status, send that status to the original poster
            if (!mek.key.fromMe && botStatuses[quotedStatusId]) {
                const originalSender = quotedMessage.key?.participant; // Get the original sender of the quoted message
                console.log(`Bot replied to status from ${originalSender}. Sending original status back.`);
                await resendStatus(conn, originalSender, botStatuses[quotedStatusId]);
            } else {
                console.log(`Bot's reply did not match any stored statuses. Quoted Status ID: ${quotedStatusId}`);
            }
        }
    } catch (error) {
        console.error(`Error in handleStatusUpdate: ${error.message}`);
    }
}

// Function to resend a stored status
async function resendStatus(conn, recipient, statusMek) {
    try {
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
    } catch (error) {
        console.error(`Error in resendStatus: ${error.message}`);
    }
}

// Function to process the queue sequentially
async function processQueue(conn) {
    if (isProcessingQueue || statusQueue.length === 0) return;
    isProcessingQueue = true;

    console.log('Processing status queue...');
    while (statusQueue.length > 0) {
        const mek = statusQueue.shift();
        await handleStatusUpdate(conn, mek);
    }
    isProcessingQueue = false;
    console.log('Finished processing status queue.');
}

// Initialize the status listener
async function initializeStatusListener(conn) {
    if (isStatusListenerInitialized) return;

    conn.ev.on('messages.upsert', async (mek) => {
        try {
            mek = mek.messages[0];
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                statusQueue.push(mek);
                console.log(`New status message received. ID: ${mek.key.id}`);
                processQueue(conn);
            }
        } catch (error) {
            console.error(`Error in message upsert event: ${error.message}`);
        }
    });

    isStatusListenerInitialized = true;
    console.log('Status listener initialized.');
}

// Command handler
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    await initializeStatusListener(conn);
    console.log(`Command received: ${body} from ${from}`);
});
