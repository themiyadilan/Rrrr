const { cmd } = require('../command');
const { sendMessage } = require('../lib/functions');

// Track votes to prevent multiple responses
const pollVotes = {};

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

    // Send the poll message
    await conn.sendMessage(from, pollMessage, { quoted: mek });

    // Listen for button responses within the same command
    if (m.message.buttonsResponseMessage) {
      const selectedButtonId = m.message.buttonsResponseMessage.selectedButtonId;

      // Check if the user has already voted
      if (pollVotes[senderNumber]) {
        reply("You have already voted in this poll.");
        return;
      }

      // Register the vote to prevent multiple responses
      pollVotes[senderNumber] = selectedButtonId;

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

  } catch (error) {
    console.error("Error creating poll:", error);
    reply(`Error: ${error.message}`);
  }
});
