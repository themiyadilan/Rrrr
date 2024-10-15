const config = require('../config');
const { cmd, commands } = require('../command');
const { fetchJson } = require('../lib/functions');
const sensitiveData = require('../dila_md_licence/a/b/c/d/dddamsbs');

cmd({
  pattern: "ai",
  desc: "AI chat",
  category: "main",
  react: "🔎",
  filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
  try {
    // Define the new API URL with the new key
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyByitRjKUtDonuVtpJm1R-RSdPdFPf-tcY`;
    
    // Prepare the body content for the API request
    const bodyContent = {
      contents: [{ parts: [{ text: q }] }]
    };
    
    // Fetch the AI response
    let data = await fetchJson(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyContent)
    });
    
    // Access the AI response data
    let response = data.contents[0].parts[0].text;

    // Compose the message to send
    let replyText = `\n${sensitiveData.aiChatHeader}\n\n🔍 *𝗤𝘂𝗲𝗿𝘆*: _${q}_\n\n💬 *𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲*: _${response}_\n\n${sensitiveData.siteUrl}\n${sensitiveData.footerText}`;
    
    // Send the message with the AI response
    let sentMessage = await conn.sendMessage(from, { image: { url: sensitiveData.imageUrl }, caption: replyText }, { quoted: mek });
    
    // React to the sent message
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    await conn.sendMessage(from, { react: { text: "🧠", key: sentMessage.key } });

  } catch (e) {
    console.log(e);
    reply(`Error: ${e.message}`);
  }
});
