import os
from PIL import Image
from PIL.ExifTags import TAGS

folder = r"c:\Users\Sanjay\Documents\memories\public\chat"
files = [f for f in os.listdir(folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

for file_name in files[:5]:
    file_path = os.path.join(folder, file_name)
    print(f"File: {file_name}")
    try:
        img = Image.open(file_path)
        info = img._getexif()
        if info:
            for tag, value in info.items():
                decoded = TAGS.get(tag, tag)
                print(f"  {decoded}: {value}")
        else:
            print("  No EXIF data found")
    except Exception as e:
        print(f"  Error: {e}")
