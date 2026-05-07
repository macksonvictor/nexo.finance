-- NEXO Finance PostgreSQL schema proposal
-- Phase: real financial data model
-- Scope: accounts, balances, transactions, credit cards, subscriptions and goals.
-- Security: do not store API keys, raw bank credentials, card PANs or personal secrets here.

create extension if not exists pgcrypto;
create extension if not exists citext;

do $$ begin
  create type account_type as enum (
    'checking',
    'savings',
    'cash',
    'investment',
    'wallet',
    'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type account_status as enum ('active', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type transaction_type as enum ('income', 'expense', 'transfer', 'adjustment');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type transaction_status as enum ('pending', 'posted', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type goal_status as enum ('active', 'paused', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type credit_card_status as enum ('active', 'archived', 'blocked');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type subscription_status as enum ('active', 'paused', 'cancelled', 'trialing');
exception when duplicate_object then null;
end $$;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email citext,
  name text,
  locale text not null default 'pt-BR',
  currency char(3) not null default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists financial_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  name text not null,
  type account_type not null default 'checking',
  institution_name text,
  currency char(3) not null default 'BRL',
  opening_balance numeric(14, 2) not null default 0,
  current_balance numeric(14, 2) not null default 0,
  status account_status not null default 'active',
  include_in_net_worth boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists account_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  account_id uuid not null references financial_accounts(id) on delete cascade,
  balance_date date not null,
  available_balance numeric(14, 2) not null default 0,
  current_balance numeric(14, 2) not null default 0,
  currency char(3) not null default 'BRL',
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  unique (account_id, balance_date, source)
);

create table if not exists credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  linked_account_id uuid references financial_accounts(id) on delete set null,
  name text not null,
  institution_name text,
  network text,
  last4 char(4),
  closing_day smallint check (closing_day between 1 and 31),
  due_day smallint check (due_day between 1 and 31),
  credit_limit numeric(14, 2) not null default 0,
  current_balance numeric(14, 2) not null default 0,
  available_limit numeric(14, 2) not null default 0,
  status credit_card_status not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists credit_card_statements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  credit_card_id uuid not null references credit_cards(id) on delete cascade,
  cycle_start_date date not null,
  cycle_end_date date not null,
  due_date date not null,
  total_amount numeric(14, 2) not null default 0,
  paid_amount numeric(14, 2) not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (credit_card_id, cycle_start_date, cycle_end_date)
);

create table if not exists budget_boxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  month_id char(7) not null,
  name text not null,
  category text,
  planned_amount numeric(14, 2) not null default 0,
  reserved_amount numeric(14, 2) not null default 0,
  spent_amount numeric(14, 2) not null default 0,
  sort_order integer not null default 0,
  color_token text,
  is_archived boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month_id, name)
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null,
  current_amount numeric(14, 2) not null default 0,
  deadline date,
  status goal_status not null default 'active',
  priority smallint not null default 3 check (priority between 1 and 5),
  linked_account_id uuid references financial_accounts(id) on delete set null,
  linked_box_id uuid references budget_boxes(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  account_id uuid references financial_accounts(id) on delete set null,
  credit_card_id uuid references credit_cards(id) on delete set null,
  statement_id uuid references credit_card_statements(id) on delete set null,
  box_id uuid references budget_boxes(id) on delete set null,
  goal_id uuid references goals(id) on delete set null,
  type transaction_type not null,
  status transaction_status not null default 'posted',
  description text not null,
  merchant_name text,
  category text,
  amount numeric(14, 2) not null,
  currency char(3) not null default 'BRL',
  transaction_date date not null,
  posted_at timestamptz,
  is_recurring boolean not null default false,
  external_id text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (account_id is not null or credit_card_id is not null)
);

create table if not exists transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  from_account_id uuid not null references financial_accounts(id) on delete restrict,
  to_account_id uuid not null references financial_accounts(id) on delete restrict,
  out_transaction_id uuid references transactions(id) on delete set null,
  in_transaction_id uuid references transactions(id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  currency char(3) not null default 'BRL',
  transfer_date date not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_account_id <> to_account_id)
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  account_id uuid references financial_accounts(id) on delete set null,
  credit_card_id uuid references credit_cards(id) on delete set null,
  name text not null,
  merchant_name text,
  category text,
  amount numeric(14, 2) not null check (amount >= 0),
  currency char(3) not null default 'BRL',
  billing_cycle text not null default 'monthly',
  next_charge_date date,
  status subscription_status not null default 'active',
  reminder_days_before smallint not null default 3,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscription_charges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  transaction_id uuid references transactions(id) on delete set null,
  charged_at date not null,
  amount numeric(14, 2) not null,
  status transaction_status not null default 'posted',
  created_at timestamptz not null default now()
);

create table if not exists ai_financial_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  month_id char(7),
  source text not null default 'python-core',
  summary text not null,
  risk_level text not null default 'low',
  rive_state text not null default 'idle',
  safe_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_financial_accounts_user on financial_accounts(user_id, status);
create index if not exists idx_account_balances_account_date on account_balances(account_id, balance_date desc);
create index if not exists idx_credit_cards_user on credit_cards(user_id, status);
create index if not exists idx_statements_card_due on credit_card_statements(credit_card_id, due_date desc);
create index if not exists idx_boxes_user_month on budget_boxes(user_id, month_id, is_archived);
create index if not exists idx_goals_user_status on goals(user_id, status, deadline);
create index if not exists idx_transactions_user_date on transactions(user_id, transaction_date desc);
create index if not exists idx_transactions_account_date on transactions(account_id, transaction_date desc);
create index if not exists idx_transactions_card_date on transactions(credit_card_id, transaction_date desc);
create index if not exists idx_transactions_box_date on transactions(box_id, transaction_date desc);
create index if not exists idx_transactions_external on transactions(user_id, external_id) where external_id is not null;
create index if not exists idx_subscriptions_user_status on subscriptions(user_id, status, next_charge_date);
create index if not exists idx_ai_memory_user_month on ai_financial_memory(user_id, month_id, created_at desc);
