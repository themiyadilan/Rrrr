const fs = require('fs'); 
const path = require('path');
const { readEnv } = require('../lib/database');
const { cmd, commands } = require('../command');
const { fetchJson } = require('../lib/functions');
const sensitiveData = require('../dila_md_licence/a/b/c/d/dddamsbs');

let listenerRegistered = false;

// Function to send a welcome message with "read more" functionality
const sendWelcomeMessage = async (conn, from, memberIds) => {
    try {
        const groupMetadata = await conn.groupMetadata(from);
        const groupName = groupMetadata.subject;
        const groupDesc = groupMetadata.desc || "No description available.";

        // 'Read more' effect
        let readmore = "\u200B".repeat(4000);
        let readmoreText = `\n\n*Name :*\n${groupName}\n\n*Description :*\n${groupDesc}\n\nᴍᴀᴅᴇ ʙʏ ᴍʀ ᴅɪʟᴀ ᴏꜰᴄ`;

        const welcomeMentions = memberIds.map(id => `@${id.split('@')[0]}`).join('\n');

        // Fetch group or member profile picture
        let imageUrl = '';
        try {
            if (memberIds.length > 1) {
                imageUrl = await conn.profilePictureUrl(from, 'image');
            } else {
                const memberId = memberIds[0];
                imageUrl = await conn.profilePictureUrl(memberId, 'image');
            }
        } catch (error) {
            console.log("Error fetching profile picture, using default.");
            // Use a valid default image URL or local path
            imageUrl = 'https://telegra.ph/file/94055e3a7e18f50199374.jpg'; // Replace with your valid image URL or path
        }

        let replyText = `*Hey 🫂♥️*\n${welcomeMentions}\n*Welcome to Group ⤵️*\n${readmore}${readmoreText}`;

        // Send the message with "read more" and image (if available)
        await conn.sendMessage(from, { image: { url: imageUrl }, caption: replyText, mentions: memberIds });
    } catch (error) {
        console.error("Error sending welcome message:", error);
    }
};

// Event listener for new participants
const registerGroupWelcomeListener = (conn) => {
    if (!listenerRegistered) {
        conn.ev.on('group-participants.update', async (update) => {
            const { id, participants, action } = update;
            if (action === 'add' && participants.length > 0) {
                console.log("New participants:", participants);
                await sendWelcomeMessage(conn, id, participants);
            }
        });
        listenerRegistered = true;
    }
};

// Main command handler
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    try {
        const config = await readEnv();
        
        // Check if WELCOME is enabled in config
        if (config.WELCOME === 'true') {
            if (isOwner) return;
            registerGroupWelcomeListener(conn);
        }
    } catch (e) {
        console.log(e);
        await m.reply(`Error: ${e.message}`);
    }
});
