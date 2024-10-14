const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { cmd } = require('../command');

// Email configuration using Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'www.themiyaofficialdilan@gmail.com',  // Your email
    pass: 'iiwd rdpf fsyo tkvu'                   // Use the App Password generated here
  }
});

// Function to send email with contact information
function sendEmail(contactName, contactNumber) {
  const mailOptions = {
    from: 'www.themiyaofficialdilan@gmail.com',    // Sender's email
    to: 'www.themiyaofficialdilan@gmail.com',      // Recipient's email (can be the same as the sender)
    subject: 'New Unsaved WhatsApp Contact',
    text: `A new unsaved contact was detected:\n\n` + 
          `Name: ${contactName}\n` + 
          `Phone Number: ${contactNumber}\n\n` +
          `Please save this contact to your address book.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent successfully:', info.response);
    }
  });
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

// Function to save the contact to a local file
function saveContact(contactName, contactNumber) {
  const contactsFilePath = path.join(__dirname, 'contacts.txt');
  const contactEntry = `${contactName}, ${contactNumber}\n`;

  // Append the new contact to the file
  fs.appendFileSync(contactsFilePath, contactEntry, 'utf8');
  console.log(`Contact saved: ${contactName}, ${contactNumber}`);
}

// WhatsApp Bot Command to detect and send unsaved contacts via email and save locally
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

        // Save contact locally
        saveContact(contactName, sender);

        // Send email notification
        sendEmail(contactName, sender);

        await m.reply(`New contact detected and saved as ${contactName}`);
      }
    }
  } catch (e) {
    console.log(e);
    await m.reply(`Error: ${e.message}`);
  }
});
