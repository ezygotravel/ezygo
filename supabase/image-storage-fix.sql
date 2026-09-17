-- EzyGo image serving repair
-- Safe to run once in Supabase SQL Editor.

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update set public = true;
