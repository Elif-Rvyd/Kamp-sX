import type { User } from '@supabase/supabase-js';

export interface DashboardProfile {
  handle: string;
  initials: string;
  school: string | null;
  department: string | null;
}

/** Metadata is display content only; it never grants permissions. */
export function dashboardProfile(user: User | undefined, locale: string): DashboardProfile {
  const metadata = user?.user_metadata ?? {};
  const text = (value: unknown): string | null =>
    typeof value === 'string' && value.trim() ? value.trim() : null;
  const username = (text(metadata['username']) ?? user?.email?.split('@')[0] ?? '').replace(/^@+/, '');
  return {
    handle: username ? `@${username}` : '',
    initials: Array.from(username)[0]?.toLocaleUpperCase(locale === 'tr' ? 'tr-TR' : 'en-US') ?? '',
    school: text(metadata['university_name']) ?? text(metadata['school']),
    department: text(metadata['department_name']) ?? text(metadata['department']),
  };
}
