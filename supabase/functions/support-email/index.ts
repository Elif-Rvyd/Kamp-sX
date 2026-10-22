import { createSupportHandler } from './handler.ts';

Deno.serve(
  createSupportHandler({
    fetch,
    env: {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
      SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY'),
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      SUPABASE_PUBLISHABLE_KEYS: Deno.env.get('SUPABASE_PUBLISHABLE_KEYS'),
      SUPABASE_SECRET_KEYS: Deno.env.get('SUPABASE_SECRET_KEYS'),
      RESEND_API_KEY: Deno.env.get('RESEND_API_KEY'),
      SUPPORT_FROM: Deno.env.get('SUPPORT_FROM'),
      SUPPORT_TO: Deno.env.get('SUPPORT_TO'),
      SUPPORT_ALLOWED_ORIGINS: Deno.env.get('SUPPORT_ALLOWED_ORIGINS'),
    },
  }),
);
