import { readFile, stat } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

/* ─────────────────────────────────────────────────────────
   Serves Executive uploads ONLY, from UPLOAD_DIR_EXECUTIVE.

   Route:     /api/files/executive/<token>/<category>/<filename>
   Distress:  /api/files/distress/<token>/<category>/<filename>
   FormB:     /api/files/<token>/<category>/<filename>

   No collisions: FormB's route matches exactly three segments after
   /api/files, these match four (a literal prefix plus three), and Next
   prefers the static segment.
───────────────────────────────────────────────────────── */

const UPLOAD_DIR = process.env.UPLOAD_DIR_EXECUTIVE || "./uploads-executive";

const MIME_MAP = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  txt: "text/plain",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(request, { params }) {
  try {
    const { token, category, filename } = await params;
    const safeToken = decodeURIComponent(token);
    const safeCategory = decodeURIComponent(category);
    const safeFilename = decodeURIComponent(filename);

    const isUnsafe = (s) => s.includes("..") || s.includes("/") || s.includes("\\");
    if (isUnsafe(safeToken) || isUnsafe(safeCategory) || isUnsafe(safeFilename)) {
      return new Response("Invalid path", { status: 400 });
    }

    const filePath = path.join(UPLOAD_DIR, safeToken, safeCategory, safeFilename);

    try {
      await stat(filePath);
    } catch {
      return new Response("File not found", { status: 404 });
    }

    const buffer = await readFile(filePath);
    const ext = safeFilename.split(".").pop()?.toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeFilename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    console.error("Executive file fetch error:", err);
    return new Response("Server error", { status: 500 });
  }
}