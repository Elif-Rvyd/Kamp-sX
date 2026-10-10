// Browser tests use an intercepted endpoint; no real Supabase project is contacted.
export const environment = {
  supabaseUrl: 'https://auth.kampusx.test',
  supabasePublishableKey: 'sb_publishable_test_key',
} as const;
