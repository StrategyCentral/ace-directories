-- 016: single-use magic links.
-- /api/auth/request-link stores the link's jti here; /api/auth/callback marks
-- it used on the first click, so a forwarded or leaked link cannot be replayed.
create table if not exists auth_magic_links (
  jti        text primary key,
  email      text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at    timestamptz
);
create index if not exists auth_magic_links_expires on auth_magic_links (expires_at);
-- Server-only table: the service role bypasses RLS; anon/authenticated get nothing.
alter table auth_magic_links enable row level security;
