import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Buffer } from 'node:buffer';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secretKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be configured on the server.');
  }

  client = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export default getSupabase;

const CERTIFICATES_BUCKET = process.env.SUPABASE_CERTIFICATES_BUCKET?.trim() || 'donor-certificates';

export async function uploadCertificate(objectPath: string, file: Buffer, contentType: string, upsert = false): Promise<string> {
  const { data, error } = await getSupabase().storage.from(CERTIFICATES_BUCKET).upload(objectPath, file, {
    contentType,
    cacheControl: '0',
    upsert,
  });
  if (error) throw new Error(`Certificate upload failed: ${error.message}`);
  return data.path;
}

export async function downloadCertificate(objectPath: string): Promise<Buffer> {
  const { data, error } = await getSupabase().storage.from(CERTIFICATES_BUCKET).download(objectPath);
  if (error || !data) throw new Error(`Certificate download failed: ${error?.message || 'file not found'}`);
  return Buffer.from(await data.arrayBuffer());
}

export async function createCertificateSignedUrl(objectPath: string, expiresInSeconds = 3600): Promise<string | null> {
  const { data, error } = await getSupabase().storage.from(CERTIFICATES_BUCKET).createSignedUrl(objectPath, expiresInSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function deleteCertificate(objectPath: string): Promise<void> {
  const { error } = await getSupabase().storage.from(CERTIFICATES_BUCKET).remove([objectPath]);
  if (error) throw new Error(`Certificate delete failed: ${error.message}`);
}
