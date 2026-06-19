import re
from datetime import datetime

report_path = r"c:\Users\Sanjay\Documents\memories\scratch\ocr_results.txt"
output_path = r"c:\Users\Sanjay\Documents\memories\scratch\sorted_dates.txt"

def main():
    results = []
    with open(report_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    entries = content.split("--------------------------------------------------")
    for entry in entries:
        lines = [line.strip() for line in entry.strip().split("\n") if line.strip()]
        if len(lines) >= 2:
            file_match = re.search(r"File:\s*(.*)", lines[0])
            date_match = re.search(r"Date:\s*(.*)", lines[1])
            if file_match and date_match:
                filename = file_match.group(1).strip()
                date_str = date_match.group(1).strip()
                if date_str != "Unknown":
                    results.append((filename, date_str))
                    
    # Parse date and sort
    sorted_results = sorted(
        results,
        key=lambda x: datetime.strptime(x[1], "%d/%m/%Y")
    )
    
    # Print to console
    print("Chronological Ascending Order of Matched Dates:")
    print("==============================================")
    for idx, (filename, date_str) in enumerate(sorted_results, 1):
        print(f"{idx}. {date_str} - {filename}")
        
    # Write to file
    with open(output_path, "w", encoding="utf-8") as out:
        out.write("Chronological Ascending Order of Matched Dates\n")
        out.write("==============================================\n\n")
        for idx, (filename, date_str) in enumerate(sorted_results, 1):
            out.write(f"{idx}. {date_str} - {filename}\n")
            
    print(f"\nSaved sorted list to {output_path}")

if __name__ == "__main__":
    main()
