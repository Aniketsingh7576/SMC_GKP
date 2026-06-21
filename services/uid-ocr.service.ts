import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { isValidReportUID, normalizeReportUID } from "@/lib/report-uid";

const run = promisify(execFile);

export async function extractUIDFromPDF(pdf: Buffer) {
  const directory = await mkdtemp(path.join(tmpdir(), "medvault-ocr-"));
  const pdfPath = path.join(directory, "report.pdf");
  const imagePrefix = path.join(directory, "page");
  const imagePath = `${imagePrefix}.png`;

  try {
    await writeFile(pdfPath, pdf);
    await run("pdftoppm", [
      "-f", "1",
      "-l", "1",
      "-singlefile",
      "-png",
      "-r", "200",
      pdfPath,
      imagePrefix
    ], { timeout: 30_000, maxBuffer: 5 * 1024 * 1024 });
    const { stdout } = await run("tesseract", [
      imagePath,
      "stdout",
      "-l", "eng",
      "--psm", "6"
    ], { timeout: 45_000, maxBuffer: 10 * 1024 * 1024 });

    const match = stdout.match(/\bUID\s*[:\-]?\s*([A-Z0-9][A-Z0-9-]{5,39})/i);
    if (!match) return null;
    const uid = normalizeReportUID(match[1]);
    return isValidReportUID(uid) ? uid : null;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
