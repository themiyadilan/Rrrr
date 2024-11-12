// Import necessary modules
const fs = require('fs');
const path = require('path');
const { readEnv } = require('../lib/database');
const { cmd } = require('../command');
const { downloadMediaMessage } = require('@adiwajshing/baileys');

// Constants
const STORAGE_DIR = './states';
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
    const fileName = `${Date.now()}_${contentType}_${sender}`;
    const filePath = path.join(STORAGE_DIR, fileName);

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

    // Return the saved file name to link replies with this status
    return fileName;
}

// Function to retrieve the stored status by file name
function getStoredStatus(fileName) {
    const filePath = path.join(STORAGE_DIR, fileName);

    if (fs.existsSync(filePath + '.txt')) {
        // Text status
        return { type: 'text', content: fs.readFileSync(filePath + '.txt', 'utf8') };
    } else if (fs.existsSync(filePath)) {
        // Media status with a caption file
        const mediaBuffer = fs.readFileSync(filePath);
        const captionPath = filePath + '_caption.txt';
        const caption = fs.existsSync(captionPath) ? fs.readFileSync(captionPath, 'utf8') : null;
        return { type: 'media', content: mediaBuffer, caption };
    }

    return null;
}

// Function to process replies to a bot-posted status
async function handleStatusReply(conn, mek) {
    const quotedMessage = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMessage) return;

    const quotedFileName = quotedMessage.fileName; // This assumes the file name is stored or can be determined
    const status = getStoredStatus(quotedFileName);

    if (status) {
        if (status.type === 'text') {
            await conn.sendMessage(mek.key.remoteJid, { text: status.content }, { quoted: mek });
        } else if (status.type === 'media') {
            await conn.sendMessage(mek.key.remoteJid, {
                image: status.content,
                caption: status.caption
            }, { quoted: mek });
        }
    }
}

// Initialize the message listener for statuses and replies
async function initializeMessageListener(conn) {
    conn.ev.on('messages.upsert', async (mek) => {
        mek = mek.messages[0];

        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            // Handle status updates
            const fileName = await handleStatusUpdate(conn, mek);
            mek.message.fileName = fileName; // Attach the file name for future replies
        } else if (mek.message?.extendedTextMessage?.contextInfo?.isQuotedMessage) {
            // Handle replies to a bot-posted status
            await handleStatusReply(conn, mek);
        }
    });
}

// Command handler to start the listener
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    await initializeMessageListener(conn);
});
