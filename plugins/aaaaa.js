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
  console.log('Loading contacts from file...');
  if (fs.existsSync(contactsFilePath)) {
    console.log('Contacts file found. Reading data...');
    return fs.readFileSync(contactsFilePath, 'utf-8');
  }
  console.log('No existing contacts file found.');
  return '';
};

// Function to append a contact to the .vcf file
const appendContact = (number) => {
  console.log(`Appending contact: ${number}`);
  const vCardFormat = `BEGIN:VCARD\nVERSION:2.1\nN:;${number};;;\nFN:${number}\nTEL;CELL:${number}\nEND:VCARD\n`;
  fs.appendFileSync(contactsFilePath, vCardFormat);
  console.log('Contact appended successfully.');
};

// Upload the file to Mega
const uploadToMega = async () => {
  console.log('Starting file upload to Mega...');
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
    console.log('Received command for saving contact.');

    // Ensure the code only runs for inbox messages
    if (m.isGroup) {
      console.log('Message is from a group. Ignoring.');
      return;
    }

    // Load current contacts from the .vcf file
    let contacts = loadContacts();
    console.log('Loaded contacts:', contacts);

    // Check if the contact is already saved
    if (!contacts.includes(senderNumber)) {
      console.log(`Contact ${senderNumber} is new. Saving...`);
      // Append new contact
      appendContact(senderNumber);

      // Upload the updated file to Mega
      await uploadToMega();

      // Send confirmation message
      reply(`Your contact has been saved successfully.`);
      console.log('Contact saving and upload process completed.');
    } else {
      console.log(`Contact ${senderNumber} is already in the file.`);
      reply(`Your contact is already saved.`);
    }
  } catch (error) {
    console.error('Error handling incoming contact:', error);
    reply(`Error: ${error.message}`);
  }
});
