-- Migration: 004_api_grants.sql
-- Grant INSERT/UPDATE/DELETE on api views to anon and authenticated so PostgREST can write

GRANT INSERT ON api.users TO anon, authenticated;
GRANT UPDATE ON api.users TO anon, authenticated;
GRANT DELETE ON api.users TO anon, authenticated;

GRANT INSERT ON api.beers TO anon, authenticated;
GRANT UPDATE ON api.beers TO anon, authenticated;
GRANT DELETE ON api.beers TO anon, authenticated;

GRANT INSERT ON api.events TO anon, authenticated;
GRANT UPDATE ON api.events TO anon, authenticated;
GRANT DELETE ON api.events TO anon, authenticated;

GRANT INSERT ON api.achievements TO anon, authenticated;
GRANT UPDATE ON api.achievements TO anon, authenticated;
GRANT DELETE ON api.achievements TO anon, authenticated;

GRANT INSERT ON api.wall_of_fame TO anon, authenticated;
GRANT UPDATE ON api.wall_of_fame TO anon, authenticated;
GRANT DELETE ON api.wall_of_fame TO anon, authenticated;

GRANT INSERT ON api.toasts TO anon, authenticated;
GRANT UPDATE ON api.toasts TO anon, authenticated;
GRANT DELETE ON api.toasts TO anon, authenticated;
