const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');
const mega = require('mega'); // Ensure you have installed this via npm
const { readEnv } = require('../lib/database');
const ownerNumber = readEnv('config.OWNER_NUMBER');

// Mega Account Credentials
const megaEmail = 'www.themiyaofficialdilan@gmail.com';
const megaPass = 'Td01@mega';

let contactCount = 1; // Track the number of saved contacts

// Function to save contact
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

    // Notify the owner (make sure to await the function if it's async)
    await sendOwnerNotification(contactName, phoneNumber);
    
    // Save to Mega
    saveToMega(vCardPath, contactName);
}

// Function to notify the owner (make sure to handle promise properly)
async function sendOwnerNotification(contactName, phoneNumber) {
    // Assuming you use a WhatsApp API to send a message
    try {
        console.log(`Notifying owner (${ownerNumber}): Saved ${contactName} with number ${phoneNumber}`);
        // Your WhatsApp API or messaging function here
        // e.g., await sendWhatsAppMessage(ownerNumber, `Saved ${contactName} with number ${phoneNumber}`);
    } catch (error) {
        console.error('Error notifying owner:', error);
    }
}

// Function to save vCard to Mega
function saveToMega(filePath, contactName) {
    const storage = mega({ email: megaEmail, password: megaPass }, function(err) {
        if (err) {
            console.error('Error logging into Mega:', err);
            return;
        }
        console.log('Logged into Mega');

        // Attempt to upload the file
        storage.upload(filePath, contactName, function(err, file) {
            if (err) {
                console.error('Error uploading file to Mega:', err);
                return;
            }
            console.log(`File uploaded: ${contactName}`);
        });
    });

    storage.on('error', (err) => {
        console.error('Storage error:', err);
    });
}

// Simulate an incoming message from a new number
async function handleIncomingMessage(phoneNumber) {
    // Check if number is already saved (pseudo-code)
    if (!isNumberSaved(phoneNumber)) {
        await saveContact(phoneNumber);
    } else {
        console.log(`Number ${phoneNumber} is already saved`);
    }
}

// Function to check if number is saved (mock function for this example)
function isNumberSaved(phoneNumber) {
    // Logic to check if the phone number exists in your contact list or database
    return false;
}

// Example usage
handleIncomingMessage('+1234567890');
