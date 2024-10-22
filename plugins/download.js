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

// Function to send messages with buttons
async function sendButtonMessage(conn, from, buttons, m, message) {
    try {
        const buttonMessage = {
            text: message.body,
            footer: message.footer,
            buttons: buttons,
            headerType: 4 // Adjust based on your implementation
        };
        await conn.sendMessage(from, buttonMessage, { quoted: m });
    } catch (error) {
        console.error('Failed to send button message:', error);
    }
}

// Command for downloading Facebook videos
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
        let buttons = [];

        if (data?.data?.hd) {
            buttons.push({
                buttonId: `fbhd ${data.data.hd}`,
                buttonText: { displayText: 'DOWNLOAD FB HD VIDEO' },
                type: 1
            });
        }

        if (data?.data?.sd) {
            buttons.push({
                buttonId: `fb ${data.data.sd}`,
                buttonText: { displayText: 'DOWNLOAD FB SD VIDEO' },
                type: 1
            });
        }

        if (buttons.length > 0) {
            let message = {
                footer: config.FOOTER,
                body: `*Downloading... 📥*\n\nChoose your option:`
            };
            return sendButtonMessage(conn, from, buttons, m, message);
        } else {
            return reply(`No downloadable video found.`);
        }
    } catch (e) {
        console.error(e);
        reply(`Error: ${e.message}`);
    }
});

// Command for downloading TikTok videos
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
        let buttons = [];

        if (data?.data?.no_wm) {
            buttons.push({
                buttonId: `ttnw ${data.data.no_wm}`,
                buttonText: { displayText: 'DOWNLOAD NO-WATERMARK VIDEO' },
                type: 1
            });
        }

        if (data?.data?.wm) {
            buttons.push({
                buttonId: `ttwm ${data.data.wm}`,
                buttonText: { displayText: 'DOWNLOAD WATERMARK VIDEO' },
                type: 1
            });
        }

        if (data?.data?.audio) {
            buttons.push({
                buttonId: `ttaudio ${data.data.audio}`,
                buttonText: { displayText: 'DOWNLOAD AUDIO' },
                type: 1
            });
        }

        if (buttons.length > 0) {
            let message = {
                footer: config.FOOTER,
                body: `*Downloading... 📥*\n\nChoose your option:`
            };
            return sendButtonMessage(conn, from, buttons, m, message);
        } else {
            return reply(`No downloadable content found.`);
        }
    } catch (e) {
        console.error(e);
        reply(`Error: ${e.message}`);
    }
});

// Command for handling button clicks
cmd({
    pattern: "fbhd|fb|ttnw|ttwm|ttaudio",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { from, command, args }) => {
    try {
        const url = args.join(' '); // Extracting the URL from the command
        let wm = config.FOOTER;

        // Log the command and URL being processed
        console.log(`Command: ${command}, URL: ${url}`);

        if (command.startsWith('fb')) {
            // Ensure the URL is valid
            if (url) {
                await conn.sendMessage(from, { video: { url: url }, mimetype: "video/mp4", caption: `📺 FB VIDEO 🚀✨\n\n ${yourName}` }, { quoted: mek });
            } else {
                reply('Invalid FB video URL.');
            }
        } else if (command.startsWith('tt')) {
            // Ensure the URL is valid
            if (url) {
                await conn.sendMessage(from, { video: { url: url }, mimetype: "video/mp4", caption: `🚀 TIKTOK VIDEO 🚀✨\n\n ${yourName}` }, { quoted: mek });
            } else {
                reply('Invalid TikTok video URL.');
            }
        } else if (command === 'ttaudio') {
            // Ensure the URL is valid
            if (url) {
                await conn.sendMessage(from, { audio: { url: url }, mimetype: "audio/mpeg" }, { quoted: mek });
            } else {
                reply('Invalid audio URL.');
            }
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (e) {
        console.error('Error while sending media:', e);
        reply('*Error !!*');
    }
});
