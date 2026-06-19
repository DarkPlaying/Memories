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

  const cacheDir = path.join(process.cwd(), "scratch");
  const cachePath = path.join(cacheDir, "chat_cache.json");

  // Create scratch folder if not exists
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const txtStats = fs.statSync(filePath);

  if (fs.existsSync(cachePath)) {
    const cacheStats = fs.statSync(cachePath);
    if (cacheStats.mtimeMs >= txtStats.mtimeMs) {
      try {
        console.log("Loading chat from fast JSON cache...");
        const cachedData = fs.readFileSync(cachePath, "utf-8");
        return JSON.parse(cachedData);
      } catch (err) {
        console.error("Failed to read JSON cache, parsing txt file instead:", err);
      }
    }
  }

  console.log("Parsing raw chat txt file (this may take several seconds)...");
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
        id: `msg-${parsed.length}`,
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
  const filtered = parsed.filter(m => {
    const senderLower = m.sender.toLowerCase();
    return senderLower.includes("sanjay") || senderLower.includes("divya");
  });

  // Save to JSON cache asynchronously
  try {
    fs.writeFileSync(cachePath, JSON.stringify(filtered), "utf-8");
    console.log("Saved parsed chat to fast JSON cache!");
  } catch (err) {
    console.error("Failed to write JSON cache:", err);
  }

  return filtered;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let page = parseInt(searchParams.get("page") || "0", 10);
    if (isNaN(page)) page = 0;
    let limit = parseInt(searchParams.get("limit") || "100", 10);
    if (isNaN(limit)) limit = 100;
    let startIndex = parseInt(searchParams.get("startIndex") || "-1", 10);
    if (isNaN(startIndex)) startIndex = -1;
    const action = searchParams.get("action");

    if (cachedMessages.length === 0) {
      cachedMessages = parseChatFile();
    }

    if (action === "previews") {
      const datesParam = searchParams.get("dates");
      const matchedDatesSet = new Set<string>();
      
      if (datesParam) {
        datesParam.split(",").forEach(d => {
          const trimmed = d.trim();
          if (trimmed) matchedDatesSet.add(trimmed);
        });
      } else {
        try {
          const sortedDatesPath = path.join(process.cwd(), "scratch", "sorted_dates.txt");
          if (fs.existsSync(sortedDatesPath)) {
            const content = fs.readFileSync(sortedDatesPath, "utf-8");
            const matches = content.match(/\d{2}\/\d{2}\/\d{4}/g);
            if (matches) {
              matches.forEach(d => matchedDatesSet.add(d));
            }
          }
        } catch (err) {
          console.error("Failed to read sorted_dates.txt:", err);
        }
      }

      const previews: { [date: string]: any[] } = {};
      const seenDates = new Set<string>();

      for (let i = 0; i < cachedMessages.length; i++) {
        const msg = cachedMessages[i];
        if (matchedDatesSet.has(msg.date)) {
          if (!seenDates.has(msg.date)) {
            seenDates.add(msg.date);
            
            const dateMsgs = [];
            for (let j = i; j < cachedMessages.length; j++) {
              if (cachedMessages[j].date === msg.date) {
                dateMsgs.push(cachedMessages[j]);
              } else {
                break;
              }
            }
            previews[msg.date] = dateMsgs;
          }
        }
      }
      return NextResponse.json({ previews });
    }

    if (action === "dates") {
      const dates: { date: string; index: number; isMatched: boolean }[] = [];
      const seenDates = new Set<string>();
      
      // Load matched dates from sorted_dates.txt
      const matchedDatesSet = new Set<string>();
      try {
        const sortedDatesPath = path.join(process.cwd(), "scratch", "sorted_dates.txt");
        if (fs.existsSync(sortedDatesPath)) {
          const content = fs.readFileSync(sortedDatesPath, "utf-8");
          const matches = content.match(/\d{2}\/\d{2}\/\d{4}/g);
          if (matches) {
            matches.forEach(d => matchedDatesSet.add(d));
          }
        }
      } catch (err) {
        console.error("Failed to read sorted_dates.txt:", err);
      }

      cachedMessages.forEach((m, idx) => {
        if (!seenDates.has(m.date)) {
          seenDates.add(m.date);
          dates.push({
            date: m.date,
            index: idx,
            isMatched: matchedDatesSet.has(m.date)
          });
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
