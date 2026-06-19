import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

from test_word_match import parse_chat_log, get_words, get_matching_words_in_order

chat = parse_chat_log()
cache = json.load(open(r"c:\Users\Sanjay\Documents\memories\scratch\ocr_cache.json", encoding="utf-8"))
ocr_text = cache.get("WhatsApp Image 2026-06-19 at 13.18.12.jpeg")

# Split OCR text by timestamps to isolate message blocks
time_split_pattern = re.compile(r"\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\b")
blocks = time_split_pattern.split(ocr_text)
ocr_lines = []
for block in blocks:
    block = block.strip()
    if len(block) > 6:
        block = re.sub(r"^[^\w]+|[^\w]+$", "", block)
        if len(block) > 6:
            ocr_lines.append(block)
            
ocr_lines.sort(key=len, reverse=True)
longest_line = ocr_lines[0]
ocr_words = get_words(longest_line)

print(f"Longest line length: {len(longest_line)}")
print(f"OCR words count: {len(ocr_words)}")
print(f"First 10 words: {ocr_words[:10]}")

print("\nCandidate messages on 15/02/2026:")
for idx, msg in enumerate(chat):
    if msg["date"] == "15/02/2026":
        db_words = get_words(msg["content"])
        matched = get_matching_words_in_order(ocr_words, msg["content"].lower())
        overlap = len(matched)
        score = (overlap * overlap) / max(1, len(db_words))
        print(f"Msg {idx}: {msg['content'][:60]}... -> overlap={overlap}, db_words={len(db_words)}, score={score:.3f}")

print("\nCandidate messages on 23/10/2025:")
for idx, msg in enumerate(chat):
    if msg["date"] == "23/10/2025" and "food" in msg["content"].lower():
        db_words = get_words(msg["content"])
        matched = get_matching_words_in_order(ocr_words, msg["content"].lower())
        overlap = len(matched)
        score = (overlap * overlap) / max(1, len(db_words))
        print(f"Msg {idx}: {msg['content'][:60]}... -> overlap={overlap}, db_words={len(db_words)}, score={score:.3f}")
