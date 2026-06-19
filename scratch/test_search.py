import sys

# Set standard output encoding to utf-8
sys.stdout.reconfigure(encoding='utf-8')

chat_log_path = r"c:\Users\Sanjay\Documents\memories\WhatsApp Chat with Divya 🩶(LP).txt"

def search_phrase(phrase):
    print(f"Searching for phrase: '{phrase}'")
    count = 0
    phrase_clean = phrase.lower().strip()
    with open(chat_log_path, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            if phrase_clean in line.lower():
                print(f"L{line_num}: {line.strip()}")
                count += 1
                if count >= 5:
                    break
    print(f"Total matches found: {count}\n")

# Let's search for some of the snippets that were "Unknown"
search_phrase("juices are not available")
search_phrase("summa vachan")
search_phrase("Athuku Nathan kakavanu")
search_phrase("Onu varala Ena Achi")
search_phrase("Ena ethu la nanum irukala")
search_phrase("Nee tha na promise start")
search_phrase("Na uga health ku sonna")
search_phrase("Seri ugaluku atha feel")
search_phrase("Full la send")
search_phrase("Diwali dress oda")
search_phrase("remye Akko")
search_phrase("Track Your Order")
search_phrase("My dream and love one")
