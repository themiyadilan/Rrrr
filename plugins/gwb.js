const { cmd } = require('../command'); // Remove if you're not using any commands
const sensitiveData = require('../dila_md_licence/a/b/c/d/dddamsbs');

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
            participants.forEach(async (participant) => {
                await sendWelcomeMessage(conn, id, participant);  // Send welcome message to each new member
            });
        }
    });
};

// Automatically register the event listener when the bot starts
const initializeBot = (conn) => {
    registerGroupWelcomeListener(conn);
};

// Export or invoke the function as needed in your main file
module.exports = {
    initializeBot,
};

// Example of how to invoke the initialization in your main file
// In your main bot file, you would call `initializeBot(conn);` to set up the listener.
