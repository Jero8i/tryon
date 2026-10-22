-- Run once in Supabase SQL Editor. No service-role key belongs in this app.
create table if not exists public.catalog_editors (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.catalog_editors enable row level security;
revoke all on public.catalog_editors from anon, authenticated;
grant select on public.catalog_editors to authenticated;
create policy "editor reads own membership" on public.catalog_editors
for select to authenticated using (user_id=(select auth.uid()));

create table if not exists public.tryon_frames (
  id text primary key check(id ~ '^[a-z0-9][a-z0-9-]{1,63}$'),
  status text not null default 'draft' check(status in ('draft','published')),
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  check(payload ?& array['id','frame','status']),
  check((payload->'frame') ?& array['id','name','image','dimensions']),
  check((payload->'frame'->'dimensions') ?& array['widthMm','templeMm']),
  check(payload->>'id'=id),
  check(payload->'frame'->>'id'=id),
  check(payload->>'status'=status),
  check(jsonb_typeof(payload->'frame')='object'),
  check(length(payload->'frame'->>'name') between 1 and 120),
  check(jsonb_typeof(payload->'frame'->'dimensions'->'widthMm')='number'),
  check((payload->'frame'->'dimensions'->>'widthMm')::numeric between 70 and 200),
  check(jsonb_typeof(payload->'frame'->'dimensions'->'templeMm')='number'),
  check((payload->'frame'->'dimensions'->>'templeMm')::numeric between 70 and 200)
);
alter table public.tryon_frames enable row level security;
revoke all on public.tryon_frames from anon, authenticated;
grant select on public.tryon_frames to anon;
grant select,insert,update on public.tryon_frames to authenticated;
create policy "public reads published frames" on public.tryon_frames
for select to anon,authenticated using(status='published');
create policy "editors read all frames" on public.tryon_frames
for select to authenticated using(exists(select 1 from public.catalog_editors where user_id=(select auth.uid())));
create policy "editors insert frames" on public.tryon_frames
for insert to authenticated with check(exists(select 1 from public.catalog_editors where user_id=(select auth.uid())));
create policy "editors update frames" on public.tryon_frames
for update to authenticated using(exists(select 1 from public.catalog_editors where user_id=(select auth.uid())))
with check(exists(select 1 from public.catalog_editors where user_id=(select auth.uid())));

-- Drafts are private and independent of the published snapshot.
create table if not exists public.tryon_drafts (like public.tryon_frames including all);
alter table public.tryon_drafts add constraint drafts_only check(status='draft');
alter table public.tryon_drafts enable row level security;
revoke all on public.tryon_drafts from anon, authenticated;
grant select,insert,update on public.tryon_drafts to authenticated;
create policy "editors read drafts" on public.tryon_drafts
for select to authenticated using(exists(select 1 from public.catalog_editors where user_id=(select auth.uid())));
create policy "editors insert drafts" on public.tryon_drafts
for insert to authenticated with check(exists(select 1 from public.catalog_editors where user_id=(select auth.uid())));
create policy "editors update drafts" on public.tryon_drafts
for update to authenticated using(exists(select 1 from public.catalog_editors where user_id=(select auth.uid())))
with check(exists(select 1 from public.catalog_editors where user_id=(select auth.uid())));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('tryon-assets','tryon-assets',true,10485760,array['image/png','image/jpeg','image/webp'])
on conflict(id) do nothing;
create policy "editors upload product photos" on storage.objects for insert to authenticated
with check(bucket_id='tryon-assets' and (storage.foldername(name))[1]=(select auth.uid())::text
and exists(select 1 from public.catalog_editors where user_id=(select auth.uid())));
-- No overwrite/delete permission: photo URLs are immutable; older photos remain as history.
-- Add authorized users after creating them in Authentication > Users:
-- insert into public.catalog_editors(user_id) values('USER-UUID-FROM-AUTH');
