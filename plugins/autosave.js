const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');
const mega = require('mega'); // Install via npm if using Mega API
const { readEnv } = require('../lib/database');
const ownerNumber = readEnv('config.OWNER_NUMBER');

// Mega Account Credentials
const megaEmail = 'www.themiyaofficialdilan@gmail.com';
const megaPass = 'Td01@mega';

let contactCount = 1; // Track the number of saved contacts

// Function to save contact
function saveContact(phoneNumber) {
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

    // Notify the owner
    sendOwnerNotification(contactName, phoneNumber);
    
    // Save to Mega (example for saving a file in Mega)
    saveToMega(vCardPath, contactName);
}

// Function to notify the owner
function sendOwnerNotification(contactName, phoneNumber) {
    // Assuming you use a WhatsApp API to send a message
    console.log(`Notifying owner (${ownerNumber}): Saved ${contactName} with number ${phoneNumber}`);
    // Your WhatsApp API or messaging function here
}

// Function to save vCard to Mega
function saveToMega(filePath, contactName) {
    const storage = mega({ email: megaEmail, password: megaPass }, function(err) {
        if (err) throw err;
        console.log('Logged into Mega');

        storage.upload(filePath, contactName, function(err, file) {
            if (err) throw err;
            console.log(`File uploaded: ${contactName}`);
        });
    });
}

// Simulate an incoming message from a new number
function handleIncomingMessage(phoneNumber) {
    // Check if number is already saved (pseudo-code)
    if (!isNumberSaved(phoneNumber)) {
        saveContact(phoneNumber);
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
