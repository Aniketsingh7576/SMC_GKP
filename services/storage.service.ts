import { mkdir, unlink, writeFile, readFile } from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export interface StorageAdapter { save(key: string, data: Buffer): Promise<string>; remove(key: string): Promise<void>; read(key: string): Promise<Buffer> }
class LocalStorageAdapter implements StorageAdapter {
  private root = path.resolve(process.env.UPLOAD_DIR || "./public/uploads");
  async save(key: string, data: Buffer) { const target = path.join(this.root, key); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, data); return `/api/uploads/${key}`; }
  async remove(key: string) { try { await unlink(path.join(this.root, key)); } catch {} }
  async read(key: string) { return readFile(path.join(this.root, key)); }
}

// S3-compatible adapter (Cloudflare R2, AWS S3, etc.). Objects stay private and are
// served through the app's authorized routes, never exposed via a public bucket URL.
class S3StorageAdapter implements StorageAdapter {
  private client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
    }
  });
  private bucket = process.env.S3_BUCKET!;
  async save(key: string, data: Buffer) {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: data }));
    return `/api/uploads/${key}`;
  }
  async remove(key: string) { try { await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })); } catch {} }
  async read(key: string) {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await res.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }
}

// Use S3/R2 when configured (e.g. on Vercel), fall back to local disk for development.
export const storage: StorageAdapter =
  process.env.S3_BUCKET && process.env.S3_ENDPOINT
    ? new S3StorageAdapter()
    : new LocalStorageAdapter();

export function safeStorageKey(key: string) {
  const clean = key.replaceAll("\\", "/").replace(/^\/+/, "");
  if (clean.includes("..")) throw new Error("Invalid storage path");
  return clean;
}
