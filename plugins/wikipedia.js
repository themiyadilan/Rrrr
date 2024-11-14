conn.ev.on('messages.upsert', async function(msgUpdate) {
    const msg = msgUpdate.messages[0];
    if (!msg.message || !msg.message.extendedTextMessage) return;
    const selectedOption = msg.message.extendedTextMessage.text.trim();

    if (msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.stanzaId === vv.key.id) {
        try {
            switch (selectedOption) {
                case '1':
                    reply("You selected the Summary: \n\n_The Wikipedia Summary is shown above._");
                    break;
                case '2':
                    reply("You selected the URL: \n\n_The Wikipedia URL is shown above._");
                    break;
                case '3':
                    reply("You selected the Image: \n\n_The Wikipedia image is shown above._");
                    break;
                default:
                    reply("Error: Invalid option selected.");
            }
        } catch (e) {
            reply('❌ Failed to fetch the download link. Please try again later ❌');
        }
    }
});

const config = require('../config');
const { cmd, commands } = require('../command');
const wiki = require('wikipedia');
const sensitiveData = require('../dila_md_licence/a/b/c/d/dddamsbs');

cmd({
    pattern: "wiki",
    desc: "Search Wikipedia for information",
    category: "main",
    filename: __filename
}, async function(conn, mek, m, {
    from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply
}) {
    try {
        if (!q) {
            return reply('Please provide a search query.');
        }
        const summary = await wiki.summary(q);
        
        let replyText = `*📚 Wikipedia Summary 📚*\n\n🔍 *Query*: _${q}_\n\n💬 *Title*: _${summary.title}_\n\n📝 *Summary*: _${summary.extract}_\n\n🔗 *URL*: ${summary.content_urls.desktop.page}\n\n🤍 *IMAGE*: ${summary.originalimage.source}\n\n*Send the relevant number as a reply*\n1. Summary\n2. URL\n3. Image\n\n${sensitiveData.siteUrl}\n${sensitiveData.footerText}\n\n​\u200B​\u200B​\u200B​https://whatsapp.com/channel/0029VapPPNGEgGfO1JkeJF1h​`;

        // Send the Wikipedia summary with image
        await conn.sendMessage(from, {
            image: { url: summary.originalimage.source },
            caption: replyText
        }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`Error: ${e.message}`);
    }
});
