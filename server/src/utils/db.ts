import { getSupabase } from './supabase.js';

const TABLES: Record<string, string> = {
  users: 'users',
  hospitals: 'hospitals',
  donors: 'donors',
  bloodRequests: 'blood_requests',
  bloodCamps: 'blood_camps',
  matches: 'matches',
  auditLogs: 'audit_logs',
  buddyLinks: 'buddy_links',
  buddyReferrals: 'buddy_referrals',
  emailVerifications: 'email_verifications',
  blockedEmails: 'blocked_emails',
  systemConfig: 'system_config',
};

type PersistedRecord<T> = { record_key: string; payload: T };

function tableFor(collection: string): string {
  const normalized = collection.replace(/\.json$/i, '');
  const table = TABLES[normalized];
  if (!table) throw new Error(`Unknown database collection: ${collection}`);
  return table;
}

function recordKey(item: unknown): string {
  if (!item || typeof item !== 'object') throw new Error('Database records must be objects.');
  const value = item as Record<string, unknown>;
  const key = value.id ?? value.uid ?? value.email ?? 'default';
  return String(key);
}

async function selectAll<T>(table: string): Promise<PersistedRecord<T>[]> {
  const supabase = getSupabase();
  const records: PersistedRecord<T>[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select('record_key,payload')
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`Supabase read failed for ${table}: ${error.message}`);
    const page = (data || []) as PersistedRecord<T>[];
    records.push(...page);
    if (page.length < pageSize) return records;
  }
}

export async function readJson<T>(collection: string): Promise<T[]> {
  const rows = await selectAll<T>(tableFor(collection));
  return rows.map((row) => row.payload);
}

export async function writeJson<T>(collection: string, data: T[]): Promise<void> {
  const table = tableFor(collection);
  const supabase = getSupabase();
  const rows = data.map((payload) => ({ record_key: recordKey(payload), payload, updated_at: new Date().toISOString() }));
  const { error: deleteError } = await supabase.from(table).delete().neq('record_key', '__never_match__');
  if (deleteError) throw new Error(`Supabase clear failed for ${table}: ${deleteError.message}`);
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'record_key' });
  if (error) throw new Error(`Supabase write failed for ${table}: ${error.message}`);
}

export async function find<T>(collection: string, predicate: (item: T) => boolean): Promise<T | undefined> {
  return (await readJson<T>(collection)).find(predicate);
}

export async function filter<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]> {
  return (await readJson<T>(collection)).filter(predicate);
}

export async function insert<T>(collection: string, item: T): Promise<T> {
  const table = tableFor(collection);
  const { error } = await getSupabase().from(table).insert({
    record_key: recordKey(item),
    payload: item,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Supabase insert failed for ${table}: ${error.message}`);
  return item;
}

export async function update<T extends { id?: string; uid?: string; email?: string }>(
  collection: string,
  idOrUid: string,
  patch: Partial<T>
): Promise<T | null> {
  const table = tableFor(collection);
  const rows = await selectAll<T>(table);
  const row = rows.find(({ payload }) => payload.id === idOrUid || payload.uid === idOrUid || payload.email === idOrUid);
  if (!row) return null;

  const payload = { ...row.payload, ...patch, updatedAt: new Date().toISOString() };
  const { error } = await getSupabase().from(table).update({ payload, updated_at: new Date().toISOString() }).eq('record_key', row.record_key);
  if (error) throw new Error(`Supabase update failed for ${table}: ${error.message}`);
  return payload as T;
}

export async function remove<T extends { id?: string; uid?: string; email?: string }>(
  collection: string,
  idOrUid: string
): Promise<boolean> {
  const table = tableFor(collection);
  const rows = await selectAll<T>(table);
  const matchingKeys = rows
    .filter(({ payload }) => payload.id === idOrUid || payload.uid === idOrUid || payload.email === idOrUid)
    .map(({ record_key }) => record_key);
  if (matchingKeys.length === 0) return false;

  const { error } = await getSupabase().from(table).delete().in('record_key', matchingKeys);
  if (error) throw new Error(`Supabase delete failed for ${table}: ${error.message}`);
  return true;
}

export default { readJson, writeJson, find, filter, insert, update, remove };
