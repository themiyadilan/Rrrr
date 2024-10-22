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
            caption: message.body,
            footer: message.footer,
            buttons: buttons,
            headerType: 4 // This may need to change based on your implementation
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
                name: 'download_hd',
                buttonParamsJson: JSON.stringify({
                    title: 'DOWNLOAD FB HD VIDEO',
                    id: `fbhd ${data.data.hd}`
                })
            });
        }

        if (data?.data?.sd) {
            buttons.push({
                name: 'download_sd',
                buttonParamsJson: JSON.stringify({
                    title: 'DOWNLOAD FB SD VIDEO',
                    id: `fb ${data.data.sd}`
                })
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
                name: 'download_no_watermark',
                buttonParamsJson: JSON.stringify({
                    title: 'DOWNLOAD NO-WATERMARK VIDEO',
                    id: `ttnw ${data.data.no_wm}`
                })
            });
        }

        if (data?.data?.wm) {
            buttons.push({
                name: 'download_watermark',
                buttonParamsJson: JSON.stringify({
                    title: 'DOWNLOAD WATERMARK VIDEO',
                    id: `ttwm ${data.data.wm}`
                })
            });
        }

        if (data?.data?.audio) {
            buttons.push({
                name: 'download_audio',
                buttonParamsJson: JSON.stringify({
                    title: 'DOWNLOAD AUDIO',
                    id: `ttaudio ${data.data.audio}`
                })
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

        if (command.startsWith('fb')) {
            await conn.sendMessage(from, { video: { url: url }, mimetype: "video/mp4", caption: `📺 FB VIDEO 🚀✨\n\n ${yourName}` }, { quoted: mek });
        } else if (command.startsWith('tt')) {
            await conn.sendMessage(from, { video: { url: url }, mimetype: "video/mp4", caption: `🚀 TIKTOK VIDEO 🚀✨\n\n ${yourName}` }, { quoted: mek });
        } else if (command === 'ttaudio') {
            await conn.sendMessage(from, { audio: { url: url }, mimetype: "audio/mpeg" }, { quoted: mek });
        }
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (e) {
        console.error(e);
        reply('*Error !!*');
    }
});
