const {readEnv} = require('../lib/database')
const {cmd, commands} = require('../command')
const os = require("os")
const { runtime} = require('../lib/functions')
const { generateWAMessageFromContent, prepareWAMessageMedia, generateWAMessageContent , proto} = require('@whiskeysockets/baileys');
const config = require('../config');







cmd({
    pattern: "menu4",
    alias: ["panel", "penal", "list", "allmenu"],
    react: "♻️",
    desc: "Check menu all",
    category: "main",
    filename: __filename
}, async (conn, mek, m, {from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    try {
        // RAM usage
        const totalRAM = Math.round(require('os').totalmem() / 1024 / 1024); // Total RAM in MB
        const usedRAM = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2); // Used RAM in MB
        const freeRAM = (totalRAM - parseFloat(usedRAM)).toFixed(2); // Free RAM in MB

        let status = `

> 1 Menu 1

> 2 Menu 2

> 3 Menu3


`

        // URL of the image you want to include
        const imageUrl = 'https://i.ibb.co/Sns38Lb/IMG-20240917-WA0051.jpg'; // Replace with your actual image URL

        // Send the image with the status as the caption
        const sentMsg = await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: status
        }, { quoted: mek || null });





        conn.ev.on('messages.upsert', async (msgUpdate) => {
            const msg = msgUpdate.messages[0];
            if (!msg.message || !msg.message.extendedTextMessage) return;
            const selectedOption = msg.message.extendedTextMessage.text.trim();

            if (msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.stanzaId === sentMsg.key.id) {
                switch (selectedOption) {
                    case '1':
                            await conn.sendMessage(from, {
    text: `
Menu 1 Reply msg`
}, { quoted: mek || null });
break;
                    case '2':
                            await conn.sendMessage(from, {
    text: `
Menu 2 Reply msg`
}, { quoted: mek || null });
break;
                        case '3':
                            await conn.sendMessage(from, {
    text: `
Menu 3 Reply msg`
}, { quoted: mek || null });
break;
                    default:
                        reply("Invalid option. Please select a valid menu option (1-3).");
                }


 }
        });

    } catch (e) {
        console.log(e)
        reply(`Error: ${e}`)
    }
});


