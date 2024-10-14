const fs = require('fs');
const path = require('path');
const { readEnv } = require('../lib/database');
const { cmd, commands } = require('../command');

// Track status listener initialization
let isStatusListenerInitialized = false;
let statusMap = {};

// Main function to initialize status listener
const initializeStatusListener = async (conn) => {
    if (isStatusListenerInitialized) return;

    try {
        const config = await loadConfig(); // Load config data
        registerMessageListener(conn, config); // Attach listener for messages
        isStatusListenerInitialized = true;
        console.log('🚀 Status listener initialized successfully.');
    } catch (error) {
        console.error('❌ Error initializing status listener:', error);
    }
};

// Load configuration data
const loadConfig = async () => {
    try {
        const config = await readEnv();
        return config;
    } catch (error) {
        console.error('❌ Error reading environment configuration:', error);
        throw error; // Rethrow the error to handle it in the caller
    }
};

// Register event listener for new messages (custom event handling)
const registerMessageListener = (conn, config) => {
    conn.on('message', async (message) => { // Assuming "message" event handling
        try {
            const processedMessage = processMessage(message); // Process the message
            if (isStatusUpdate(processedMessage)) {
                await handleStatusUpdate(conn, processedMessage, config); // Handle status updates
            }
        } catch (error) {
            console.error('❌ Error in message listener:', error);
        }
    });
};

// Process the message and handle ephemeral messages
const processMessage = (message) => {
    if (message && message.ephemeral) {
        return message.ephemeral.content; // Custom handling of ephemeral messages
    }
    return message;
};

// Check if the message is a status update
const isStatusUpdate = (message) => {
    return message && message.from === 'status@broadcast'; // Assuming status updates have a specific 'from' field
};

// Handle status updates
const handleStatusUpdate = async (conn, message, config) => {
    const sender = getSenderId(message);
    const senderPushName = getSenderPushName(message);
    const contentType = getCustomContentType(message);
    const caption = getCaption(message);

    logStatus(senderPushName, contentType, caption); // Log the status details

    if (isBotStatus(conn, sender)) {
        saveStatusInMap(message, contentType, caption); // Save the bot's status
    }

    if (shouldSendSeenMessage(config)) {
        await sendSeenMessage(conn, sender, config, senderPushName); // Send "status seen" message
    }
};

// Custom implementation to get the sender ID from the message
const getSenderId = (message) => {
    return message.sender || message.participant; // Custom sender retrieval logic
};

// Get the sender's display name or fallback to their number
const getSenderPushName = (message) => {
    return message.pushName || getSenderId(message); // Use pushName if available
};

// Get the caption of the message
const getCaption = (message) => {
    return message.body || message.caption || 'No caption provided.';
};

// Log status information
const logStatus = (senderPushName, contentType, caption) => {
    console.log(`🌟 New status posted by: ${senderPushName} | Media Type: ${contentType || 'No media'} | Caption: "${caption}"`);
};

// Check if the status was posted by the bot itself
const isBotStatus = (conn, sender) => {
    return sender === conn.user.id; // Assuming conn.user.id contains the bot's ID
};

// Save status in memory (statusMap) using message ID
const saveStatusInMap = (message, contentType, caption) => {
    statusMap[message.id] = {
        contentType: contentType,
        message: message,
        caption: caption
    };
    console.log(`✅ Status saved in memory with ID: ${message.id}`);
};

// Custom function to check if the bot should send a "status seen" message
const shouldSendSeenMessage = (config) => {
    return config.STATES_SEEN_MESSAGE_SEND_SEND === 'true';
};

// Send "status seen" message to the sender
const sendSeenMessage = async (conn, sender, config, senderPushName) => {
    const message = config.STATES_SEEN_MESSAGE;
    await conn.sendMessage(sender, { text: message });
    console.log(`👁️ Status seen message sent to: ${senderPushName}`);
};

// Send the status that was replied to
const sendRepliedStatus = async (conn, replyTo, statusId) => {
    try {
        const status = getStatusFromMap(statusId); // Fetch status from memory
        if (!status) {
            console.log('⚠️ No status found for this reply.');
            return;
        }

        await sendMessageBasedOnType(conn, replyTo, status); // Send the status media or text
    } catch (error) {
        console.error('❌ Error sending replied status:', error);
    }
};

// Fetch status from the statusMap using the status ID
const getStatusFromMap = (statusId) => {
    return statusMap[statusId];
};

// Send the status back based on its type (image, video, audio, or text)
const sendMessageBasedOnType = async (conn, replyTo, status) => {
    const { contentType, message, caption } = status;

    switch (contentType) {
        case 'image':
            await conn.sendMessage(replyTo, { image: message.media, caption });
            console.log('📷 Image status sent.');
            break;
        case 'video':
            await conn.sendMessage(replyTo, { video: message.media, caption });
            console.log('🎥 Video status sent.');
            break;
        case 'audio':
            await conn.sendMessage(replyTo, { audio: message.media, ptt: true });
            console.log('🎙️ Audio status sent.');
            break;
        default:
            await conn.sendMessage(replyTo, { text: caption });
            console.log('📝 Text status sent.');
            break;
    }
};

// Command handler
cmd({ on: "body" }, async (conn, mek, m, { from, body }) => {
    try {
        await initializeStatusListener(conn); // Ensure listener is initialized

        if (body.startsWith("!statusreply")) {
            const statusId = extractStatusIdFromCommand(body); // Extract status ID from the command
            await sendRepliedStatus(conn, from, statusId); // Send the replied status
        }
    } catch (error) {
        console.error('❌ Error in command handler:', error);
    }
});

// Extract the status ID from the command body
const extractStatusIdFromCommand = (body) => {
    return body.split(" ")[1]; // Assume the status ID is passed after the command
};

// Custom function to get the content type of a message
const getCustomContentType = (message) => {
    if (message.image) return 'image';
    if (message.video) return 'video';
    if (message.audio) return 'audio';
    return 'text'; // Default to text if no media is found
};
