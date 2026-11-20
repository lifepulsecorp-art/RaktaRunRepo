-- A single normalized email can own only one account. The application also
-- checks for duplicates to return a friendly message; this index closes the
-- race between concurrent registrations and covers legacy casing/whitespace.
create unique index if not exists users_payload_email_unique_idx
  on public.users (lower(trim(payload->>'email')))
  where nullif(trim(payload->>'email'), '') is not null;
