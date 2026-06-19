import os
import re
from PIL import Image, ImageDraw, ImageFont

# Define emoji regex pattern
emoji_pattern = re.compile(
    r"([\U0001f600-\U0001f64f"
    r"\U0001f300-\U0001f5ff"
    r"\U0001f680-\U0001f6ff"
    r"\U0001f1e0-\U0001f1ff"
    r"\U00002700-\U000027bf"
    r"\U00002600-\U000026ff"
    r"\U0001f900-\U0001f9ff"
    r"\U0001fa00-\U0001faff"
    r"\U0001f000-\U0001f0ff"
    r"\U0001f200-\U0001f2ff"
    r"\U0001f700-\U0001f77f"
    r"\U0001f780-\U0001f7ff"
    r"\U0001f800-\U0001f8ff"
    r"\U0001f900-\U0001f9ff"
    r"\U0001fa00-\U0001faff"
    r"\U00002000-\U00002bff"  # symbols
    r"\U00002c00-\U00002dff"
    r"\U00002e00-\U00002eff"
    r"\u200d"                 # Zero-width joiner
    r"\ufe0f"                 # Variant selector
    r"]+)"
)

def split_text_emojis(text):
    # Splits text into parts of (is_emoji, part_text)
    tokens = emoji_pattern.split(text)
    result = []
    for token in tokens:
        if not token:
            continue
        # Check if the token matches the emoji pattern
        is_emoji = bool(emoji_pattern.match(token))
        result.append((is_emoji, token))
    return result

def main():
    img = Image.new("RGB", (600, 150), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    font_text = ImageFont.truetype("C:\\Windows\\Fonts\\segoeui.ttf", 30)
    font_emoji = ImageFont.truetype("C:\\Windows\\Fonts\\seguiemj.ttf", 30)
    
    test_strings = [
        "Hello Sanjay 🩶 😊 how are you?",
        "Divya dYc (LP) 🩶 🫣",
        "Happy Birthday 🎂🎉!"
    ]
    
    y = 10
    for s in test_strings:
        parts = split_text_emojis(s)
        x = 10
        for is_emoji, part in parts:
            font = font_emoji if is_emoji else font_text
            # Draw text
            draw.text((x, y), part, font=font, fill=(0, 0, 0), anchor="lt")
            # Calculate width to advance x
            bbox = draw.textbbox((0, 0), part, font=font)
            part_w = bbox[2] - bbox[0]
            # Add small adjustment for emoji spacing if needed
            x += part_w
        y += 45
        
    img.save("c:\\Users\\Sanjay\\Documents\\memories\\scratch\\test_hybrid_emoji.png")
    print("Saved test_hybrid_emoji.png")

if __name__ == "__main__":
    main()
