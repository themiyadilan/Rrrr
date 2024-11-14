const fs = require('fs');
const path = require('path');
const { readEnv } = require('../lib/database');
const { cmd, commands } = require('../command');
const { fetchJson } = require('../lib/functions');

(async () => {
    try {
        const config = await readEnv();

        async function sendReplies(conn, from, replies, pushname) {
            for (const [index, reply] of replies.entries()) {
                setTimeout(async () => {
                    await conn.sendMessage(from, { text: reply.replace('${pushname}', pushname) }, { quoted: null });
                }, index * 700);
            }
        }

        cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner, pushname }) => {
            const sequenceTrigger = config.WCPROFILEMSG ? config.WCPROFILEMSG.toLowerCase() : '';

              if (body.toLowerCase() === sequenceTrigger) {
                const replies = [
                    `Ｆᴏʀ ＳᴛΔᵀᴜs Ｖɪᴠᴇs "🙇🏻‍♀️❤️🖇️`, `*𝗛𝗘𝗬* ${pushname}`,`> *I am ${config.WCPROFILENAME}👤*`,`> *From - ${config.WCPROFILEFROM}📍*`,`> *Age - ${config.WCPROFILEAGE}🎂*`,`> *Nice to meet you ♥️🧚‍♀*`,`Save Me &  Send Yours Details 👸🏻\n\n♡ ㅤ      ❍ㅤ        ⎙ㅤ    ⌲ 
              ʳᵉᵖˡʸ       ˢᵃᵛᵉ     ˢʰᵃʳᵉ`
                ];
                await sendReplies(conn, from, replies, pushname);
            }

            // Command for 'link' with link preview enabled
            if (body.toLowerCase() === 'link') {
                const ownerNumber = config.OWNER_NUMBER ? config.OWNER_NUMBER.replace('@s.whatsapp.net', '') : '';
                const linkReply = `🧚🏻‍♂️ Ｆᴏʀ ＳᴛΔᵀᴜs Ｖɪᴠᴇs "🙇🏻‍♀️❤️🖇️ ۝❥━──➸➽❥❂❥*\n~Click This Link for status view & friendship😇💗~\n\nhttps://wa.me/${ownerNumber}?text=${encodeURIComponent(config.WCPROFILEMSG)} \n\n ලොකුකම නැතුව මැසෙජ් එකක් දාන්න....🥺💔\n*I am ${config.WCPROFILENAME} 👤*\n*From - ${config.WCPROFILEFROM} 📍*\n*Age - ${config.WCPROFILEAGE} 🎂*\n\n ♡ ㅤ      ❍ㅤ        ⎙ㅤ    ⌲ 
              ʳᵉᵖˡʸ       ˢᵃᵛᵉ     ˢʰᵃʳᵉ`;

                // Send message with link preview
                await conn.sendMessage(from, { 
                    text: linkReply, 
                    previewType: 'https://files.catbox.moe/h34zzk.jpeg' // This enables the link preview
                }, { quoted: null });
            }

            // Respond to 'name' command
            if (body.toLowerCase().startsWith('name')) {
                const nameReply = `*Your Name Is* ${pushname}`;
                await conn.sendMessage(from, { text: nameReply }, { quoted: null });
            }
        });
    } catch (error) {
        console.error('Error initializing bot:', error);
    }
})();
