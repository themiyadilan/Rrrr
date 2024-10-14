const fs = require('fs');
const path = require('path');
const mega = require('mega'); // Ensure the mega package is installed and updated
const { cmd } = require('../command');
const { readEnv } = require('../lib/database');
const ownerNumber = readEnv('config.OWNER_NUMBER');

// Mega Account Credentials
const megaEmail = 'www.themiyaofficialdilan@gmail.com';
const megaPass = 'Td01@mega';

let contactCount = 1; // Track the number of saved contacts

// Function to save contact and generate vCard
async function saveContact(phoneNumber) {
    const contactName = `zDILAMD ${String(contactCount).padStart(4, '0')}`;
    contactCount++;

    // Create vCard data
    const vCardData = `
BEGIN:VCARD
VERSION:3.0
FN:${contactName}
TEL;TYPE=CELL:${phoneNumber}
END:VCARD
    `;
    const vCardPath = path.join(__dirname, `${contactName}.vcf`);
    fs.writeFileSync(vCardPath, vCardData, 'utf8');

    console.log(`Saved contact ${contactName} with number ${phoneNumber}`);

    // Notify the owner (await the promise to ensure it's resolved)
    await sendOwnerNotification(contactName, phoneNumber);

    // Save to Mega (file uploading)
    saveToMega(vCardPath, contactName);
}

// Function to notify the owner (send message to owner number)
async function sendOwnerNotification(contactName, phoneNumber) {
    try {
        console.log(`Notifying owner (${ownerNumber}): Saved ${contactName} with number ${phoneNumber}`);
        // Example of sending a message via WhatsApp API
        // await sendWhatsAppMessage(ownerNumber, `Saved ${contactName} with number ${phoneNumber}`);
    } catch (error) {
        console.error('Error notifying owner:', error);
    }
}

// Function to save the vCard file to Mega with enhanced error handling
function saveToMega(filePath, contactName) {
    console.log('Attempting to save to Mega with credentials:', megaEmail, megaPass);

    try {
        const storage = mega({ email: megaEmail, password: megaPass }, function (err) {
            if (err) {
                console.error('Error logging into Mega:', err);
                return;
            }
            console.log('Logged into Mega');

            // Attempt to upload the file to Mega
            storage.upload(filePath, contactName, function (err, file) {
                if (err) {
                    console.error('Error uploading file to Mega:', err);
                    return;
                }
                console.log(`File uploaded: ${contactName}`);
            });
        });

        // Listen for any storage-related errors
        storage.on('error', (err) => {
            console.error('Storage error:', err);
        });
    } catch (error) {
        console.error('Unexpected error during Mega upload:', error);
    }
}

// Function to handle incoming messages (checks if number is saved, then saves if not)
async function handleIncomingMessage(phoneNumber) {
    // Check if the number is already saved (mock function for now)
    if (!isNumberSaved(phoneNumber)) {
        await saveContact(phoneNumber);
    } else {
        console.log(`Number ${phoneNumber} is already saved`);
    }
}

// Mock function to check if a number is already saved
function isNumberSaved(phoneNumber) {
    // Logic to check if the phone number exists in your contact list or database
    // For now, it always returns false (i.e., number is not saved)
    return false;
}

// Example usage: handling an incoming message with a phone number
handleIncomingMessage('+1234567890');
