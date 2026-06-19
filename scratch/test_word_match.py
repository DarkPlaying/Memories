import os
import re
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

chat_log_path = r"c:\Users\Sanjay\Documents\memories\WhatsApp Chat with Divya 🩶(LP).txt"
cache_path = r"c:\Users\Sanjay\Documents\memories\scratch\ocr_cache.json"

def parse_chat_log():
    pattern = re.compile(r"^(\d{2}/\d{2}/\d{4}), (\d{2}:\d{2}) - ([^:]+): (.*)$")
    messages = []
    with open(chat_log_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    current_msg = None
    for line in lines:
        line_str = line.strip()
        match = pattern.match(line_str)
        if match:
            if current_msg:
                messages.append(current_msg)
            date_str, time_str, sender, content = match.groups()
            current_msg = {
                "date": date_str,
                "time": time_str,
                "sender": sender.strip(),
                "content": content.strip()
            }
        else:
            if current_msg:
                current_msg["content"] += " " + line_str
    if current_msg:
        messages.append(current_msg)
    return messages

def clean_content(text):
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def get_words(text):
    ignore_words = {"message", "status", "online", "yesterday", "today", "tomorrow", "type", "photo", "reacted", "sticker", "omitted"}
    words = re.findall(r'\b\w{3,}\b', text.lower())
    return [w for w in words if w not in ignore_words]

def main():
    chat_messages = parse_chat_log()
    print(f"Loaded {len(chat_messages)} chat messages.")
    
    cleaned_chat_db = []
    for msg in chat_messages:
        content = clean_content(msg["content"])
        db_words = get_words(content)
        cleaned_chat_db.append({
            "date": msg["date"],
            "content": content,
            "words_set": set(db_words),
            "word_count": len(db_words)
        })
        
    with open(cache_path, "r", encoding="utf-8") as cf:
        ocr_cache = json.load(cf)
        
    time_split_pattern = re.compile(r"\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\b")
    
    results = []
    
    for filename, raw_text in ocr_cache.items():
        blocks = time_split_pattern.split(raw_text)
        
        ocr_lines = []
        for block in blocks:
            block = clean_content(block)
            if len(block) > 6:
                block_lower = block.lower()
                if block_lower in ["message", "status", "online", "type a message", "type a", "today", "yesterday"]:
                    continue
                block = re.sub(r"^[^\w]+|[^\w]+$", "", block)
                if len(block) > 6:
                    ocr_lines.append(block)
                        
        ocr_lines.sort(key=len, reverse=True)
        
        best_date = "Unknown"
        matched_snippet = ""
        best_msg_content = ""
        debug_info = ""
        
        # Try top 3 longest blocks for matching
        for ocr_line in ocr_lines[:3]:
            ocr_words = get_words(ocr_line)
            ocr_words_set = set(ocr_words)
            
            # Require at least 2 words to avoid single-word matches (like "W Pandran")
            if len(ocr_words) >= 2:
                best_score = 0.0
                best_msg = None
                
                # Minimum overlap matches required based on query length
                min_required = 2 if len(ocr_words) <= 3 else 3
                
                for db_msg in cleaned_chat_db:
                    overlap_count = len(db_msg["words_set"].intersection(ocr_words_set))
                    
                    if overlap_count >= min_required:
                        # Calculate penalized score
                        score = (overlap_count * overlap_count) / max(1, db_msg["word_count"])
                        
                        if score > best_score:
                            best_score = score
                            best_msg = db_msg
                            debug_info = f"overlap={overlap_count}, db_words={db_msg['word_count']}, score={score:.3f}"
                                
                if best_msg and best_score >= 0.35:
                    best_date = best_msg["date"]
                    best_msg_content = best_msg["content"]
                    matched_snippet = ocr_line
                    break
            
        log_line = f"File: {filename} -> Date: {best_date} ({debug_info}) (Snippet: '{matched_snippet[:30]}' -> Log: '{best_msg_content[:30]}')"
        print(log_line.encode('ascii', 'ignore').decode('ascii'))

if __name__ == "__main__":
    main()
