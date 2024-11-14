const config = require('../config');
const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const mega = require('megajs');

// Mega login credentials
const megaEmail = 'www.themiyaofficialdilan@gmail.com';
const megaPassword = 'Td01@mega';

// Path for local contacts file
const contactsFilePath = path.join(__dirname, 'contacts.vcf');

// Initialize Mega storage
const storage = mega({
  email: megaEmail,
  password: megaPassword
});

// Function to load contacts from the existing .vcf file
const loadContacts = () => {
  if (fs.existsSync(contactsFilePath)) {
    return fs.readFileSync(contactsFilePath, 'utf-8');
  }
  return '';
};

// Function to append a contact to the .vcf file
const appendContact = (number) => {
  const vCardFormat = `BEGIN:VCARD\nVERSION:2.1\nN:;${number};;;\nFN:${number}\nTEL;CELL:${number}\nEND:VCARD\n`;
  fs.appendFileSync(contactsFilePath, vCardFormat);
};

// Upload the file to Mega
const uploadToMega = async () => {
  const fileStream = fs.createReadStream(contactsFilePath);
  const upload = storage.upload({ name: 'contacts.vcf' });
  fileStream.pipe(upload);

  return new Promise((resolve, reject) => {
    upload.on('complete', () => {
      console.log('File uploaded to Mega successfully.');
      resolve();
    });
    upload.on('error', (err) => {
      console.error('Error uploading file to Mega:', err);
      reject(err);
    });
  });
};

cmd({
  pattern: "inboxContact",
  desc: "Save incoming contact to Mega",
  category: "main",
  filename: __filename
}, async (conn, mek, m, { from, senderNumber, reply }) => {
  try {
    // Ensure the code only runs for inbox messages
    if (m.isGroup) return;

    // Load current contacts from the .vcf file
    let contacts = loadContacts();

    // Check if the contact is already saved
    if (!contacts.includes(senderNumber)) {
      // Append new contact
      appendContact(senderNumber);

      // Upload the updated file to Mega
      await uploadToMega();

      // Send confirmation message
      reply(`Your contact has been saved successfully.`);
    } else {
      reply(`Your contact is already saved.`);
    }
  } catch (error) {
    console.error('Error handling incoming contact:', error);
    reply(`Error: ${error.message}`);
  }
});
