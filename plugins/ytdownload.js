const { cmd } = require('../command');
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const sensitiveData = require('../dila_md_licence/a/b/c/d/dddamsbs');
const { PassThrough } = require('stream');

// Format views
const formatViews = views => views >= 1_000_000_000 ? `${(views / 1_000_000_000).toFixed(1)}B` :
    views >= 1_000_000 ? `${(views / 1_000_000).toFixed(1)}M` :
    views >= 1_000 ? `${(views / 1_000).toFixed(1)}K` : views.toString();

// Command for downloading songs (audio)
cmd({
    pattern: "song",
    desc: "Download songs",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            await conn.sendPresenceUpdate('recording', from);
            await conn.sendMessage(from, { audio: { url: 'https://github.com/themiyadilann/DilaMD-Media/raw/main/voice/song.mp3' }, mimetype: 'audio/mpeg', ptt: true }, { quoted: mek });
            return;
        }

        const search = await yts(q);
        const data = search.videos[0];
        const url = data.url;

        let desc = `> ${sensitiveData.hhhhhhczss}\n\n🎶 *𝗧𝗶𝘁𝗹𝗲*: _${data.title}_\n👤 *𝗖𝗵𝗮𝗻𝗻𝗲𝗹*: _${data.author.name}_\n📝 *𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻*: _${data.description}_\n⏳ *𝗧𝗶𝗺𝗲*: _${data.timestamp}_\n⏱️ *𝗔𝗴𝗼*: _${data.ago}_\n👁️‍🗨️ *𝗩𝗶𝗲𝘄𝘀*: _${formatViews(data.views)}_\n🔗 *𝗟𝗶𝗻𝗸*: ${url}\n\n${sensitiveData.siteUrl}\n${sensitiveData.footerText}`;

        await conn.sendPresenceUpdate('typing', from);
        await conn.sendMessage(from, { image: { url: data.thumbnail }, caption: desc }, { quoted: mek });

        // Downloading audio using ytdl-core
        const downloadUrl = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
        const audioStream = new PassThrough();
        downloadUrl.pipe(audioStream);

        // Wait for the stream to finish
        audioStream.on('finish', async () => {
            await conn.sendPresenceUpdate('recording', from);
            await conn.sendMessage(from, { audio: { stream: audioStream }, mimetype: "audio/mpeg" }, { quoted: mek });
            await conn.sendMessage(from, { document: { stream: audioStream }, mimetype: "audio/mpeg", fileName: `${data.title}.mp3`, caption: "💻 *ᴍᴀᴅᴇ ʙʏ ᴍʀᴅɪʟᴀ*" }, { quoted: mek });
        });

        // Error handling
        audioStream.on('error', (err) => {
            console.log('Audio Stream Error:', err);
            reply(`Error: ${err.message}`);
        });
    } catch (e) {
        console.log(e);
        reply(`Error: ${e.message}`);
    }
});

// Command for downloading videos
cmd({
    pattern: "video",
    desc: "Download videos",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            await conn.sendPresenceUpdate('recording', from);
            await conn.sendMessage(from, { audio: { url: 'https://github.com/themiyadilann/DilaMD-Media/raw/main/voice/video.mp3' }, mimetype: 'audio/mpeg', ptt: true }, { quoted: mek });
            return;
        }

        const search = await yts(q);
        const data = search.videos[0];
        const url = data.url;

        let desc = `${sensitiveData.ffdssajjj}\n\n🎶 *𝗧𝗶𝘁𝗹𝗲*: _${data.title}_\n👤 *𝗖𝗵𝗮𝗻𝗻𝗲𝗹*: _${data.author.name}_\n📝 *𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻*: _${data.description}_\n⏳ *𝗧𝗶𝗺𝗲*: _${data.timestamp}_\n⏱️ *𝗔𝗴𝗼*: _${data.ago}_\n👁️‍🗨️ *𝗩𝗶𝗲𝘄𝘀*: _${formatViews(data.views)}_\n🔗 *𝗟𝗶𝗻𝗸*: ${url}\n\n${sensitiveData.siteUrl}\n${sensitiveData.footerText}`;

        await conn.sendPresenceUpdate('typing', from);
        await conn.sendMessage(from, { image: { url: data.thumbnail }, caption: desc }, { quoted: mek });

        // Downloading video using ytdl-core
        const downloadUrl = ytdl(url, { quality: 'highestvideo' });
        const videoStream = new PassThrough();
        downloadUrl.pipe(videoStream);

        // Wait for the stream to finish
        videoStream.on('finish', async () => {
            await conn.sendMessage(from, { video: { stream: videoStream }, mimetype: "video/mp4" }, { quoted: mek });
            await conn.sendMessage(from, { document: { stream: videoStream }, mimetype: "video/mp4", fileName: `${data.title}.mp4`, caption: "💻 *ᴍᴀᴅᴇ ʙʏ ᴍʀᴅɪʟᴀ*" }, { quoted: mek });
        });

        // Error handling
        videoStream.on('error', (err) => {
            console.log('Video Stream Error:', err);
            reply(`Error: ${err.message}`);
        });
    } catch (e) {
        console.log(e);
        reply(`Error: ${e.message}`);
    }
});
