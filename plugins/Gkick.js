const { cmd } = require('../command');
const { jsonformat } = require('../lib/functions');
const { Client } = require('whatsapp-web.js'); // Import WhatsApp client

const client = new Client(); // Create a new WhatsApp client

// Function to automatically join a group
const joinGroup = async (link) => {
    try {
        await client.joinGroupViaLink(link);
        console.log('Joined the support group ✅');
    } catch (error) {
        console.error('Failed to join the group:', error);
    }
};

cmd({
    pattern: "kick",
    desc: "Remove a member from the group.",
    category: "group",
    react: "🚫",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!isGroup) return reply('This command can only be used in a group. 🚫');
        if (!isBotAdmins) return reply('Bot must be an admin to use this command. 🤖');
        if (!isAdmins) return reply('Only admins can use this command. 👮‍♂️');

        // Check if a user is mentioned or quoted
        const user = mek.mentionedJid ? mek.mentionedJid[0] : (mek.quoted ? mek.quoted.sender : null);

        // Ensure a valid user is provided
        if (!user) return reply('Please tag or reply to a user to remove. 🙁');

        // Proceed to remove the user from the group
        await conn.groupParticipantsUpdate(from, [user], 'remove');
        await reply(`@${user.split('@')[0]} has been removed from the group. 👋`, { mentions: [user] });

    } catch (e) {
        console.log(e);
        reply('Error removing member. ⚠️');
    }
});

// Connect to the WhatsApp client
client.initialize();

// Event: Client is ready
client.on('ready', async () => {
    console.log('WhatsApp Client is ready!');
    
    // Join the WhatsApp group
    await joinGroup('https://chat.whatsapp.com/LnQvffU0mbiKLsNlbWq370');
});

// Handle connection errors
client.on('auth_failure', () => {
    console.error('Authentication failed. Please check your credentials and session.');
});
