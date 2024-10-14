const path = require('path');
const fs = require('fs');
const { cmd } = require('../command');
const { readEnv } = require('../lib/database');
const nodemailer = require('nodemailer');

// Function to create a VCF file for the contact
function createVCF(contactName, contactNumber) {
  const vcfEntry = `BEGIN:VCARD
VERSION:3.0
FN:${contactName}
TEL;TYPE=CELL:${contactNumber}
END:VCARD
`;
  return vcfEntry;
}

// Function to save the contact as a VCF file
function saveContactAsVCF(contactName, contactNumber) {
  const vcfFilePath = path.join(__dirname, 'contacts.vcf');
  const vcfEntry = createVCF(contactName, contactNumber);

  // Append the new VCF entry to the file
  fs.appendFileSync(vcfFilePath, vcfEntry, 'utf8');
  console.log(`Contact saved as VCF: ${contactName}, ${contactNumber}`);
}

// Function to track contact count and retrieve the next contact number
function getNextContactNumber() {
  const filePath = path.join(__dirname, 'contact_counter.txt');
  let count = 1;

  // If file exists, read and increment the count
  if (fs.existsSync(filePath)) {
    count = parseInt(fs.readFileSync(filePath, 'utf-8'), 10) + 1;
  }

  // Save the updated count
  fs.writeFileSync(filePath, count.toString());
  return count;
}

// Function to send saved contacts to the owner hourly
async function sendStoredContactsHourly(conn, ownerNumber) {
  const vcfFilePath = path.join(__dirname, 'contacts.vcf');

  // Read the contents of the VCF file
  if (fs.existsSync(vcfFilePath)) {
    const vcfData = fs.readFileSync(vcfFilePath, 'utf-8');

    // Send the VCF data to the owner's number
    await conn.sendMessage(ownerNumber, {
      document: { url: vcfFilePath },
      mimetype: 'text/vcard',
      caption: 'Here are your saved contacts.'
    });
    console.log(`Sent saved contacts to ${ownerNumber}`);
  }
}

// WhatsApp Bot Command to detect and save unsaved contacts
cmd({ on: 'body' }, async (conn, mek, m, { from, body, isOwner }) => {
  try {
    const config = await readEnv();

    // If auto-save feature is enabled in config
    if (config.AUTO_SAVE === 'true') {
      if (isOwner) return;  // Skip if it's the owner sending the message

      const sender = m.sender;

      // Check if the message is from a group
      if (!m.key.remoteJid.endsWith('@g.us')) {
        // Generate the next contact number
        const contactNumber = getNextContactNumber();
        const contactName = `DILAMD CONTACT (${contactNumber.toString().padStart(4, '0')})`;

        // Save contact as VCF
        saveContactAsVCF(contactName, sender);

        await m.reply(`New contact detected and saved as ${contactName}`);
      }
    }
  } catch (e) {
    console.log(e);
    await m.reply(`Error: ${e.message}`);
  }
});

// Periodically send saved contacts to the owner every hour
setInterval(async () => {
  const config = await readEnv();
  await sendStoredContactsHourly(conn, config.OWNER_NUMBER); // Pass conn here
}, 3600000); // 3600000 milliseconds = 1 hour
