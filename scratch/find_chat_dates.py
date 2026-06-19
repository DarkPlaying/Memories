import os
import re
import json
import subprocess

ocr_path = r"c:\Users\Sanjay\Documents\memories\scratch\ocr.exe"
chat_log_path = r"c:\Users\Sanjay\Documents\memories\WhatsApp Chat with Divya 🩶(LP).txt"
images_dir = r"c:\Users\Sanjay\Documents\memories\public\chat"

# Parse the chat log into a list of messages
def parse_chat_log():
    # Format: dd/mm/yyyy, hh:mm - Sender: Content
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

# Run OCR on a single image file
def ocr_image(image_path):
    try:
        res = subprocess.run([ocr_path, image_path], capture_output=True, text=True, encoding="utf-8", errors="ignore", timeout=10)
        return res.stdout.strip()
    except Exception as e:
        print(f"Error running OCR on {os.path.basename(image_path)}: {e}")
        return ""

def clean_content(text):
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def get_words(text):
    # Extract lowercase alphanumeric words of length >= 3
    ignore_words = {"message", "status", "online", "yesterday", "today", "tomorrow", "type", "photo", "reacted", "sticker", "omitted"}
    words = re.findall(r'\b\w{3,}\b', text.lower())
    return [w for w in words if w not in ignore_words]

def main():
    print("Parsing WhatsApp chat log...")
    chat_messages = parse_chat_log()
    print(f"Loaded {len(chat_messages)} messages from log file.")
    
    # Pre-process all chat messages for fast lookup
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
    
    # Get all image files in the chat directory
    image_files = [f for f in os.listdir(images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    # Sort files naturally by name
    image_files.sort(key=lambda x: [int(c) if c.isdigit() else c for c in re.split(r'(\d+)', x)])
    
    print(f"Found {len(image_files)} image files in {images_dir}.")
    
    # Load OCR cache if available
    cache_path = r"c:\Users\Sanjay\Documents\memories\scratch\ocr_cache.json"
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as cf:
                ocr_cache = json.load(cf)
            print(f"Loaded {len(ocr_cache)} cached OCR results.")
        except Exception as e:
            print(f"Failed to load cache: {e}")
            ocr_cache = {}
    else:
        ocr_cache = {}
        
    time_split_pattern = re.compile(r"\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\b")
    results = []
    cache_updated = False
    
    for idx, filename in enumerate(image_files):
        img_path = os.path.join(images_dir, filename)
        
        # Read from cache or run OCR
        if filename in ocr_cache:
            raw_text = ocr_cache[filename]
        else:
            print(f"[{idx+1}/{len(image_files)}] OCR on {filename}...", end="", flush=True)
            raw_text = ocr_image(img_path)
            ocr_cache[filename] = raw_text
            cache_updated = True
            print(" done.", end="", flush=True)
            
        # Split OCR text by timestamps to isolate message blocks
        blocks = time_split_pattern.split(raw_text)
        
        ocr_lines = []
        for block in blocks:
            block = clean_content(block)
            if len(block) > 6:
                block_lower = block.lower()
                # Filter out pure system UI lines and Meta notices
                if block_lower in ["message", "status", "online", "type a message", "type a", "today", "yesterday"]:
                    continue
                if any(phrase in block_lower for phrase in ["secure service", "from meta", "to manage this chat", "business account", "track your order", "chat with us"]):
                    continue
                
                # Strip typical start/end OCR noise
                block = re.sub(r"^[^\w]+|[^\w]+$", "", block)
                if len(block) > 6:
                    ocr_lines.append(block)
                    
        # Sort candidate OCR lines by length in descending order
        ocr_lines.sort(key=len, reverse=True)
        
        best_date = "Unknown"
        matched_snippet = ""
        best_msg_content = ""
        
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
                    # Fast set intersection check before sequence search
                    overlap_count = len(db_msg["words_set"].intersection(ocr_words_set))
                    
                    if overlap_count >= min_required:
                        # Calculate penalized score to prevent random matches in long messages
                        score = (overlap_count * overlap_count) / max(1, db_msg["word_count"])
                        
                        if score > best_score:
                            best_score = score
                            best_msg = db_msg
                                
                if best_msg and best_score >= 0.35:
                    best_date = best_msg["date"]
                    best_msg_content = best_msg["content"]
                    matched_snippet = ocr_line
                    break
                    
        log_line = f"[{idx+1}/{len(image_files)}] matched {filename} -> {best_date} (Snippet: '{matched_snippet[:30]}' -> Log: '{best_msg_content[:30]}')"
        print(log_line.encode('ascii', 'ignore').decode('ascii'))
        
        results.append({
            "filename": filename,
            "date": best_date,
            "text_snippet": " | ".join(ocr_lines[:3])
        })
        
    # Save cache if updated
    if cache_updated:
        try:
            with open(cache_path, "w", encoding="utf-8") as cf:
                json.dump(ocr_cache, cf, ensure_ascii=False, indent=2)
            print("OCR Cache saved.")
        except Exception as e:
            print(f"Failed to save cache: {e}")
            
    # Write output report
    report_path = r"c:\Users\Sanjay\Documents\memories\scratch\ocr_results.txt"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("WhatsApp Chat Images - Longest Text Date Match Report\n")
        f.write("===================================================\n\n")
        for res in results:
            f.write(f"File: {res['filename']}\n")
            f.write(f"Date: {res['date']}\n")
            f.write(f"Snippets (sorted by length): {res['text_snippet']}\n")
            f.write("-" * 50 + "\n")
            
    print(f"\nCompleted! Results written to {report_path}")

if __name__ == "__main__":
    main()
