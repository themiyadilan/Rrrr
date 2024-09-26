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
        let readmoreText = `\n\n*Name :*\n${groupName}\n\n*Description :*\n${groupDesc}\n\nᴍᴀᴅᴇ ʙʏ ᴍʀ ᴅɪʟᴀ ᴏꜰᴄ`;

        // Format the welcome message to include mentions for each new member
        const welcomeMentions = memberIds.map(id => `@${id.split('@')[0]}`).join('\n');  // Prepare mentions

        // Determine the image to send based on the number of new members
        let imageUrl;
        if (memberIds.length > 1) {
            // If multiple new members, use the group profile photo
            imageUrl = await conn.profilePictureUrl(from, 'image');  // Fetch group profile picture
        } else {
            // If one new member, use their profile photo
            const memberId = memberIds[0];
            try {
                // Try fetching the member's profile picture
                imageUrl = await conn.profilePictureUrl(memberId, 'image');
            } catch {
                // Fallback to group profile picture if member has no profile photo
                imageUrl = await conn.profilePictureUrl(from, 'image');
            }
        }

        // Full message with "Read more" effect
        let replyText = `*Hey 🫂♥️*\n${welcomeMentions}\n*Welcome to Group ⤵️*\n${readmore}${readmoreText}`;

        // Send the message with "Read more" functionality and the appropriate image
        await conn.sendMessage(from, { image: { url: imageUrl }, caption: replyText, mentions: memberIds });
    } catch (error) {
        console.error("Error sending welcome message:", error);  // Log the error for debugging
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
