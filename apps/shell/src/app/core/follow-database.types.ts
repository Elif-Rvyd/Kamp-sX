import type { Database } from './database.generated';

/** Part A consumes live-generated public types without changing unrelated services. */
// The additive RPC is defined by this changeset, pending migration deployment.
export type FollowDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Functions'> & {
    Functions: Database['public']['Functions'] & {
      kampusx_follow_requests_version: { Args: Record<string, never>; Returns: string };
    };
  };
};
export type FollowProfileRow = Database['public']['Tables']['profiles']['Row'];
export type FollowRow = Database['public']['Tables']['follows']['Row'];
