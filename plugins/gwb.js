// Import required modules
const fs = require('fs'); // Only import fs if you are absolutely sure you will not use it for file operations
const path = require('path');
const { readEnv } = require('../lib/database');   // Reads environment configuration
const { cmd, commands } = require('../command');  // Handles command functionality
const { fetchJson } = require('../lib/functions'); // Fetches JSON data from a URL
const sensitiveData = require('../dila_md_licence/a/b/c/d/dddamsbs');  // Ensure this path is correct

let listenerRegistered = false; // Flag to ensure the listener is registered only once

// Function to send a welcome message to new members with "read more" functionality
const sendWelcomeMessage = async (conn, from, memberIds) => {
    try {
        const groupMetadata = await conn.groupMetadata(from);  // Get group metadata
        const groupName = groupMetadata.subject;  // Get the group name
        const groupDesc = groupMetadata.desc || "No description available.";  // Get group description or default text

        // Create a 'read more' effect using a large number of zero-width spaces
        let readmore = "\u200B".repeat(4000);  // Invisible characters to trigger "Read more"

        // Prepare the text that will be shown after clicking "Read more"
        let readmoreText = `\n\n*Name :*\n${groupName}\n\n*Description :*\n${groupDesc}\n\nᴍᴀᴅᴇ ʙʏ ᴍʀ ᴅɪʟᴀ ᴏꜟᴄ`;

        // Format the welcome message to include mentions for each new member
        const welcomeMentions = memberIds.map(id => `@${id.split('@')[0]}`).join('\n');  // Prepare mentions

        // Full message with "Read more" effect
        let replyText = `*Hey 🫂♥️*\n${welcomeMentions}\n*Welcome to Group ⤵️*\n${readmore}${readmoreText}`;

        // Send the thumbnail image first
        await conn.sendMessage(from, {
            image: { url: 'https://i.imgur.com/w5CeRcI.jpeg' }, // Thumbnail image URL
            caption: replyText,
            mentions: memberIds // Mentions for new members
        });

        // Send group rules alert to new members if WELCOME_ALERT is enabled
        await sendGroupRulesAlert(conn, memberIds, groupName, groupDesc);
    } catch (error) {
        console.error("Error sending welcome message:", error);  // Log the error for debugging
    }
};

// Function to send group rules alert to new members in a private message
const sendGroupRulesAlert = async (conn, memberIds, groupName, groupDesc) => {
    try {
        // Read the environment configuration to check if WELCOME_ALERT is enabled
        const config = await readEnv();

        // Only send the alert if WELCOME_ALERT is true
        if (config.WELCOME_ALERT === 'true') {
            // Prepare the alert message for new members
            const alertMessage = `*Hey Dear 🫂❤️*\n(major new member)\n\n*Welcome to ${groupName}*\n\n${groupDesc}\n\n*Be sure to read the group description*\n\nᴍᴀᴅᴇ ʙʏ ᴍʀ ᴅɪʟᴀ ᴏꜟᴄ`;

            // Send the alert to each new member in private
            for (const memberId of memberIds) {
                try {
                    // Check if memberId is valid
                    if (!memberId) continue;  // Skip if the memberId is invalid

                    await conn.sendMessage(memberId, {
                        image: { url: 'https://i.imgur.com/w5CeRcI.jpeg' }, // Thumbnail image URL
                        caption: alertMessage,
                    });
                } catch (error) {
                    console.error(`Error sending message to ${memberId}:`, error);  // Log error for each individual member
                }
            }
        }
    } catch (error) {
        console.error("Error sending group rules alert:", error);  // Log the error for debugging
    }
};

// Event listener for new group participants
const registerGroupWelcomeListener = (conn) => {
    if (!listenerRegistered) {  // Check if the listener is already registered
        conn.ev.on('group-participants.update', async (update) => {
            const { id, participants, action } = update;  // id = group id, participants = new members, action = add/remove
            if (action === 'add' && participants.length > 0) {  // Check if the action is a new member joining
                console.log("New participants:", participants);  // Log new participants
                await sendWelcomeMessage(conn, id, participants);  // Send welcome message to all new members
            }
        });
        listenerRegistered = true;  // Set the flag to true after registering the listener
    }
};

// Main command handler
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    try {
        // Read the environment configuration without saving anything
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
