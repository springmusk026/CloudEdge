// KV Cache Layer — read/write/invalidate utilities
// Ref: https://developers.cloudflare.com/kv/

export interface CacheOptions {
  ttl?: number; // seconds
  tags?: string[]; // for tag-based invalidation
}

export class KVCache {
  constructor(private kv: KVNamespace) {}

  async get<T = string>(key: string): Promise<T | null> {
    const val = await this.kv.get(key);
    if (!val) return null;
    try { return JSON.parse(val) as T; } catch { return val as unknown as T; }
  }

  async set(key: string, value: unknown, opts?: CacheOptions): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.kv.put(key, serialized, opts?.ttl ? { expirationTtl: opts.ttl } : undefined);

    // Store tag associations for invalidation
    if (opts?.tags) {
      for (const tag of opts.tags) {
        const existing = await this.kv.get(`_tag:${tag}`);
        const keys: string[] = existing ? JSON.parse(existing) : [];
        if (!keys.includes(key)) {
          keys.push(key);
          await this.kv.put(`_tag:${tag}`, JSON.stringify(keys), { expirationTtl: (opts.ttl || 3600) * 2 });
        }
      }
    }
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  async invalidateByTag(tag: string): Promise<number> {
    const keysJson = await this.kv.get(`_tag:${tag}`);
    if (!keysJson) return 0;
    const keys: string[] = JSON.parse(keysJson);
    await Promise.all(keys.map(k => this.kv.delete(k)));
    await this.kv.delete(`_tag:${tag}`);
    return keys.length;
  }

  async invalidatePrefix(prefix: string): Promise<number> {
    const list = await this.kv.list({ prefix });
    await Promise.all(list.keys.map(k => this.kv.delete(k.name)));
    return list.keys.length;
  }
}

// ─── R2 Presigned Upload Flow ───
// Ref: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
// Uses AWS Signature V4 for generating presigned PUT URLs

export async function generatePresignedUploadUrl(opts: {
  bucket: string;
  key: string;
  contentType: string;
  expiresIn: number; // seconds
  accessKeyId: string;
  secretAccessKey: string;
  accountId?: string;
}): Promise<string> {
  const { bucket, key, contentType, expiresIn, accessKeyId, secretAccessKey } = opts;
  const region = 'auto';
  const service = 's3';
  const host = `${bucket}.r2.cloudflarestorage.com`;
  const now = new Date();
  const datestamp = now.toISOString().replace(/[-:]/g, '').slice(0, 8);
  const amzdate = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const credential = `${accessKeyId}/${datestamp}/${region}/${service}/aws4_request`;

  const params = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzdate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': 'content-type;host',
  });

  const canonicalRequest = [
    'PUT',
    `/${key}`,
    params.toString(),
    `content-type:${contentType}\nhost:${host}\n`,
    'content-type;host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzdate,
    `${datestamp}/${region}/${service}/aws4_request`,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = await getSignatureKey(secretAccessKey, datestamp, region, service);
  const signature = await hmacHex(signingKey, stringToSign);

  params.set('X-Amz-Signature', signature);
  return `https://${host}/${key}?${params.toString()}`;
}

async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}

async function hmacHex(key: ArrayBuffer, data: string): Promise<string> {
  const sig = await hmac(key, data);
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSignatureKey(secretKey: string, datestamp: string, region: string, service: string): Promise<ArrayBuffer> {
  let key = await hmac(new TextEncoder().encode(`AWS4${secretKey}`).buffer as ArrayBuffer, datestamp);
  key = await hmac(key, region);
  key = await hmac(key, service);
  key = await hmac(key, 'aws4_request');
  return key;
}

// ─── Site Config Cache Helper ───
export class SiteConfig {
  constructor(private kv: KVNamespace, private db: D1Database) {}

  async get(key: string): Promise<any> {
    // Check KV first
    const cached = await this.kv.get(`cfg:${key}`);
    if (cached) return JSON.parse(cached);

    // Fallback to D1
    const row = await this.db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
    if (row) {
      const value = JSON.parse(row.value);
      await this.kv.put(`cfg:${key}`, row.value, { expirationTtl: 300 });
      return value;
    }
    return null;
  }

  async getAll(): Promise<Record<string, any>> {
    const cached = await this.kv.get('cfg:_all');
    if (cached) return JSON.parse(cached);

    const rows = await this.db.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>();
    const result = Object.fromEntries((rows.results || []).map(r => [r.key, JSON.parse(r.value)]));
    await this.kv.put('cfg:_all', JSON.stringify(result), { expirationTtl: 300 });
    return result;
  }

  async invalidate(key?: string): Promise<void> {
    if (key) await this.kv.delete(`cfg:${key}`);
    await this.kv.delete('cfg:_all');
  }
}
