create table if not exists public.blood_camps (like public.users including all);
create index if not exists blood_camps_payload_hospital_id_idx on public.blood_camps ((payload->>'hospitalId'));
alter table public.blood_camps enable row level security;
