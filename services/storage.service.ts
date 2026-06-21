import { mkdir, unlink, writeFile, readFile } from "fs/promises";
import path from "path";

export interface StorageAdapter { save(key: string, data: Buffer): Promise<string>; remove(key: string): Promise<void>; read(key: string): Promise<Buffer> }
class LocalStorageAdapter implements StorageAdapter {
  private root = path.resolve(process.env.UPLOAD_DIR || "./public/uploads");
  async save(key: string, data: Buffer) { const target = path.join(this.root, key); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, data); return `/api/uploads/${key}`; }
  async remove(key: string) { try { await unlink(path.join(this.root, key)); } catch {} }
  async read(key: string) { return readFile(path.join(this.root, key)); }
}
export const storage: StorageAdapter = new LocalStorageAdapter();

export function safeStorageKey(key: string) {
  const clean = key.replaceAll("\\", "/").replace(/^\/+/, "");
  if (clean.includes("..")) throw new Error("Invalid storage path");
  return clean;
}
