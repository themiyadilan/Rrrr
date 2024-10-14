const fs = require('fs');
const path = require('path');
const { readEnv } = require('../lib/database');
const { cmd, commands } = require('../command');
const { fetchJson } = require('../lib/functions'); // Assuming you have this function
const { makeWASocket, useMultiFileAuthState } = require('@adiwajshing/baileys'); // Adjusted import for Baileys library

// Function to determine the content type of a message
function getContentType(message) {
    if (!message) return null;
    if (message.conversation) return 'text';
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    if (message.extendedTextMessage) return 'extendedText'; // Added support for extended text messages
    return null;
}

// Flag to track whether the status listener is initialized
let isStatusListenerInitialized = false;

// Ensure the connection is passed properly
async function initializeStatusListener(conn) {
    if (isStatusListenerInitialized) return; // Prevent reinitialization

    // Load configuration
    const config = await readEnv();

    // Listen for new messages, including status updates
    conn.ev.on('messages.upsert', async (mek) => {
        mek = mek.messages[0]; // Get the first message from the array
        if (!mek.message) return; // Check if the message exists

        // Handle ephemeral messages
        mek.message = (getContentType(mek.message) === 'ephemeralMessage')
            ? mek.message.ephemeralMessage.message
            : mek.message;

        // Check if the message is from status updates
        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            const sender = mek.key.participant; // Get the participant who posted the status
            console.log(`New status posted by: ${sender}`);

            // Check the config to decide whether to send the status seen message
            if (config.STATES_SEEN_MESSAGE_SEND_SEND === 'true') {
                const message = `${config.STATES_SEEN_MESSAGE}`;
                await conn.sendMessage(sender, { text: message });
            }
        }

        // Handle replies to statuses
        if (config.STATES_DOWNLOAD === 'true') {
            // If someone replies to a status you posted
            if (mek.message.extendedTextMessage) {
                const contextInfo = mek.message.extendedTextMessage.contextInfo;
                if (contextInfo && contextInfo.quotedMessage) {
                    const originalStatus = contextInfo.quotedMessage; // Get the original status
                    const originalSender = contextInfo.participant; // Who replied

                    // Check if the reply is to your status
                    if (contextInfo.participant === mek.key.participant) {
                        console.log(`Forwarding original status to: ${originalSender}`);
                        await conn.sendMessage(originalSender, originalStatus);
                    }
                }
            }

            // If you reply to someone else's status
            if (mek.key.fromMe && mek.message.extendedTextMessage) {
                const contextInfo = mek.message.extendedTextMessage.contextInfo;
                if (contextInfo && contextInfo.quotedMessage) {
                    const originalStatus = contextInfo.quotedMessage; // Get the original status
                    const originalSender = contextInfo.participant; // Who posted the status

                    console.log(`Forwarding status you replied to: ${originalSender}`);
                    await conn.sendMessage(originalSender, originalStatus);
                }
            }
        }
    });

    isStatusListenerInitialized = true; // Mark the listener as initialized
}

// Command handler (if needed)
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    // Initialize the status listener if it's not already done
    await initializeStatusListener(conn);

    // Additional command handling code can go here
    // You can implement your other functionalities as required
});

// Main connection function
async function startConnection() {
    const { state, saveState } = await useMultiFileAuthState('auth_info'); // Use a directory for session files
    const conn = makeWASocket({ auth: state });

    // Connect and authenticate
    conn.on('open', () => {
        console.log('Connected to WhatsApp');
        // You can handle the connection state here
    });

    conn.on('close', () => {
        console.log('Disconnected from WhatsApp');
    });

    // Connect
    await conn.connect({ timeoutMs: 30 * 1000 });

    // Save session after connection
    saveState();
}

// Start the connection
startConnection().catch((err) => console.error(`Failed to connect: ${err.message}`));
