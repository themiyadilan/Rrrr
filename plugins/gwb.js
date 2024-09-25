const { cmd } = require('../command');
const sensitiveData = require('../dila_md_licence/a/b/c/d/dddamsbs');
const { readEnv } = require('../lib/database');

// Function to send welcome message to new members
const sendWelcomeMessage = async (conn, groupId, memberId) => {
    const welcomeMessage = `*Welcome to the group, @${memberId.split('@')[0]}! 🎉*\nFeel free to introduce yourself and have fun! ✨\n${sensitiveData.footerText}`;
    await conn.sendMessage(groupId, { text: welcomeMessage, mentions: [memberId] });
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

// Example of calling the initialization function in your main file
(async () => {
    const conn = /* Your connection logic here */;
    await initializeWelcomeFunctionality(conn); // Start the welcome functionality based on the config
})();
