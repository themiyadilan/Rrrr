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
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyByitRjKUtDonuVtpJm1R-RSdPdFPf-tcY`;
    
    const bodyContent = {
      contents: [{ parts: [{ text: q }] }]
    };
    
    let data = await fetchJson(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyContent)
    });

    console.log('API response:', JSON.stringify(data, null, 2)); // Log the API response

    // Adjust based on the actual response structure
    if (data && data.contents && data.contents[0] && data.contents[0].parts && data.contents[0].parts[0].text) {
      let response = data.contents[0].parts[0].text;

      let replyText = `\n${sensitiveData.aiChatHeader}\n\n🔍 *𝗤𝘂𝗲𝗿𝘆*: _${q}_\n\n💬 *𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲*: _${response}_\n\n${sensitiveData.siteUrl}\n${sensitiveData.footerText}`;
      
      let sentMessage = await conn.sendMessage(from, { image: { url: sensitiveData.imageUrl }, caption: replyText }, { quoted: mek });
      
      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
      await conn.sendMessage(from, { react: { text: "🧠", key: sentMessage.key } });
    } else {
      console.error('Invalid response format:', data);
      reply(`Error: Invalid response format from AI API.`);
    }

    // Additional error handling
    if (data.error) {
      reply(`Error: ${data.error.message || 'Unknown error occurred.'}`);
    }

  } catch (e) {
    console.log(e);
    reply(`Error: ${e.message}`);
  }
});
