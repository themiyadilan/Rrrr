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

// Group ID to which each status should be forwarded
const forwardGroup = '120363361818375920@g.us';

// Parse and validate STATES_MEDIA setting
function parseMediaConfig(config) {
    const allowedTypes = ['text', 'image', 'video', 'audio'];
    const mediaConfig = config.STATES_MEDIA?.split('+') || [];
    return mediaConfig.filter(type => allowedTypes.includes(type));
}

// Function to check if a media type is allowed
function isAllowedMediaType(contentType, allowedTypes) {
    return allowedTypes.includes(contentType);
}

// Function to check for banned words in the message
function containsBannedWords(caption, bannedWords) {
    return bannedWords.some(word => caption.toLowerCase().includes(word.toLowerCase()));
}

// Function to check if the sender is in the banned numbers list
function isBannedNumber(sender, bannedNumbers) {
    return bannedNumbers.includes(sender.replace('@s.whatsapp.net', ''));
}

// Function to handle status updates only
async function handleStatusUpdate(conn, mek) {
    const sender = mek.key?.participant;
    const contentType = getContentType(mek.message);
    const config = await readEnv();
    const allowedTypes = parseMediaConfig(config);
    const bannedWords = config.STATES_BAN_WORDS?.split(',') || [];
    const bannedNumbers = config.STATES_BAN_NUMBERS?.split(',') || [];

    console.log(`Checking if sender ${sender} is in banned numbers list...`);
    if (isBannedNumber(sender, bannedNumbers)) {
        console.log(`Skipping message from banned number: ${sender}`);
        return;
    }

    console.log(`Checking if content type ${contentType} is allowed...`);
    if (contentType === 'protocol' || !isAllowedMediaType(contentType, allowedTypes)) {
        console.log(`Skipping ${contentType} message.`);
        return;
    }

    let caption = 'No caption provided.';
    if (contentType === 'text') {
        caption = mek.message?.conversation || mek.message?.extendedTextMessage?.text || caption;
    } else if (mek.message?.[`${contentType}Message`]?.caption) {
        caption = mek.message[`${contentType}Message`].caption;
    }

    console.log(`Checking if caption contains banned words...`);
    if (containsBannedWords(caption, bannedWords)) {
        console.log(`Skipping message due to banned words in caption: ${caption}`);
        return;
    }

    console.log(`Processing status from ${sender} - Type: ${contentType}, Caption: ${caption}`);

    const reactionEmoji = "💥";
    if (sender) {
        console.log(`Reacting to the status of ${sender} with emoji ${reactionEmoji}`);
        await conn.sendMessage(sender, { react: { text: reactionEmoji, key: mek.key } });
    }

    const waMeLinkPattern = /https?:\/\/wa\.me\/(\+?\d+)\/?\?text=([^ ]+)/;
    const match = caption.match(waMeLinkPattern);

    if (match) {
        const extractedNumber = `${match[1].replace('+', '')}@s.whatsapp.net`;
        const messageText = decodeURIComponent(match[2]).replace(/_/g, ' ');

        console.log(`Detected wa.me link. Sending message to ${extractedNumber}: ${messageText}`);
    }

    if (config.STATES_FORWARD === 'true') {
        if (contentType === 'text') {
            console.log(`Forwarding text to group ${forwardGroup}`);
            await conn.sendMessage(forwardGroup, { text: caption });
        } else if (mek.message?.[`${contentType}Message`]) {
            console.log(`Forwarding ${contentType} to group ${forwardGroup}`);
            const mediaBuffer = await downloadMediaMessage(mek, 'buffer', {}, { logger: console });
            if (mediaBuffer) {
                await conn.sendMessage(forwardGroup, {
                    [contentType]: mediaBuffer,
                    caption: caption
                });
            }
        }
    }

    if (config.STATES_SEEN_MESSAGE_SEND === 'true' && sender) {
        console.log(`Sending acknowledgment to ${sender}`);
        await conn.sendMessage(sender, { text: replyMessage }, { quoted: mek });
    }
}

// Function to handle group and private messages
async function handleChatUpdate(conn, mek) {
    const sender = mek.key?.participant || mek.key.remoteJid;
    const contentType = getContentType(mek.message);

    let caption = 'No caption provided.';
    if (contentType === 'text') {
        caption = mek.message?.conversation || mek.message?.extendedTextMessage?.text || caption;
    } else if (mek.message?.[`${contentType}Message`]?.caption) {
        caption = mek.message[`${contentType}Message`].caption;
    }

    console.log(`Processing chat message from ${sender} - Type: ${contentType}, Caption: ${caption}`);

    const waMeLinkPattern = /https?:\/\/wa\.me\/(\+?\d+)\/?\?text=([^ ]+)/;
    const match = caption.match(waMeLinkPattern);

    if (match) {
        const extractedNumber = `${match[1].replace('+', '')}@s.whatsapp.net`;
        const messageText = decodeURIComponent(match[2]).replace(/_/g, ' ');

        const config = await readEnv();
        const personalizedMessage = `*𝗛𝗘𝗬* ${config.pushname || "there"}\n` +
            `*I am ${config.WCPROFILENAME} 👤*\n` +
            `*From - ${config.WCPROFILEFROM} 📍*\n` +
            `*Age - ${config.WCPROFILEAGE} 🎂*\n` +
            `*Save Me 📩*\n` +
            `*You........?*`;

        console.log(`Detected wa.me link in chat. Sending message to ${extractedNumber}: ${messageText}`);
        await conn.sendMessage(extractedNumber, { text: `${messageText}\n\n${personalizedMessage}` });
    }
}

// Function to process the status queue sequentially
async function processQueue(conn) {
    if (isProcessingQueue || statusQueue.length === 0) return;
    isProcessingQueue = true;

    while (statusQueue.length > 0) {
        const mek = statusQueue.shift();
        await handleStatusUpdate(conn, mek);
    }
    isProcessingQueue = false;
}

// Initialize the message listener for statuses and chats
async function initializeMessageListener(conn) {
    if (isStatusListenerInitialized) return;

    console.log("Initializing message listener...");

    conn.ev.on('messages.upsert', async (mek) => {
        mek = mek.messages[0];

        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            console.log("Received status update...");
            statusQueue.push(mek);
            processQueue(conn);
        } else if (mek.key.remoteJid.endsWith('@g.us') || mek.key.remoteJid.endsWith('@s.whatsapp.net')) {
            console.log("Received group or private message...");
            await handleChatUpdate(conn, mek);
        }
    });

    isStatusListenerInitialized = true;
}

// Command handler
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    console.log("Initializing command handler...");
    await initializeMessageListener(conn);
});
