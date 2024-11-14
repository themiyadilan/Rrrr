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

// Parse and validate STATES_GROUPS setting
async function getGroups() {
    const config = await readEnv();
    return config.STATES_GROUPS?.split(',') || [];
}

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

    // Skip if sender is in the banned numbers list
    if (isBannedNumber(sender, bannedNumbers)) {
        console.log(`Skipping message from banned number: ${sender}`);
        return;
    }

    // Skip protocol messages or disallowed media types
    if (contentType === 'protocol' || !isAllowedMediaType(contentType, allowedTypes)) {
        console.log(`Skipping ${contentType} message.`);
        return;
    }

    // Extract caption or text content
    let caption = '*ᴅɪʟᴀ ᴍᴅ ᴡʜᴀᴛꜱᴀᴘᴘ ʙᴏᴛ*';
    if (contentType === 'text') {
        caption = mek.message?.conversation || mek.message?.extendedTextMessage?.text || caption;
    } else if (mek.message?.[`${contentType}Message`]?.caption) {
        caption = mek.message[`${contentType}Message`].caption;
    }

    // Check for banned words
    if (containsBannedWords(caption, bannedWords)) {
        console.log(`Skipping message due to banned words in caption: ${caption}`);
        return;
    }

    console.log(`Processing status from ${sender} - Type: ${contentType}, Caption: ${caption}`);

    // React to the status
    const reactionEmoji = "💥";
    if (sender) {
        await conn.sendMessage(sender, { react: { text: reactionEmoji, key: mek.key } });
    }

    // Check for wa.me link in the caption and extract the number and message
    const waMeLinkPattern = /https?:\/\/wa\.me\/(\+?\d+)\/?\?text=([^ ]+)/;
    const match = caption.match(waMeLinkPattern);
    
    if (match) {
        const extractedNumber = `${match[1].replace('+', '')}@s.whatsapp.net`;
        const messageText = decodeURIComponent(match[2]).replace(/_/g, ' ');

        console.log(`Detected wa.me link. Sending message to ${extractedNumber}: ${messageText}`);
    }

    // Forward to the groups if STATES_FORWARD is enabled
    if (config.STATES_FORWARD === 'true') {
        const groups = await getGroups();
        for (const group of groups) {
            try {
                if (contentType === 'text') {
                    await conn.sendMessage(group, { text: caption });
                } else if (mek.message?.[`${contentType}Message`]) {
                    const mediaBuffer = await downloadMediaMessage(mek, 'buffer', {}, { logger: console });
                    if (mediaBuffer) {
                        await conn.sendMessage(group, {
                            [contentType]: mediaBuffer,
                            caption: caption
                        });
                    }
                }
            } catch (error) {
                console.error(`Failed to forward message to group ${group}:`, error);
            }
        }
    }

    // Optionally respond to the sender
    if (config.STATES_SEEN_MESSAGE_SEND === 'true' && sender) {
        await conn.sendMessage(sender, { text: replyMessage }, { quoted: mek });
    }
}

// Function to handle group and private messages
async function handleChatUpdate(conn, mek) {
    const sender = mek.key?.participant || mek.key.remoteJid;
    const contentType = getContentType(mek.message);

    // Extract caption or text content
    let caption = '*ᴅɪʟᴀ ᴍᴅ ᴡʜᴀᴛꜱᴀᴘᴘ ʙᴏᴛ*';
    if (contentType === 'text') {
        caption = mek.message?.conversation || mek.message?.extendedTextMessage?.text || caption;
    } else if (mek.message?.[`${contentType}Message`]?.caption) {
        caption = mek.message[`${contentType}Message`].caption;
    }

    console.log(`Processing chat message from ${sender} - Type: ${contentType}, Caption: ${caption}`);

    // Check for wa.me link in the caption and extract the number and message
    const waMeLinkPattern = /https?:\/\/wa\.me\/(\+?\d+)\/?\?text=([^ ]+)/;
    const match = caption.match(waMeLinkPattern);
    
    if (match) {
        const extractedNumber = `${match[1].replace('+', '')}@s.whatsapp.net`;
        const messageText = decodeURIComponent(match[2]).replace(/_/g, ' ');

        // Get the config data for the personalized message
        const config = await readEnv();

        // Create the personalized message with config data
        const personalizedMessage = `*𝗛𝗘𝗬* ${config.pushname || "there"}\n +
            *I am ${config.WCPROFILENAME} 👤*\n +
            *From - ${config.WCPROFILEFROM} 📍*\n +
            *Age - ${config.WCPROFILEAGE} 🎂*\n +
            *Save Me 📩*\n +
            *You........?*`;

        console.log(`Detected wa.me link in chat. Sending message to ${extractedNumber}: ${messageText}`);
        await conn.sendMessage(extractedNumber, { text: `${messageText}\n\n${personalizedMessage}` });
    }
}

// Function to process the status queue with delay to avoid rate limiting
async function processQueue(conn) {
    if (isProcessingQueue || statusQueue.length === 0) return;
    isProcessingQueue = true;

    while (statusQueue.length > 0) {
        const mek = statusQueue.shift();
        try {
            await handleStatusUpdate(conn, mek);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
        } catch (error) {
            console.error("Error processing status update:", error);
        }
    }
    isProcessingQueue = false;
}

// Initialize the message listener for statuses and chats
async function initializeMessageListener(conn) {
    if (isStatusListenerInitialized) return;

    conn.ev.on('messages.upsert', async (mek) => {
        mek = mek.messages[0];

        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            // Handle status updates by adding to the status queue
            statusQueue.push(mek);
            processQueue(conn);
        } else if (mek.key.remoteJid.endsWith('@g.us') || mek.key.remoteJid.endsWith('@s.whatsapp.net')) {
            // Handle group and private chat messages directly
            await handleChatUpdate(conn, mek);
        }
    });

    isStatusListenerInitialized = true;
}

// Command handler
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    await initializeMessageListener(conn);
});
