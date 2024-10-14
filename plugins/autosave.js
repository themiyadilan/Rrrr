const { readEnv } = require('../lib/database');
const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const nodemailer = require('nodemailer');

// Gmail credentials
const EMAIL = 'themiyadilan92@gmail.com';
const PASSWORD = 'stwu cucg jabm wbeh'; // Use an App Password if you have 2FA enabled

// Function to create a nodemailer transporter
function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL,
            pass: PASSWORD,
        },
    });
}

// Function to send email to save contact in Gmail
async function saveContactToGmail(phoneNumber, transporter) {
    const mailOptions = {
        from: EMAIL,
        to: EMAIL,
        subject: `New Contact: ${phoneNumber}`,
        text: `Please save this new contact: ${phoneNumber}`,
    };

    try {
        let result = await transporter.sendMail(mailOptions);
        console.log('Contact saved to Gmail:', phoneNumber);
        return result;
    } catch (error) {
        console.error('Error saving contact to Gmail:', error);
        return null;
    }
}

// Function to check if a number is saved (mock implementation)
function isNumberSaved(phoneNumber) {
    // Logic to check if the number is saved (replace with actual logic)
    return false; // Assume it's unsaved for demonstration
}

// Function to handle incoming message from unsaved number
async function handleIncomingMessage(conn, m, phoneNumber) {
    console.log(`Received message from: ${phoneNumber}`);

    // Send message to user: Checking if the number is saved
    await m.reply('Checking if the number is saved... 🔄');

    // Check if number is saved
    const saved = isNumberSaved(phoneNumber);

    if (!saved) {
        console.log('Number is not saved, attempting to save...');

        // Save the number in Gmail
        const transporter = createTransporter();
        const saveResult = await saveContactToGmail(phoneNumber, transporter);

        if (saveResult) {
            // Successfully saved, send confirmation to the user
            await m.reply('You\'re automatically served.... ✅');
        } else {
            // Failed to save contact
            await m.reply('Failed to save your contact. Please try again later.');
        }
    } else {
        console.log('Number is already saved.');
    }
}

// Main bot command handler
cmd({ on: "body" }, async (conn, mek, m, { from, body, isOwner }) => {
    try {
        const config = await readEnv();

        // Only execute if AUTO_SAVE is enabled
        if (config.AUTO_SAVE === 'true') {
            if (isOwner) return;

            // Extract phone number from the 'from' field
            const phoneNumber = from; // Modify if needed

            // Handle the message based on whether the number is saved
            await handleIncomingMessage(conn, m, phoneNumber);
        }
    } catch (e) {
        console.log(e);
        await m.reply(`Error: ${e.message}`);
    }
});
