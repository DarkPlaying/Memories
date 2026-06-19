import os
import re
import json
from PIL import Image, ImageDraw, ImageFont

chat_path = r"c:\Users\Sanjay\Documents\memories\WhatsApp Chat with Divya 🩶(LP).txt"
template_path = r"c:\Users\Sanjay\Documents\memories\Beige Minimalist Chat Message Instagram Story.png"
output_dir = r"c:\Users\Sanjay\Documents\memories\public\chats"

# Ensure output directory exists
os.makedirs(output_dir, exist_ok=True)

# Emoji detection pattern for splitting text
emoji_pattern = re.compile(
    r"("
    r"[\U0001f600-\U0001f64f]"  # Emoticons
    r"|[\U0001f300-\U0001f5ff]"  # Misc Symbols & Pictographs
    r"|[\U0001f680-\U0001f6ff]"  # Transport & Map
    r"|[\U0001f900-\U0001f9ff]"  # Supplemental Pictographs
    r"|[\U0001fa00-\U0001faff]"  # Symbols & Pictographs Extended-A
    r"|[\u2600-\u26ff]"          # Misc Symbols
    r"|[\u2700-\u27bf]"          # Dingbats
    r"|[\U0001f1e6-\U0001f1ff]"  # Flags (regional indicators)
    r"|[\u200d\ufe0f\u20e3]"      # Joiners & Selectors
    r"+)"
)

def split_text_emojis(text):
    tokens = emoji_pattern.split(text)
    result = []
    for token in tokens:
        if not token:
            continue
        is_emoji = bool(emoji_pattern.match(token))
        result.append((is_emoji, token))
    return result

def get_text_width(text, font_text, font_emoji, draw):
    parts = split_text_emojis(text)
    total_w = 0
    for is_emoji, part in parts:
        font = font_emoji if is_emoji else font_text
        bbox = draw.textbbox((0, 0), part, font=font)
        w = bbox[2] - bbox[0]
        total_w += w
    return total_w

def wrap_text_to_lines(text, font_text, font_emoji, max_width, draw):
    paragraphs = text.split("\n")
    all_lines = []
    for para in paragraphs:
        if not para:
            all_lines.append("")
            continue
        words = para.split(" ")
        current_line = []
        for word in words:
            if not word:
                continue
            
            word_w = get_text_width(word, font_text, font_emoji, draw)
            if word_w > max_width:
                if current_line:
                    all_lines.append(" ".join(current_line))
                    current_line = []
                
                temp_word = ""
                for char in word:
                    test_w = get_text_width(temp_word + char, font_text, font_emoji, draw)
                    if test_w <= max_width:
                        temp_word += char
                    else:
                        if temp_word:
                            all_lines.append(temp_word)
                        temp_word = char
                if temp_word:
                    current_line = [temp_word]
            else:
                test_line = " ".join(current_line + [word])
                width = get_text_width(test_line, font_text, font_emoji, draw)
                if width <= max_width:
                    current_line.append(word)
                else:
                    if current_line:
                        all_lines.append(" ".join(current_line))
                        current_line = [word]
                    else:
                        all_lines.append(word)
                        current_line = []
        if current_line:
            all_lines.append(" ".join(current_line))
    return all_lines

def parse_chat_log():
    pattern = re.compile(r"^(\d{2}/\d{2}/\d{4}), (\d{2}:\d{2}) - ([^:]+): (.*)$")
    messages = []
    with open(chat_path, "r", encoding="utf-8") as f:
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

