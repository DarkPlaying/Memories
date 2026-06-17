import re

with open("src/app/mailing/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    # Find all JSX opening and closing tags in the line
    # Simple regex for matching tags
    tags = re.findall(r'<([a-zA-Z0-9]+)(?:\s+[^>]*?)?>|</([a-zA-Z0-9]+)>|<>\s*|</>', line)
    # Let's print lines with tags to trace them
    for t in tags:
        # t is a tuple: (opening_tag_name, closing_tag_name)
        # If tag is <> or </>, t will be empty strings or match '<>' or '</>'
        if '<>' in line:
            stack.append(("<>", i+1))
        elif '</>' in line:
            if stack:
                stack.pop()
            else:
                print(f"Mismatched </ > at line {i+1}")
        elif t[0]:  # Opening tag
            # Skip self-closing tags
            if not line.strip().endswith("/>") and not re.search(rf'<{t[0]}.*?/>', line):
                stack.append((t[0], i+1))
        elif t[1]:  # Closing tag
            if stack:
                top, line_num = stack.pop()
                if top != t[1]:
                    print(f"Mismatched closing tag </{t[1]}> at line {i+1}, expected </{top}> (opened at line {line_num})")
            else:
                print(f"Mismatched closing tag </{t[1]}> at line {i+1} (stack empty)")
