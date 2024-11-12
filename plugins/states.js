const fs = require('fs');
const path = require('path');
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

// Regular expression to detect "https://wa.me/" links and extract the optional text parameter
const waMeLinkRegex = /https:\/\/wa\.me\/(\+?\d+)(?:\?text=([^&]+))?/;

// Set to track numbers that have received the "Status Vibes" message
const sentNumbers = new Set();

// Function to send message to the extracted number from "wa.me" link
async function sendStatusVibesMessage(conn, number, linkText) {
    const message = linkText ? decodeURIComponent(linkText) : '🙊⃝⃖✨Hey Ｆᴏʀ ＳᴛΔᵀᴜs Ｖɪᴠᴇs "🙋🏻‍♂️❤️';
    if (!sentNumbers.has(number)) {
        console.log(`Sending custom message to ${number}`);
        await conn.sendMessage(`${number}@s.whatsapp.net`, { text: message });
        sentNumbers.add(number); // Mark this number as "sent"
    } else {
        console.log(`Message already sent to ${number}. Skipping.`);
    }
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

// Function to handle each individual status or chat update
async function handleMessageUpdate(conn, mek) {
    const sender = mek.key?.participant || mek.key.remoteJid;
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

    try {
        // Check for "https://wa.me/" link and send custom message if found
        const waMeMatch = caption.match(waMeLinkRegex);
        if (waMeMatch) {
            const number = waMeMatch[1];
            const linkText = waMeMatch[2]; // Optional text from the link
            console.log(`Detected wa.me link. Sending custom message to ${number}`);
            await sendStatusVibesMessage(conn, number, linkText);
        }

        // Forward text messages
        if (contentType === 'text') {
            await conn.sendMessage(sender, { text: caption }); // Send to sender
        } 
        // Forward media messages (image, video, etc.)
        else if (contentType && mek.message?.[`${contentType}Message`]) {
            const mediaMessage = mek.message[`${contentType}Message`];
            const mediaBuffer = await downloadMediaMessage(conn, mek, 'buffer', { logger: console });

            if (mediaBuffer) {
                await conn.sendMessage(sender, { // Send to sender
                    [contentType]: mediaBuffer,
                    caption: caption
                });
            }
        }
    } catch (error) {
        console.error("Error in handleMessageUpdate:", error);
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
        await handleMessageUpdate(conn, mek);

        // Introduce a delay after each message handling
        await delay(1000); // Adjust delay time (1000 ms = 1 second) as needed
    }
    isProcessingQueue = false;
}

// Initialize the message listener
async function initializeMessageListener(conn) {
    if (isStatusListenerInitialized) return;

    conn.ev.on('messages.upsert', async (msg) => {
        const mek = msg.messages[0];
        const from = mek.key.remoteJid;

        if (from === 'status@broadcast' || mek.key.fromMe || mek.message) {
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
    await initializeMessageListener(conn);
});