def parse_ocr_results():
    report_path = r"c:\Users\Sanjay\Documents\memories\scratch\ocr_results.txt"
    if not os.path.exists(report_path):
        print(f"Warning: ocr_results.txt not found at {report_path}")
        return {}
    
    date_snippets = {}
    with open(report_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    blocks = content.split("--------------------------------------------------")
    for block in blocks:
        date_match = re.search(r"Date:\s*(\d{2}/\d{2}/\d{4})", block)
        snippets_match = re.search(r"Snippets \(sorted by length\):\s*(.*)", block)
        if date_match and snippets_match:
            date_str = date_match.group(1)
            snippets_str = snippets_match.group(1).strip()
            snippets = [s.strip() for s in snippets_str.split(" | ") if s.strip()]
            if date_str not in date_snippets:
                date_snippets[date_str] = []
            date_snippets[date_str].extend(snippets)
            
    return date_snippets

def get_words(text):
    ignore_words = {"message", "status", "online", "yesterday", "today", "tomorrow", "type", "photo", "reacted", "sticker", "omitted"}
    words = re.findall(r'\b\w{3,}\b', text.lower())
    return [w for w in words if w not in ignore_words]

def find_anchor_index(messages, snippets):
    if not snippets:
        return 0
    combined_snippets = " ".join(snippets)
    snippets_words_set = set(get_words(combined_snippets))
    if not snippets_words_set:
        return 0
        
    best_idx = 0
    best_score = -1.0
    for idx, msg in enumerate(messages):
        msg_words = get_words(msg["content"])
        if not msg_words:
            continue
        msg_words_set = set(msg_words)
        overlap = len(msg_words_set.intersection(snippets_words_set))
        if overlap > 0:
            score = (overlap * overlap) / len(msg_words)
            if score > best_score:
                best_score = score
                best_idx = idx
    return best_idx

def wrap_text_to_lines(text, font_text, font_emoji, max_width, draw):
    paragraphs = text.split("\n")
    all_lines = []
    for para in paragraphs:
        if not para:
            all_lines.append("")
            continue
        words = para.split(" ")
        current_line = []
        for word in words:
            if not word:
                continue
            
            word_w = get_text_width(word, font_text, font_emoji, draw)
            if word_w > max_width:
                if current_line:
                    all_lines.append(" ".join(current_line))
                    current_line = []
                
                temp_word = ""
                for char in word:
                    test_w = get_text_width(temp_word + char, font_text, font_emoji, draw)
                    if test_w <= max_width:
                        temp_word += char
                    else:
                        if temp_word:
                            all_lines.append(temp_word)
                        temp_word = char
                if temp_word:
                    current_line = [temp_word]
            else:
                test_line = " ".join(current_line + [word])
                width = get_text_width(test_line, font_text, font_emoji, draw)
                if width <= max_width:
                    current_line.append(word)
                else:
                    if current_line:
                        all_lines.append(" ".join(current_line))
                        current_line = [word]
                    else:
                        all_lines.append(word)
                        current_line = []
        if current_line:
            all_lines.append(" ".join(current_line))
    return all_lines

def select_message_window(messages, anchor_idx, font_text_path, font_emoji_path, dummy_draw):
    max_bubble_width = 720
    bubble_padding_x = 35
    bubble_padding_y = 20
    spacing = 30
    max_chat_height = 1360
    
    # Try offsets 3, 2, 1, 0 relative to anchor_idx to fit as many messages as possible
    for offset in [3, 2, 1, 0]:
        start_candidate = max(0, anchor_idx - offset)
        current_height = 0
        window = []
        idx = start_candidate
        
        while idx < len(messages):
            msg = messages[idx]
            sender_lower = msg["sender"].lower()
            if "sanjay" not in sender_lower and "divya" not in sender_lower:
                idx += 1
                continue
                
            content = msg["content"]
            content = content.replace("<This message was edited>", "")
            content = re.sub(r"[ \t]+", " ", content).strip()
            if not content:
                idx += 1
                continue
                
            msg_font_size = 36
            has_long_word = any(len(w) > 22 for w in content.split())
            if len(content) > 250:
                msg_font_size = 24
            elif len(content) > 120 or has_long_word:
                msg_font_size = 28
                
            msg_font_text = ImageFont.truetype(font_text_path, msg_font_size)
            msg_font_emoji = ImageFont.truetype(font_emoji_path, msg_font_size)
            
            try:
                ascent, descent = msg_font_text.getmetrics()
                msg_line_height = ascent + descent
            except:
                msg_line_height = msg_font_size + 8
                
            lines = wrap_text_to_lines(content, msg_font_text, msg_font_emoji, max_bubble_width - (bubble_padding_x * 2), dummy_draw)
            if not lines:
                idx += 1
                continue
                
            spacing_between_lines = 10
            total_text_height = (len(lines) * msg_line_height) + ((len(lines) - 1) * spacing_between_lines if len(lines) > 1 else 0)
            bubble_h = total_text_height + (bubble_padding_y * 2)
            
            if current_height + bubble_h + spacing > max_chat_height:
                break
                
            window.append({
                "sender": msg["sender"],
                "content": content,
                "bubble_h": bubble_h,
                "lines": lines,
                "font_size": msg_font_size,
                "line_height": msg_line_height
            })
            current_height += bubble_h + spacing
            idx += 1
            
        window_indices = list(range(start_candidate, idx))
        if anchor_idx in window_indices:
            return window
            
    # Fallback starting directly at anchor_idx
    current_height = 0
    window = []
    idx = anchor_idx
    while idx < len(messages):
        msg = messages[idx]
        sender_lower = msg["sender"].lower()
        if "sanjay" not in sender_lower and "divya" not in sender_lower:
            idx += 1
            continue
            
        content = msg["content"]
        content = content.replace("<This message was edited>", "")
        content = re.sub(r"[ \t]+", " ", content).strip()
        if not content:
            idx += 1
            continue
            
        msg_font_size = 36
        has_long_word = any(len(w) > 22 for w in content.split())
        if len(content) > 250:
            msg_font_size = 24
        elif len(content) > 120 or has_long_word:
            msg_font_size = 28
            
        msg_font_text = ImageFont.truetype(font_text_path, msg_font_size)
        msg_font_emoji = ImageFont.truetype(font_emoji_path, msg_font_size)
        
        try:
            ascent, descent = msg_font_text.getmetrics()
            msg_line_height = ascent + descent
        except:
            msg_line_height = msg_font_size + 8
            
        lines = wrap_text_to_lines(content, msg_font_text, msg_font_emoji, max_bubble_width - (bubble_padding_x * 2), dummy_draw)
        if not lines:
            idx += 1
            continue
            
        spacing_between_lines = 10
        total_text_height = (len(lines) * msg_line_height) + ((len(lines) - 1) * spacing_between_lines if len(lines) > 1 else 0)
        bubble_h = total_text_height + (bubble_padding_y * 2)
        
        if current_height + bubble_h + spacing > max_chat_height:
            break
            
        window.append({
            "sender": msg["sender"],
            "content": content,
            "bubble_h": bubble_h,
            "lines": lines,
            "font_size": msg_font_size,
            "line_height": msg_line_height
        })
        current_height += bubble_h + spacing
        idx += 1
    return window

def main():
    # 1. Clean output directory
    for f in os.listdir(output_dir):
        if f.startswith("chat_") and f.endswith(".png"):
            try:
                os.remove(os.path.join(output_dir, f))
            except Exception as e:
                print(f"Error removing {f}: {e}")
    print("Cleaned up old chat images in output directory.")

    # 2. Parse logs and OCR results
    print("Parsing WhatsApp chat log...")
    all_chat_messages = parse_chat_log()
    print(f"Loaded {len(all_chat_messages)} messages.")
    
    print("Parsing OCR results...")
    date_snippets = parse_ocr_results()
    
    # Load unique matched dates from sorted_dates.txt in ascending order
    unique_dates = []
    sorted_dates_path = r"c:\Users\Sanjay\Documents\memories\scratch\sorted_dates.txt"
    if os.path.exists(sorted_dates_path):
        with open(sorted_dates_path, "r", encoding="utf-8") as f:
            content = f.read()
        matches = re.findall(r"\d{2}/\d{2}/\d{4}", content)
        for m in matches:
            if m not in unique_dates:
                unique_dates.append(m)
    else:
        # Fallback to unique dates in date_snippets
        unique_dates = sorted(list(date_snippets.keys()), key=lambda x: [int(c) for c in x.split("/")][::-1])

    print(f"Generating chat images for {len(unique_dates)} unique matched dates:")
    print(unique_dates)

    # 3. Fonts Setup
    font_text_path = "C:\\Windows\\Fonts\\segoeui.ttf"
    if not os.path.exists(font_text_path):
        font_text_path = "C:\\Windows\\Fonts\\arial.ttf"
    font_emoji_path = "C:\\Windows\\Fonts\\seguiemj.ttf"
    if not os.path.exists(font_emoji_path):
        font_emoji_path = font_text_path

    dummy_img = Image.new("RGB", (100, 100))
    dummy_draw = ImageDraw.Draw(dummy_img)

    # Bubble styles
    left_bg = (252, 248, 245)      # FCF8F5
    left_border = (237, 230, 223)  # EDE6DF
    left_text = (64, 53, 47)       # 40352F
    right_bg = (176, 149, 129)     # B09581
    right_text = (255, 255, 255)   # FFFFFF
    
    bubble_padding_x = 35
    bubble_padding_y = 20
    spacing = 30

    for idx, date_str in enumerate(unique_dates):
        # Filter chat messages for this date
        date_msgs = [m for m in all_chat_messages if m["date"] == date_str]
        if not date_msgs:
            print(f"Skipping date {date_str}: No messages in log.")
            continue
            
        snippets = date_snippets.get(date_str, [])
        anchor_idx = find_anchor_index(date_msgs, snippets)
        
        # Select window around anchor
        snippet = select_message_window(date_msgs, anchor_idx, font_text_path, font_emoji_path, dummy_draw)
        if not snippet:
            print(f"Skipping date {date_str}: Failed to select message window.")
            continue
            
        # Draw on template
        img = Image.open(template_path)
        draw = ImageDraw.Draw(img)
        
        # Draw slide number in the top right corner
        slide_number = f"#{idx + 1:02d}"
        slide_font = ImageFont.truetype(font_text_path, 36)
        draw.text((1000, 140), slide_number, font=slide_font, fill=(176, 149, 129), anchor="rt")
        
        # Draw date in the top left corner
        date_font = ImageFont.truetype(font_text_path, 36)
        draw.text((80, 140), date_str, font=date_font, fill=(176, 149, 129), anchor="lt")
        
        current_y = 360 # Start Y coordinate
        
        for msg in snippet:
            sender = msg["sender"]
            lines = msg["lines"]
            bubble_h = msg["bubble_h"]
            msg_font_size = msg["font_size"]
            msg_line_height = msg["line_height"]
            
            font_text = ImageFont.truetype(font_text_path, msg_font_size)
            font_emoji = ImageFont.truetype(font_emoji_path, msg_font_size)
            
            is_right = "sanjay" in sender.lower()
            
            max_line_w = 0
            for line in lines:
                line_w = get_text_width(line, font_text, font_emoji, draw)
                if line_w > max_line_w:
                    max_line_w = line_w
                    
            bubble_w = max_line_w + (bubble_padding_x * 2)
            
            if is_right:
                r_x = 1000
                l_x = r_x - bubble_w
                bg_color = right_bg
                text_color = right_text
                border_color = None
            else:
                l_x = 80
                r_x = l_x + bubble_w
                bg_color = left_bg
                text_color = left_text
                border_color = left_border
                
            draw.rounded_rectangle(
                [l_x, current_y, r_x, current_y + bubble_h],
                radius=25,
                fill=bg_color,
                outline=border_color,
                width=1 if border_color else 0
            )
            
            ty = current_y + bubble_padding_y
            spacing_between_lines = 10
            for line in lines:
                tx = l_x + bubble_padding_x
                parts = split_text_emojis(line)
                cx = tx
                for is_emoji, part in parts:
                    f = font_emoji if is_emoji else font_text
                    draw.text((cx, ty), part, font=f, fill=text_color, anchor="lt")
                    bbox = draw.textbbox((0, 0), part, font=f)
                    cx += bbox[2] - bbox[0]
                ty += msg_line_height + spacing_between_lines
                
            current_y += bubble_h + spacing
            
        output_name = f"chat_{idx + 1}.png"
        output_path = os.path.join(output_dir, output_name)
        img.save(output_path, "PNG")
        print(f"Generated {output_name} for date {date_str} ({len(snippet)} messages)")

    print("Successfully completed batch chat image generation.")

if __name__ == "__main__":
    main()
