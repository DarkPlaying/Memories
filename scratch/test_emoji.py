import os
from PIL import Image, ImageDraw, ImageFont

def main():
    img = Image.new("RGB", (400, 100), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Try Segoe UI Emoji
    emoji_font_path = "C:\\Windows\\Fonts\\seguiemj.ttf"
    if os.path.exists(emoji_font_path):
        try:
            font = ImageFont.truetype(emoji_font_path, 24)
            # Draw a message with emoji
            draw.text((10, 10), "Hello Sanjay 🩶 😊", font=font, fill=(0, 0, 0))
            print("Successfully rendered text with Segoe UI Emoji")
        except Exception as e:
            print("Error loading/drawing with Segoe UI Emoji:", e)
    else:
        print("Segoe UI Emoji font not found")
        
    img.save("c:\\Users\\Sanjay\\Documents\\memories\\scratch\\test_emoji.png")
    print("Saved test_emoji.png")

if __name__ == "__main__":
    main()
