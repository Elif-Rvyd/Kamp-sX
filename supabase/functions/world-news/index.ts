import { createNewsHandler } from './handler.ts';
Deno.serve(
  createNewsHandler({
    fetch,
    env: {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
      SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY'),
      SUPABASE_PUBLISHABLE_KEYS: Deno.env.get('SUPABASE_PUBLISHABLE_KEYS'),
      NEWS_ALLOWED_ORIGINS: Deno.env.get('NEWS_ALLOWED_ORIGINS'),
    },
  }),
);
