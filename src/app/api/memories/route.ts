import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), "public", "memories");
    let images: string[] = [];
    const seenSizes = new Set<number>();
    const seenNames = new Set<string>();

    const scanDirectory = (dir: string, prefix = "") => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath, prefix ? `${prefix}/${file}` : file);
        } else {
          const ext = path.extname(file).toLowerCase();
          if (imageExtensions.includes(ext)) {
            const cleanName = file.replace(/\s*\(\d+\)/g, "").toLowerCase();
            // Deduplicate based on both file size and clean filename to filter out all copies
            if (!seenSizes.has(stat.size) && !seenNames.has(cleanName)) {
              seenSizes.add(stat.size);
              seenNames.add(cleanName);
              images.push(prefix ? `${prefix}/${file}` : file);
            }
          }
        }
      });
    };

    scanDirectory(baseDir);
    return NextResponse.json(images);
  } catch (error) {
    console.error("API route error reading memories directory:", error);
    return NextResponse.json([]);
  }
}
