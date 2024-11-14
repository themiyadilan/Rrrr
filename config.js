const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "",
MONGODB: process.env.MONGODB || "",
LANG: process.env.LANG || "EN",
FOOTER: process.env.FOOTER || "Mr Dila",
BTN: process.env.BTN || "Click Here",
MAX_SIZE: process.env.MAX_SIZE || "300",

};
