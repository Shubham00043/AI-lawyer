-- Enable pgvector extension for vector similarity search
create extension if not exists vector with schema public;

-- Create enum for user roles
create type user_role as enum ('clerk', 'lawyer', 'judge', 'admin');

-- Users table (extends auth.users from Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  first_name text,
  last_name text,
  role user_role not null default 'lawyer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Cases table
create table if not exists public.cases (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  case_number text,
  court_name text,
  judge_name text,
  plaintiff text,
  defendant text,
  filing_date date,
  status text default 'open',
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Documents table
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size integer not null,
  content_text text,
  summary text,
  embedding vector(1536), -- OpenAI embeddings vector
  metadata jsonb,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chat messages table
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references public.cases(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  user_id uuid references public.profiles(id) not null,
  role text not null, -- 'user' or 'assistant'
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Similar cases (for vector similarity search)
create table if not exists public.similar_cases (
  source_case_id uuid references public.cases(id) on delete cascade,
  similar_case_id uuid references public.cases(id) on delete cascade,
  similarity_score float not null,
  primary key (source_case_id, similar_case_id)
);

-- Create indexes for better performance
create index idx_documents_embedding on public.documents using ivfflat (embedding vector_cosine_ops);
create index idx_documents_case_id on public.documents(case_id);
create index idx_chat_messages_case_id on public.chat_messages(case_id);
create index idx_chat_messages_created_at on public.chat_messages(created_at);

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.documents enable row level security;
alter table public.chat_messages enable row level security;

-- Profiles policies
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Cases policies
create policy "Users can view cases they created or have access to"
  on public.cases for select
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.case_access 
      where case_id = cases.id and user_id = auth.uid()
    )
  );

create policy "Users can create cases"
  on public.cases for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update their own cases"
  on public.cases for update
  using (auth.uid() = created_by);

-- Documents policies
create policy "Users can view documents for cases they have access to"
  on public.documents for select
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.cases 
      where id = documents.case_id and created_by = auth.uid()
    )
  );

create policy "Users can upload documents"
  on public.documents for insert
  with check (auth.role() = 'authenticated');

-- Chat messages policies
create policy "Users can view their chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can send chat messages"
  on public.chat_messages for insert
  with check (auth.role() = 'authenticated');

-- Create a function to handle new user signups
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'lawyer')
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to search for similar documents using vector similarity
create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  file_name text,
  case_id uuid,
  case_title text,
  content_text text,
  summary text,
  similarity float
)
language sql stable
as $$
  select
    d.id,
    d.file_name,
    d.case_id,
    c.title as case_title,
    d.content_text,
    d.summary,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  join public.cases c on d.case_id = c.id
  where d.embedding is not null
  and 1 - (d.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
