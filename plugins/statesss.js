const fs = require('fs');
const path = require('path');
const { readEnv } = require('../lib/database');
const { cmd } = require('../command');
const { downloadMediaMessage } = require('@adiwajshing/baileys');

// Constants
const STORAGE_DIR = '../data/states';
const STATUS_EXPIRY_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds
const replyMessage = "Thank you for sharing your status!";

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR);
}

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

// Function to handle status updates only
async function handleStatusUpdate(conn, mek) {
    const sender = mek.key?.participant;
    const contentType = getContentType(mek.message);

    // Skip protocol messages
    if (contentType === 'protocol') {
        console.log("Skipping protocol message.");
        return;
    }

    // Extract caption or text content
    let caption = 'No caption provided.';
    if (contentType === 'text') {
        caption = mek.message?.conversation || mek.message?.extendedTextMessage?.text || caption;
    } else if (mek.message?.[`${contentType}Message`]?.caption) {
        caption = mek.message[`${contentType}Message`].caption;
    }

    console.log(`Processing status from ${sender} - Type: ${contentType}, Caption: ${caption}`);

    // Save text or media status locally
    const filePath = path.join(STORAGE_DIR, `${Date.now()}_${contentType}_${sender}`);
    if (contentType === 'text') {
        fs.writeFileSync(filePath + '.txt', caption, 'utf8');
    } else if (mek.message?.[`${contentType}Message`]) {
        const mediaBuffer = await downloadMediaMessage(mek, 'buffer', {}, { logger: console });
        if (mediaBuffer) {
            fs.writeFileSync(filePath + path.extname(contentType), mediaBuffer);
            fs.writeFileSync(filePath + '_caption.txt', caption, 'utf8');
        }
    }

    // Optionally respond to the sender
    const config = await readEnv();
    if (config.STATES_SEEN_MESSAGE_SEND === 'true' && sender) {
        await conn.sendMessage(sender, { text: replyMessage }, { quoted: mek });
    }
}

// Function to process stored statuses
function getStoredStatuses() {
    const statuses = [];
    const now = Date.now();

    // Read files in the storage directory
    fs.readdirSync(STORAGE_DIR).forEach((file) => {
        const filePath = path.join(STORAGE_DIR, file);
        const stats = fs.statSync(filePath);

        // Include only files from the last day
        if (now - stats.mtimeMs < STATUS_EXPIRY_MS) {
            statuses.push({
                file: file,
                path: filePath,
                createdAt: stats.mtime
            });
        }
    });

    return statuses;
}

// Function to delete old status files
function deleteOldStatuses() {
    const now = Date.now();

    // Delete files older than a day
    fs.readdirSync(STORAGE_DIR).forEach((file) => {
        const filePath = path.join(STORAGE_DIR, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtimeMs >= STATUS_EXPIRY_MS) {
            fs.unlinkSync(filePath);
        }
    });
}

// Set up a daily cleanup
setInterval(deleteOldStatuses, STATUS_EXPIRY_MS);

// Command to fetch statuses within a day
cmd({ pattern: 'fetchStatus' }, async (conn, mek) => {
    const statuses = getStoredStatuses();
    let message = 'Recent statuses within a day:\n\n';

    statuses.forEach((status) => {
        message += `- ${status.file} (created at ${status.createdAt.toISOString()})\n`;
    });

    await conn.sendMessage(mek.key.remoteJid, { text: message }, { quoted: mek });
});

// Initialize the message listener for statuses and chats
async function initializeMessageListener(conn) {
    conn.ev.on('messages.upsert', async (mek) => {
        mek = mek.messages[0];

        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            // Handle status updates
            await handleStatusUpdate(conn, mek);
        }
    });
}

// Command handler to start the listener
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    await initializeMessageListener(conn);
});
