// Import required modules
const fs = require('fs');
const path = require('path');
const { readEnv } = require('../lib/database');   // Reads environment configuration
const { cmd, commands } = require('../command');  // Handles command functionality
const { fetchJson } = require('../lib/functions'); // Fetches JSON data from a URL
const sensitiveData = require('../dila_md_licence/a/b/c/d/dddamsbs');  // Ensure this path is correct

// Function to send welcome message to new members
const sendWelcomeMessage = async (conn, groupId, memberId) => {
    const welcomeMessage = `*Welcome to the group, @${memberId.split('@')[0]}! 🎉*\nFeel free to introduce yourself and have fun! ✨\n${sensitiveData.footerText}`;
    await conn.sendMessage(groupId, { text: welcomeMessage, mentions: [memberId] });
};

// Event listener for new group participants
const registerGroupWelcomeListener = (conn) => {
    conn.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update;  // id = group id, participants = new members, action = add/remove
        if (action === 'add') {  // Check if the action is a new member joining
            // Use a for...of loop to handle async operations properly
            for (const participant of participants) {
                await sendWelcomeMessage(conn, id, participant);  // Send welcome message to each new member
            }
        }
    });
};

// Main command handler
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    try {
        // Read the environment configuration
        const config = await readEnv();
        
        // Check if the WELCOME feature is enabled
        if (config.WELCOME === 'true') {
            

            // Register the listener for welcoming new group participants
            registerGroupWelcomeListener(conn);
        }
    } catch (e) {
        // Log the error and send an error message to the user
        console.log(e);
        await m.reply(`Error: ${e.message}`);
    }
});
