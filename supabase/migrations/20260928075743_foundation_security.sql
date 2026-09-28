-- Sunny Magnet V2 security baseline.
-- Keep Supabase's auto-RLS event trigger, but prevent API roles from
-- invoking its SECURITY DEFINER helper directly through the Data API.
revoke all on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
