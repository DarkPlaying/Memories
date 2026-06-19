import os
import sys

# Add scratch path to import generate_chat_images
sys.path.append(r"C:\Users\Sanjay\.gemini\antigravity-ide\brain\8b78410e-2b5e-4370-9d28-e7cd652fb752\scratch")

import generate_chat_images

def main():
    p = r"c:\Users\Sanjay\Documents\memories\public\chats\chat_6.png"
    if os.path.exists(p):
        os.remove(p)
        print("Deleted old chat_6.png before run")
    
    print("Running generate_images()...")
    generate_chat_images.generate_images()
    
    print("After run:")
    print("chat_6.png exists:", os.path.exists(p))
    if os.path.exists(p):
        print("chat_6.png size:", os.path.getsize(p))

if __name__ == "__main__":
    main()
