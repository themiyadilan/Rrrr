const { cmd } = require('../command');
const { sendMessage } = require('../lib/functions');

cmd({
  pattern: "poll",
  desc: "Create a poll",
  category: "main",
  react: "",
  filename: __filename
}, async (conn, mek, m, { from, quoted, isCmd, command, args, q, isGroup, sender, senderNumber, groupMetadata, reply }) => {
  try {
    // Define poll options
    const pollOptions = [
      { option: "Tap 1", voteCount: 0 },
      { option: "Tap 2", voteCount: 0 },
      { option: "Tap 3", voteCount: 0 }
    ];

    // Define poll message content
    const pollMessage = {
      text: `*Poll Question*\n\nTap this to choose an option`,
      footer: "Poll options",
      buttons: [
        { buttonId: 'poll_1', buttonText: { displayText: 'Tap 1' }, type: 1 },
        { buttonId: 'poll_2', buttonText: { displayText: 'Tap 2' }, type: 1 },
        { buttonId: 'poll_3', buttonText: { displayText: 'Tap 3' }, type: 1 }
      ],
      headerType: 1
    };

    // Send the poll message with options to the group
    await conn.sendMessage(from, pollMessage, { quoted: mek });

    // Handle button response logic
    conn.on('chat-update', async (msg) => {
      if (msg.message.buttonsResponseMessage && msg.key.fromMe === false) {
        const selectedButtonId = msg.message.buttonsResponseMessage.selectedButtonId;

        // Allow only one answer by storing user responses
        const pollVotes = {}; // Stores user votes based on sender ID

        if (pollVotes[msg.key.remoteJid]) {
          reply("You have already voted in this poll.");
          return;
        }

        pollVotes[msg.key.remoteJid] = selectedButtonId;

        let responseText = "";
        switch (selectedButtonId) {
          case 'poll_1':
            pollOptions[0].voteCount++;
            responseText = `You selected: Tap 1`;
            break;
          case 'poll_2':
            pollOptions[1].voteCount++;
            responseText = `You selected: Tap 2`;
            break;
          case 'poll_3':
            pollOptions[2].voteCount++;
            responseText = `You selected: Tap 3`;
            break;
        }

        // Send confirmation of selection
        await conn.sendMessage(from, { text: responseText }, { quoted: mek });
      }
    });

  } catch (error) {
    console.error("Error creating poll:", error);
    reply(`Error: ${error.message}`);
  }
});
