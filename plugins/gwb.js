const { Client } = require('@whiskeysockets/baileys'); // Ensure you have the correct package installed
const { readEnv } = require('../lib/database'); // Importing readEnv from the database module
const { cmd, commands } = require('../command'); // Importing command functionalities
const os = require("os"); // OS module for system-related utility
const { runtime } = require('../lib/functions'); // Importing runtime functions
const sensitiveData = require('../dila_md_licence/a/b/c/d/dddamsbs'); // Update this path as needed

// Function to send welcome message to new members
const sendWelcomeMessage = async (conn, groupId, memberId) => {
    try {
        const welcomeMessage = `*Welcome to the group, @${memberId.split('@')[0]}! 🎉*\nFeel free to introduce yourself and have fun! ✨\n${sensitiveData.footerText}`;
        await conn.sendMessage(groupId, { text: welcomeMessage, mentions: [memberId] });
    } catch (error) {
        console.error(`Error sending welcome message to ${memberId}:`, error);
    }
};

// Event listener for new group participants
const registerGroupWelcomeListener = (conn) => {
    conn.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update; // id = group id, participants = new members, action = add/remove
        if (action === 'add') {  // Check if the action is a new member joining
            for (const participant of participants) {
                await sendWelcomeMessage(conn, id, participant);  // Send welcome message to each new member
            }
        }
    });
};

// Function to initialize welcome functionality based on configuration
const initializeWelcomeFunctionality = async (conn) => {
    try {
        const config = await readEnv(); // Get the latest configuration
        console.log('Current config:', config); // Log the config for debugging

        if (config.WELCOME === 'true') {
            registerGroupWelcomeListener(conn); // Register the listener if WELCOME is true
            console.log('Welcome messages are enabled!'); // Optional: log to console
        } else {
            console.log('Welcome messages are disabled.'); // Optional: log to console
        }
    } catch (error) {
        console.error('Error initializing welcome functionality:', error);
    }
};

// Function to create a WhatsApp connection
const createWhatsAppConnection = async () => {
    const conn = new Client(); // Create a new client instance
    conn.on('qr', (qr) => {
        console.log('QR RECEIVED', qr); // Implement QR code handling here
        // You might want to add a way to display or scan this QR code
    });

    conn.on('ready', () => {
        console.log('WhatsApp connected');
    });

    await conn.connect(); // Connect to WhatsApp
    return conn; // Return the connection object
};

// Example connection logic
const connectToWhatsApp = async () => {
    const conn = await createWhatsAppConnection(); // Establish and return your WhatsApp connection
    await initializeWelcomeFunctionality(conn); // Start the welcome functionality based on the config
};

// Start the connection
connectToWhatsApp().catch(console.error);
