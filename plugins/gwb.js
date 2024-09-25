const { cmd } = require('../command');
const { readEnv } = require('../lib/database');
const sensitiveData = require('../dila_md_licence/a/b/c/d/dddamsbs');

// Read environment config
let config;
(async () => {
    config = await readEnv(); // Load config once on startup
})();

// Function to send welcome message to new members
const sendWelcomeMessage = async (conn, groupId, memberId, groupMetadata) => {
    const groupName = groupMetadata.subject; // Group name
    const groupDescription = groupMetadata.desc || "No description provided"; // Group description
    const welcomeMessage = `*Hey 🫂❤️* @${memberId.split('@')[0]}\n*Welcome to Our Group*\n(${groupName})\n\n*Group Description*\n${groupDescription}\n\n${sensitiveData.footerText}`;
    
    await conn.sendMessage(groupId, { text: welcomeMessage, mentions: [memberId] });
};

// Event listener for new group participants
const registerGroupWelcomeListener = (conn) => {
    conn.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update; // id = group id, participants = new members, action = add/remove
        const groupMetadata = await conn.groupMetadata(id); // Get group metadata (name, description)

        // Only send welcome message if WELCOME_MSG is enabled
        if (action === 'add' && config.WELCOME_MSG === 'true') {  
            participants.forEach(async (participant) => {
                await sendWelcomeMessage(conn, id, participant, groupMetadata);  // Send welcome message to each new member
            });
        }
    });
};

// Register the group welcome listener when the bot starts
cmd({ on: 'start' }, async (conn) => {
    registerGroupWelcomeListener(conn);
});
