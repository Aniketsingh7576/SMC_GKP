import { mkdir, unlink, writeFile, readFile } from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { put as blobPut, del as blobDel, get as blobGet } from "@vercel/blob";

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

// Vercel Blob adapter (Private store). Files are stored at their deterministic key and
// require the token to read, so nothing is publicly accessible. Content is served only
// through the app's authorized routes.
class VercelBlobAdapter implements StorageAdapter {
  private token = process.env.BLOB_READ_WRITE_TOKEN;
  async save(key: string, data: Buffer) {
    await blobPut(key, data, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: this.token
    });
    return `/api/uploads/${key}`;
  }
  async remove(key: string) { try { await blobDel(key, { token: this.token }); } catch {} }
  async read(key: string) {
    const result = await blobGet(key, { access: "private", token: this.token });
    if (!result?.stream) throw new Error("File not found");
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }
}

// Pick the adapter by what's configured. On Vercel: set BLOB_READ_WRITE_TOKEN (Vercel Blob)
// or S3_* (Cloudflare R2 / S3). Locally it falls back to disk.
export const storage: StorageAdapter =
  process.env.S3_BUCKET && process.env.S3_ENDPOINT
    ? new S3StorageAdapter()
    : process.env.BLOB_READ_WRITE_TOKEN
      ? new VercelBlobAdapter()
      : new LocalStorageAdapter();

export function safeStorageKey(key: string) {
  const clean = key.replaceAll("\\", "/").replace(/^\/+/, "");
  if (clean.includes("..")) throw new Error("Invalid storage path");
  return clean;
}
