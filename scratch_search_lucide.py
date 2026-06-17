with open("node_modules/lucide-react/dist/esm/lucide-react.mjs", "r", encoding="utf-8") as f:
    content = f.read()

import re
print("Github matches:")
for m in re.findall(r'export\s+.*?(?:github).*?;', content, re.IGNORECASE):
    print(m)
print("Linkedin matches:")
for m in re.findall(r'export\s+.*?(?:linkedin).*?;', content, re.IGNORECASE):
    print(m)
print("Twitter matches:")
for m in re.findall(r'export\s+.*?(?:twitter).*?;', content, re.IGNORECASE):
    print(m)
