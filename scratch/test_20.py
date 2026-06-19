import os
import sys

sys.path.append(r"C:\Users\Sanjay\.gemini\antigravity-ide\brain\8b78410e-2b5e-4370-9d28-e7cd652fb752\scratch")
import generate_chat_images

def main():
    d = r"c:\Users\Sanjay\Documents\memories\public\chats"
    print("Files before:", sorted(os.listdir(d)))
    print("Generating images...")
    generate_chat_images.generate_images()
    print("Files after:", sorted(os.listdir(d)))

if __name__ == "__main__":
    main()
