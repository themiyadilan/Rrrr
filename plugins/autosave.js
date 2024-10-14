const path = require('path');
const fs = require('fs');
const { readEnv } = require('../lib/database');
const { cmd } = require('../command');
const nodemailer = require('nodemailer');
const { fetchJson } = require('../lib/functions');

// Email configuration using Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'dilamdcontact@gmail.com',  // Replace with your email
    pass: 'Td01@google'    // Replace with your email password
  }
});

// Function to send email with contact information
function sendEmail(contact, contactNumber) {
  const contactName = `DILAMD CONTACT (${contactNumber.toString().padStart(4, '0')})`;  // Format contact as DILAMD CONTACT (0001)
  
  const mailOptions = {
    from: 'dilamdcontact@gmail.com',    // Sender's email
    to: 'dilamdcontact@gmail.com',      // Recipient's email (can be the same as the sender)
    subject: 'New Unsaved WhatsApp Contact',
    text: `A new unsaved contact was detected: \nName: ${contactName}\nPhone Number: ${contact}`
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

// WhatsApp Bot Command to detect and send unsaved contacts via email
cmd({ on: 'body' }, async (conn, mek, m, { from, body, isOwner }) => {
  try {
    const config = await readEnv();

    // If auto-save feature is enabled in config
    if (config.AUTO_SAVE === 'true') {
      if (isOwner) return;  // Skip if it's the owner sending the message

      const sender = m.sender;

      // Generate the next contact number and send the formatted contact via email
      const contactNumber = getNextContactNumber();
      sendEmail(sender, contactNumber);

      await m.reply(`New contact detected and sent to your email as DILAMD CONTACT (${contactNumber.toString().padStart(4, '0')})`);
    }
  } catch (e) {
    console.log(e);
    await m.reply(`Error: ${e.message}`);
  }
});
