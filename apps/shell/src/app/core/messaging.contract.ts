import type { ReleaseDatabase } from './social-release.contract';

export type MessageRow = ReleaseDatabase['public']['Tables']['messages']['Row'];
type GeneratedInbox = ReleaseDatabase['public']['Functions']['kx_inbox_v2']['Returns'][number];
// SQL function output nullability is absent from generated metadata; the LEFT JOIN can return null.
export type InboxRow = Omit<
  GeneratedInbox,
  | 'peer_username'
  | 'peer_full_name'
  | 'peer_avatar_url'
  | 'last_content'
  | 'last_created_at'
  | 'last_deleted_at'
  | 'last_shared_post_id'
> & {
  peer_username: string | null;
  peer_full_name: string | null;
  peer_avatar_url: string | null;
  last_content: string | null;
  last_created_at: string | null;
  last_deleted_at: string | null;
  last_shared_post_id: string | null;
};
// The generator cannot infer BEFORE INSERT trigger defaults. Narrow writable columns to the
// actual column grants; sender_id is required in the generated Insert but is filled by PostgreSQL.
export type MessagingDatabase = ReleaseDatabase;
