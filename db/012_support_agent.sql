-- 012_support_agent.sql — Maddie, the public triage agent
--
-- Every conversation is logged in full. That is not analytics: if a user ever
-- claims they were given legal advice, the transcript is the only thing that
-- shows what was actually said. Keep it.

create table if not exists agent_conversations (
  id            uuid primary key default gen_random_uuid(),
  session_key   text not null,                 -- opaque client id, not a user id
  ip_hash       text,                          -- sha256(ip + salt), for rate limiting
  practice_area text,                          -- what Maddie settled on
  state         text,
  suburb_id     uuid references suburbs(id),
  urgency       text check (urgency in ('urgent','soon','planning')),
  outcome       text not null default 'open'
                check (outcome in ('open','shortlisted','enquiry','escalated','abandoned')),
  enquiry_id    uuid references enquiries(id),
  refused_count int not null default 0,        -- times she declined to give advice
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists agent_conv_session on agent_conversations(session_key);
create index if not exists agent_conv_created on agent_conversations(created_at desc);
create index if not exists agent_conv_outcome on agent_conversations(outcome);

create table if not exists agent_messages (
  id          uuid primary key default gen_random_uuid(),
  conv_id     uuid not null references agent_conversations(id) on delete cascade,
  role        text not null check (role in ('user','assistant','tool')),
  content     text not null,
  tool_name   text,
  flagged     boolean not null default false,  -- tripped a guardrail
  created_at  timestamptz not null default now()
);

create index if not exists agent_msg_conv on agent_messages(conv_id, created_at);
create index if not exists agent_msg_flagged on agent_messages(flagged) where flagged;

-- Firms Maddie actually put in front of someone. Referral attribution matters
-- commercially, and it is also the audit trail if a recommendation is ever
-- questioned.
create table if not exists agent_referrals (
  id         uuid primary key default gen_random_uuid(),
  conv_id    uuid not null references agent_conversations(id) on delete cascade,
  listing_id uuid not null references lawyers(id) on delete cascade,
  position   int not null,
  reason     text,
  clicked    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists agent_ref_conv on agent_referrals(conv_id);
create index if not exists agent_ref_listing on agent_referrals(listing_id);

create or replace function touch_agent_conversation() returns trigger as $$
begin
  update agent_conversations set updated_at = now() where id = new.conv_id;
  return new;
end $$ language plpgsql;

drop trigger if exists agent_msg_touch on agent_messages;
create trigger agent_msg_touch after insert on agent_messages
  for each row execute function touch_agent_conversation();

-- One referral row per firm per conversation (the route upserts on this).
create unique index if not exists agent_ref_unique on agent_referrals(conv_id, listing_id);
