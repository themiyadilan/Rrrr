const { cmd } = require('../command');
const schedule = require('node-schedule');
const moment = require('moment-timezone'); // Ensure you have installed this package
const { readEnv } = require('../lib/database'); // Ensure this path is correct

const TIMEZONE = 'Asia/Colombo';  // Set the timezone

// Function to adjust time by subtracting 5 hours and 30 minutes
function adjustTime(time) {
    const [hour, minute] = time.split(':').map(Number);
    return moment.tz({ hour, minute }, TIMEZONE).subtract(5, 'hours').subtract(30, 'minutes').format('HH:mm');
}

// Load group times from configuration
async function loadGroupTimes(conn) {
    const config = await readEnv();
    
    if (config.GROUPS_TIMES) {
        const groups = config.GROUPS_TIMES.split('/');

        groups.forEach(group => {
            const match = group.match(/(.*?)/g);  // Adjusted regex to match parentheses
            if (match && match.length === 3) {
                const groupId = match[0].slice(1, -1);
                const openTimes = match[1].slice(1, -1).split(',');
                const closeTimes = match[2].slice(1, -1).split(',');

                // Schedule opening times
                openTimes.forEach(openTime => {
                    const adjustedOpenTime = adjustTime(openTime);
                    const [adjustedHour, adjustedMinute] = adjustedOpenTime.split(':').map(Number);
                    const openCron = `0 ${adjustedMinute} ${adjustedHour} * * *`;

                    schedule.scheduleJob(`open_${groupId}_${openTime}`, openCron, async () => {
                        await conn.groupSettingUpdate(groupId, 'not_announcement');
                        await conn.sendMessage(groupId, { text: `*𝗚𝗿𝗼𝘂𝗽 𝗢𝗽𝗲𝗻𝗲𝗱 𝗮𝘁 ${openTime}. 🔓*\nᴍʀ ᴅɪʟᴀ ᴏꜰᴄ` });
                    });
                });

                // Schedule closing times
                closeTimes.forEach(closeTime => {
                    const adjustedCloseTime = adjustTime(closeTime);
                    const [adjustedHour, adjustedMinute] = adjustedCloseTime.split(':').map(Number);
                    const closeCron = `0 ${adjustedMinute} ${adjustedHour} * * *`;

                    schedule.scheduleJob(`close_${groupId}_${closeTime}`, closeCron, async () => {
                        await conn.groupSettingUpdate(groupId, 'announcement');
                        await conn.sendMessage(groupId, { text: `*𝗚𝗿𝗼𝘂𝗽 𝗖𝗹𝗼𝘀𝗲𝗱 𝗮𝘁 ${closeTime}. 🔒*\nᴍʀ ᴅɪʟᴀ ᴏꜰᴄ` });
                    });
                });
            }
        });
    } else {
        console.log("No group times found in configuration.");
    }
}

// Initialize the WhatsApp connection (example placeholder)
async function initializeConnection() {
    const { Client } = require('whatsapp-web.js');
    const client = new Client();

    client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr);
        // Generate QR code for authentication
    });

    client.on('ready', async () => {
        console.log('Client is ready!');

        // Load group times once the client is ready
        await loadGroupTimes(client);
    });

    client.initialize().catch(error => console.error("Connection Error:", error));
}

// Start the bot
initializeConnection();
