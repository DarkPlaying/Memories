import os
from PIL import Image

def main():
    p = r"c:\Users\Sanjay\Documents\memories\public\chats\chat_6.png"
    print("Writing to:", p)
    img = Image.new("RGB", (100, 100), (255, 0, 0))
    img.save(p, "PNG")
    print("Saved.")
    print("Exists:", os.path.exists(p))

if __name__ == "__main__":
    main()
