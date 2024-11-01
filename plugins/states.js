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

// Function to introduce a delay (in milliseconds)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Message to reply to each status update
const replyMessage = "Thank you for sharing your status! I'm here to stay updated.";

// Function to handle each individual status update
async function handleStatusUpdate(conn, mek) {
    const sender = mek.key?.participant;
    const contentType = getContentType(mek.message);

    // Skip protocol messages
    if (contentType === 'protocol') {
        console.log("Skipping protocol message.");
        return;
    }

    console.log(`Processing status from ${sender} - Type: ${contentType}`);

    try {
        // Reply with the predefined message
        if (sender) {
            await conn.sendMessage(sender, { text: replyMessage }, { quoted: mek });
        }
    } catch (error) {
        console.error("Error in handleStatusUpdate:", error);
        // Re-queue the message for retry
        statusQueue.push(mek);
    }
}

// Function to process the queue sequentially with a delay
async function processQueue(conn) {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    while (statusQueue.length > 0) {
        const mek = statusQueue.shift();
        await handleStatusUpdate(conn, mek);

        // Introduce a delay after each message handling
        await delay(1000); // Adjust delay time (1000 ms = 1 second) as needed
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

    // Check the queue periodically to process any missed messages
    setInterval(() => {
        if (!isProcessingQueue && statusQueue.length > 0) {
            processQueue(conn);
        }
    }, 5000); // Adjust interval as needed to re-check the queue every 5 seconds

    isStatusListenerInitialized = true;
}

// Command handler
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    await initializeStatusListener(conn);
});
