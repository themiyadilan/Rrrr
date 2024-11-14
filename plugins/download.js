const { fetchJson } = require('../lib/functions');
const config = require('../config');
const { cmd } = require('../command');
const sensitiveData = require('../dila_md_licence/a/b/c/d/dddamsbs');

let baseUrl;
(async () => {
    try {
        let baseUrlGet = await fetchJson(sensitiveData.baseUrlPath);
        baseUrl = baseUrlGet.api;
    } catch (error) {
        console.error('Failed to fetch base URL:', error);
    }
})();

const yourName = sensitiveData.nameSignature;

// Event Listener for Numeric Reply Handling
async function handleNumericReply(conn, msg) {
    const selectedOption = msg.message.extendedTextMessage.text.trim();
    if (msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.stanzaId === vv.key.id) {
        try {
            switch (selectedOption) {
                case '1':
                    await conn.reply(msg.key.remoteJid, "Option 1 selected: Processing your request...", msg);
                    break;
                case '2':
                    await conn.reply(msg.key.remoteJid, "Option 2 selected: Processing your request...", msg);
                    break;
                default:
                    await conn.reply(msg.key.remoteJid, "Error: Invalid option selected.", msg);
            }
        } catch (e) {
            console.error(e);
            await conn.reply(msg.key.remoteJid, "An error occurred while processing your request.", msg);
        }
    } else {
        await conn.reply(msg.key.remoteJid, '❌ Failed to fetch the download link. Please try again later ❌', msg);
    }
}

conn.ev.on('messages.upsert', async (msgUpdate) => {
    const msg = msgUpdate.messages[0];
    if (!msg.message || !msg.message.extendedTextMessage) return;
    await handleNumericReply(conn, msg);
});

// Facebook Video Download Command
cmd({
    pattern: "fb",
    alias: ["facebook"],
    desc: "Download FB videos",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q || !q.startsWith("https://")) return reply(sensitiveData.linkRequestMessage);

        let data = await fetchJson(`${baseUrl}/api/fdown?url=${q}`);
        reply("*Downloading... 📥*");

        const selectedOption = m.message.extendedTextMessage.text.trim();
        switch (selectedOption) {
            case '1':
                if (data.data.hd) {
                    await conn.sendMessage(from, {
                        video: { url: data.data.hd },
                        mimetype: "video/mp4",
                        caption: `📺 FB HD VIDEO 🚀✨🎥\n\n ${yourName}`
                    }, { quoted: mek });
                }
                break;

            case '2':
                if (data.data.sd) {
                    await conn.sendMessage(from, {
                        video: { url: data.data.sd },
                        mimetype: "video/mp4",
                        caption: `📱 FB SD VIDEO 🎬⚡📥\n\n ${yourName}`
                    }, { quoted: mek });
                }
                break;

            default:
                reply("❌ Error: Invalid option selected. Please try again. ❌");
        }
    } catch (e) {
        console.error(e);
        reply(`Error: ${e.message}`);
    }
});

// TikTok Video Download Command
cmd({
    pattern: "tiktok",
    alias: ["tt"],
    desc: "Download TikTok videos",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q || !q.startsWith("https://")) return reply(sensitiveData.linkRequestMessage);

        let data = await fetchJson(`${baseUrl}/api/tiktokdl?url=${q}`);
        reply("*Downloading... 📥*");

        const selectedOption = m.message.extendedTextMessage.text.trim();
        switch (selectedOption) {
            case '1':
                if (data.data.no_wm) {
                    await conn.sendMessage(from, {
                        video: { url: data.data.no_wm },
                        mimetype: "video/mp4",
                        caption: `🚀 NO-WATERMARK DilaMD TIKTOK DOWNLOADER 🎵✨📥\n\n ${yourName}`
                    }, { quoted: mek });
                }
                break;

            case '2':
                if (data.data.wm) {
                    await conn.sendMessage(from, {
                        video: { url: data.data.wm },
                        mimetype: "video/mp4",
                        caption: `${sensitiveData.watermarkMessage}\n\n ${yourName}`
                    }, { quoted: mek });
                }
                break;

            case '3':
                if (data.data.audio) {
                    await conn.sendMessage(from, {
                        audio: { url: data.data.audio },
                        mimetype: "audio/mpeg"
                    }, { quoted: mek });
                }
                break;

            default:
                reply("❌ Error: Invalid option selected. Please try again. ❌");
        }
    } catch (e) {
        console.error(e);
        reply(`Error: ${e.message}`);
    }
});
