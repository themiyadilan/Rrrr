// Import required modules
const fs = require('fs');
const path = require('path');
const { readEnv } = require('../lib/database');   // Reads environment configuration
const { cmd, commands } = require('../command');  // Handles command functionality
const { fetchJson } = require('../lib/functions'); // Fetches JSON data from a URL
const sensitiveData = require('../dila_md_licence/a/b/c/d/dddamsbs');  // Ensure this path is correct

let listenerRegistered = false; // Flag to ensure the listener is registered only once

// Function to send welcome message to new members
const sendWelcomeMessage = async (conn, groupId, memberId) => {
    const groupMetadata = await conn.groupMetadata(groupId);  // Get group metadata
    const groupName = groupMetadata.subject;  // Get the group name
    const groupDesc = groupMetadata.desc || "No description available.";  // Get group description or default text

    const welcomeMessage = `*Hey 🫂♥️ @${memberId.split('@')[0]}* \n` +
        `*Welcome to Group ⤵️*\n\n` +
        `*Name :*\n${groupName}\n\n` +
        `*Description :*\n${groupDesc}\n\n` +
        `${sensitiveData.footerText || 'ᴍᴀᴅᴇ ʙʏ ᴍʀ ᴅɪʟᴀ ᴏꜰᴄ'}`;
        
    await conn.sendMessage(groupId, { text: welcomeMessage, mentions: [memberId] });
};

// Event listener for new group participants
const registerGroupWelcomeListener = (conn) => {
    if (!listenerRegistered) {  // Check if the listener is already registered
        conn.ev.on('group-participants.update', async (update) => {
            const { id, participants, action } = update;  // id = group id, participants = new members, action = add/remove
            if (action === 'add') {  // Check if the action is a new member joining
                for (const participant of participants) {
                    await sendWelcomeMessage(conn, id, participant);  // Send welcome message to each new member
                }
            }
        });
        listenerRegistered = true;  // Set the flag to true after registering the listener
    }
};

// Main command handler
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    try {
        // Read the environment configuration
        const config = await readEnv();
        
        // Check if the WELCOME feature is enabled
        if (config.WELCOME === 'true') {
            
            // If the user is the owner, do nothing
            if (isOwner) return;

            // Register the listener for welcoming new group participants
            registerGroupWelcomeListener(conn);
        }
    } catch (e) {
        // Log the error and send an error message to the user
        console.log(e);
        await m.reply(`Error: ${e.message}`);
    }
});
