import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

function parseChatFile() {
  const filePath = path.join(process.cwd(), "WhatsApp Chat with Divya 🩶(LP).txt");
  if (!fs.existsSync(filePath)) {
    console.error("Chat file not found at:", filePath);
    return;
  }

  const scratchDir = path.join(process.cwd(), "scratch");
  const cacheDir = process.env.VERCEL || process.env.NODE_ENV === "production" ? path.join(os.tmpdir(), "scratch") : scratchDir;
  const datesDir = path.join(cacheDir, "dates");
  const cachePath = path.join(cacheDir, "chat_cache.json");
  const datesListPath = path.join(cacheDir, "dates_list.json");

  // Create folders if not exists
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  if (!fs.existsSync(datesDir)) {
    fs.mkdirSync(datesDir, { recursive: true });
  }

  // Clear existing date JSON files to avoid stale data
  try {
    const existingFiles = fs.readdirSync(datesDir);
    for (const file of existingFiles) {
      if (file.endsWith(".json")) {
        fs.unlinkSync(path.join(datesDir, file));
      }
    }
  } catch (err) {
    console.error("Failed to clean dates directory:", err);
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

  // Re-index filtered messages
  filtered.forEach((m, idx) => {
    m.id = `msg-${idx}`;
  });

  // Save to JSON cache for legacy/python tools compatibility
  try {
    fs.writeFileSync(cachePath, JSON.stringify(filtered), "utf-8");
    console.log("Saved parsed chat to legacy JSON cache.");
  } catch (err) {
    console.error("Failed to write legacy JSON cache:", err);
  }

  // Group messages by date
  const groupedByDate: { [date: string]: any[] } = {};
  filtered.forEach(m => {
    if (!groupedByDate[m.date]) {
      groupedByDate[m.date] = [];
    }
    groupedByDate[m.date].push(m);
  });

  // Load matched dates from sorted_dates.txt
  const matchedDatesSet = new Set<string>();
  try {
    const sortedDatesPath = path.join(scratchDir, "sorted_dates.txt");
    if (fs.existsSync(sortedDatesPath)) {
      const txtContent = fs.readFileSync(sortedDatesPath, "utf-8");
      const matches = txtContent.match(/\d{2}\/\d{2}\/\d{4}/g);
      if (matches) {
        matches.forEach(d => matchedDatesSet.add(d));
      }
    }
  } catch (err) {
    console.error("Failed to read sorted_dates.txt:", err);
  }

  // Determine chronological order of dates in the filtered array
  const uniqueDatesOrder: string[] = [];
  const seenDates = new Set<string>();
  filtered.forEach(m => {
    if (!seenDates.has(m.date)) {
      seenDates.add(m.date);
      uniqueDatesOrder.push(m.date);
    }
  });

  // Write date JSONs and compile dates list
  const datesList: { date: string; index: number; count: number; isMatched: boolean }[] = [];
  let currentIndex = 0;

  uniqueDatesOrder.forEach(date => {
    const msgs = groupedByDate[date];
    const cleanDate = date.replace(/\//g, "-");
    const dateFilePath = path.join(datesDir, `${cleanDate}.json`);

    fs.writeFileSync(dateFilePath, JSON.stringify(msgs), "utf-8");

    datesList.push({
      date,
      index: currentIndex,
      count: msgs.length,
      isMatched: matchedDatesSet.has(date)
    });

    currentIndex += msgs.length;
  });

  // Save the dates list index
  try {
    fs.writeFileSync(datesListPath, JSON.stringify(datesList), "utf-8");
    console.log(`Saved dates list metadata (${datesList.length} dates).`);
  } catch (err) {
    console.error("Failed to write dates_list.json:", err);
  }
}

function ensureCacheInitialized() {
  const filePath = path.join(process.cwd(), "WhatsApp Chat with Divya 🩶(LP).txt");
  if (!fs.existsSync(filePath)) {
    return;
  }

  const cacheDir = process.env.VERCEL || process.env.NODE_ENV === "production" ? path.join(os.tmpdir(), "scratch") : path.join(process.cwd(), "scratch");
  const datesListPath = path.join(cacheDir, "dates_list.json");

  let cacheStale = true;
  if (fs.existsSync(datesListPath)) {
    const txtStats = fs.statSync(filePath);
    const cacheStats = fs.statSync(datesListPath);
    if (cacheStats.mtimeMs >= txtStats.mtimeMs) {
      cacheStale = false;
    }
  }

  if (cacheStale) {
    parseChatFile();
  }
}

export async function GET(request: Request) {
  try {
    ensureCacheInitialized();

    const { searchParams } = new URL(request.url);
    let page = parseInt(searchParams.get("page") || "0", 10);
    if (isNaN(page)) page = 0;
    let limit = parseInt(searchParams.get("limit") || "100", 10);
    if (isNaN(limit)) limit = 100;
    let startIndex = parseInt(searchParams.get("startIndex") || "-1", 10);
    if (isNaN(startIndex)) startIndex = -1;
    const action = searchParams.get("action");

    const cacheDir = process.env.VERCEL || process.env.NODE_ENV === "production" ? path.join(os.tmpdir(), "scratch") : path.join(process.cwd(), "scratch");
    const datesListPath = path.join(cacheDir, "dates_list.json");

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
      matchedDatesSet.forEach(date => {
        const cleanDate = date.replace(/\//g, "-");
        const dateFilePath = path.join(cacheDir, "dates", `${cleanDate}.json`);
        if (fs.existsSync(dateFilePath)) {
          try {
            previews[date] = JSON.parse(fs.readFileSync(dateFilePath, "utf-8"));
          } catch (e) {
            console.error(`Failed to parse file for date ${date}:`, e);
            previews[date] = [];
          }
        } else {
          previews[date] = [];
        }
      });

      return NextResponse.json({ previews });
    }

    if (action === "dates") {
      if (fs.existsSync(datesListPath)) {
        try {
          const datesList = JSON.parse(fs.readFileSync(datesListPath, "utf-8"));
          return NextResponse.json({ dates: datesList });
        } catch (err) {
          console.error("Failed to parse dates_list.json:", err);
        }
      }
      return NextResponse.json({ dates: [] });
    }

    // Default message range query
    let datesList: any[] = [];
    if (fs.existsSync(datesListPath)) {
      try {
        datesList = JSON.parse(fs.readFileSync(datesListPath, "utf-8"));
      } catch (err) {
        console.error("Failed to parse dates_list.json for pagination:", err);
      }
    }

    let totalMessages = 0;
    if (datesList.length > 0) {
      const lastDate = datesList[datesList.length - 1];
      totalMessages = lastDate.index + lastDate.count;
    }

    const start = startIndex !== -1 ? startIndex : page * limit;
    const end = start + limit;

    const messages: any[] = [];
    for (const dateInfo of datesList) {
      const dateStart = dateInfo.index;
      const dateEnd = dateInfo.index + dateInfo.count;
      
      // Check if this date intersects [start, end)
      if (Math.max(start, dateStart) < Math.min(end, dateEnd)) {
        const cleanDate = dateInfo.date.replace(/\//g, "-");
        const dateFilePath = path.join(cacheDir, "dates", `${cleanDate}.json`);
        if (fs.existsSync(dateFilePath)) {
          try {
            const msgs = JSON.parse(fs.readFileSync(dateFilePath, "utf-8"));
            const overlapStart = Math.max(start, dateStart);
            const overlapEnd = Math.min(end, dateEnd);
            const offsetInDate = overlapStart - dateStart;
            const countInDate = overlapEnd - overlapStart;
            messages.push(...msgs.slice(offsetInDate, offsetInDate + countInDate));
          } catch (e) {
            console.error(`Failed to parse file for date ${dateInfo.date}:`, e);
          }
        }
      }
    }

    return NextResponse.json({
      messages,
      hasMore: end < totalMessages,
      total: totalMessages
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
