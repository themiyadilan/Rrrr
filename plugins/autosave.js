const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { cmd } = require('../command');

// Load client secrets from a local file
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Email configuration using Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'www.themiyaofficialdilan@gmail.com',  // Your email
    pass: 'iiwd rdpf fsyo tkvu'                   // Use the App Password generated here
  }
});

// Authorize a client with credentials
async function authorize() {
  const { client_secret, client_id, redirect_uris } = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token
  if (fs.existsSync(TOKEN_PATH)) {
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
  } else {
    // Obtain a new token and save it
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/contacts'],
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    // After authorization, you'll get a code to exchange for a token
    const code = 'YOUR_AUTHORIZATION_CODE'; // Replace with the actual code
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log('Token stored to', TOKEN_PATH);
  }
  return oAuth2Client;
}

// Function to add a contact to Google Contacts
async function addContact(auth, contactName, contactNumber) {
  const service = google.people({ version: 'v1', auth });
  const contact = {
    names: [{ givenName: contactName }],
    phoneNumbers: [{ value: contactNumber }]
  };

  try {
    const response = await service.people.createContact({ requestBody: contact });
    console.log('Contact created:', response.data);
  } catch (error) {
    console.error('Error creating contact:', error);
  }
}

// Function to send email with contact information
function sendEmail(contact, contactNumber) {
  const contactName = `DILAMD CONTACT (${contactNumber.toString().padStart(4, '0')})`;  // Format contact as DILAMD CONTACT (0001)

  const mailOptions = {
    from: 'www.themiyaofficialdilan@gmail.com',    // Sender's email
    to: 'www.themiyaofficialdilan@gmail.com',      // Recipient's email (can be the same as the sender)
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

// WhatsApp Bot Command to detect and send unsaved contacts via email and Google Contacts
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

        // Authorize with Google API
        const auth = await authorize();

        // Add contact to Google Contacts
        await addContact(auth, contactName, sender);

        // Send email notification
        sendEmail(sender, contactNumber);

        await m.reply(`New contact detected and saved in your Google Contacts as ${contactName}`);
      }
    }
  } catch (e) {
    console.log(e);
    await m.reply(`Error: ${e.message}`);
  }
});
