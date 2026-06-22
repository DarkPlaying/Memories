import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), "public", "memories");
    let images: string[] = [];

    const scanDirectory = (dir: string, prefix = "") => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov"];

      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath, prefix ? `${prefix}/${file}` : file);
        } else {
          const ext = path.extname(file).toLowerCase();
          if (imageExtensions.includes(ext)) {
            images.push(prefix ? `${prefix}/${file}` : file);
          }
        }
      });
    };

    scanDirectory(baseDir);

    // Sort images to ensure 'First Bite' is absolutely last in all galleries
    images.sort((a, b) => {
      const aIsBite = a.toLowerCase().includes("first bite");
      const bIsBite = b.toLowerCase().includes("first bite");
      if (aIsBite && !bIsBite) return 1;
      if (!aIsBite && bIsBite) return -1;
      return a.localeCompare(b);
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error("API route error reading memories directory:", error);
    return NextResponse.json([]);
  }
}
