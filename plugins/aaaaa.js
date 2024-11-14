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
    // Define poll options with unique IDs and details
    const pollOptions = [
      { option: "Option 1", id: 'poll_1', description: "Tap 1 to select this option", voteCount: 0 },
      { option: "Option 2", id: 'poll_2', description: "Tap 2 to select this option", voteCount: 0 },
      { option: "Option 3", id: 'poll_3', description: "Tap 3 to select this option", voteCount: 0 }
    ];

    // Generate poll list message content
    const pollMessage = {
      text: `*Poll Question*\n\nChoose one of the following options:`,
      footer: "Poll options",
      buttons: pollOptions.map((opt, index) => ({
        buttonId: opt.id,
        buttonText: { displayText: `Tap ${index + 1}` },
        type: 1
      })),
      headerType: 1
    };

    // Send the poll message with button options
    await conn.sendMessage(from, pollMessage, { quoted: mek });

    // Handle button responses within the same command
    if (m.message.buttonsResponseMessage) {
      const selectedButtonId = m.message.buttonsResponseMessage.selectedButtonId;

      // Check if the user has already voted
      if (pollVotes[senderNumber]) {
        reply("You have already voted in this poll.");
        return;
      }

      // Register the vote to prevent multiple responses
      pollVotes[senderNumber] = selectedButtonId;

      // Update vote count and prepare response based on the selected option
      let responseText = "";
      const selectedOption = pollOptions.find(opt => opt.id === selectedButtonId);
      if (selectedOption) {
        selectedOption.voteCount++;
        responseText = `You selected: ${selectedOption.option}\n\n*Description:* ${selectedOption.description}`;
      } else {
        responseText = "Invalid selection.";
      }

      // Send confirmation of selection with option details
      await conn.sendMessage(from, { text: responseText }, { quoted: mek });
    }

  } catch (error) {
    console.error("Error creating poll:", error);
    reply(`Error: ${error.message}`);
  }
});
