-- Table privileges for the `authenticated` role. RLS still filters rows on top.
-- Needed on projects where Supabase did not auto-grant privileges on new tables.
-- (anon touches no table directly — it only calls the SECURITY DEFINER stats function.)

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.balance_profiles  to authenticated;
grant select, insert, update, delete on public.balance_entries   to authenticated;
grant select, insert, delete         on public.balance_reactions to authenticated;
