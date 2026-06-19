import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Global cache to avoid parsing the large file on every request
let cachedMessages: any[] = [];

function parseChatFile() {
  const filePath = path.join(process.cwd(), "WhatsApp Chat with Divya 🩶(LP).txt");
  if (!fs.existsSync(filePath)) {
    console.error("Chat file not found at:", filePath);
    return [];
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const parsed: any[] = [];
  const messagePattern = /^(\d{2}\/\d{2}\/\d{4}), (\d{2}:\d{2}) - ([^:]+): (.*)$/;

  let currentMsg: any = null;

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const startIndex = parseInt(searchParams.get("startIndex") || "-1", 10);
    const action = searchParams.get("action");

    if (cachedMessages.length === 0) {
      cachedMessages = parseChatFile();
    }

    if (action === "dates") {
      const dates: { date: string; index: number }[] = [];
      let lastDate = "";
      cachedMessages.forEach((m, idx) => {
        if (m.date !== lastDate) {
          dates.push({ date: m.date, index: idx });
          lastDate = m.date;
        }
      });
      return NextResponse.json({ dates });
    }

    const start = startIndex !== -1 ? startIndex : page * limit;
    const end = start + limit;
    const messages = cachedMessages.slice(start, end);

    return NextResponse.json({
      messages,
      hasMore: end < cachedMessages.length,
      total: cachedMessages.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
