const fs = require("fs");
const path = require("path");

function parseChatFile() {
  const filePath = path.join(process.cwd(), "WhatsApp Chat with Divya 🩶(LP).txt");
  if (!fs.existsSync(filePath)) {
    console.error("Chat file not found at:", filePath);
    return [];
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const parsed = [];
  const messagePattern = /^(\d{2}\/\d{2}\/\d{4}), (\d{2}:\d{2}) - ([^:]+): (.*)$/;

  let currentMsg = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const match = line.match(messagePattern);
    if (match) {
      if (currentMsg) {
        parsed.push(currentMsg);
      }
      const [_, dateStr, timeStr, sender, msgContent] = match;
      currentMsg = {
        id: `msg-${parsed.length}-${i}`,
        date: dateStr,
        time: timeStr,
        sender: sender.trim(),
        content: msgContent.replace("<This message was edited>", "").trim()
      };
    } else {
      if (currentMsg) {
        currentMsg.content += "\n" + line.trim();
      }
    }
  }

  if (currentMsg) {
    parsed.push(currentMsg);
  }

  // Filter valid senders
  return parsed.filter(m => {
    const senderLower = m.sender.toLowerCase();
    return senderLower.includes("sanjay") || senderLower.includes("divya");
  });
}

const msgs = parseChatFile();
console.log("Parsed messages count:", msgs.length);
if (msgs.length > 0) {
  console.log("First message:", msgs[0]);
}
