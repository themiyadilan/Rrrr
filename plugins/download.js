const { fetchJson } = require('../lib/functions');
const config = require('../config');
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

// Facebook Download Command
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
        
        // Send a button message
        const buttonMessage = {
            text: "*Choose the quality of the video:*",
            footer: "Select an option",
            buttons: [
                { buttonId: `fb_hd_${q}`, buttonText: { displayText: "HD Video" }, type: 1 },
                { buttonId: `fb_sd_${q}`, buttonText: { displayText: "SD Video" }, type: 1 }
            ],
            headerType: 2
        };
        await conn.sendMessage(from, buttonMessage, { quoted: mek });

        // Handle button actions (this will need to be implemented in your button handling logic)
    } catch (e) {
        console.error(e);
        reply(`Error: ${e.message}`);
    }
});

// TikTok Download Command
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

        // Send a button message
        const buttonMessage = {
            text: "*Choose the quality of the video:*",
            footer: "Select an option",
            buttons: [
                { buttonId: `tt_no_wm_${q}`, buttonText: { displayText: "No Watermark" }, type: 1 },
                { buttonId: `tt_wm_${q}`, buttonText: { displayText: "With Watermark" }, type: 1 }
            ],
            headerType: 2
        };
        await conn.sendMessage(from, buttonMessage, { quoted: mek });

        // Handle button actions (this will need to be implemented in your button handling logic)
    } catch (e) {
        console.error(e);
        reply(`Error: ${e.message}`);
    }
});
