import type { Database } from './database.generated';

/** Generated metadata, narrowed to actual writable message columns. Sender/time are trigger defaults. */
export type ReleaseDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables'> & {
    Tables: Omit<Database['public']['Tables'], 'messages'> & {
      messages: Omit<Database['public']['Tables']['messages'], 'Insert'> & {
        Insert: Pick<Database['public']['Tables']['messages']['Insert'], 'conversation_id' | 'content'>;
      };
    };
  };
};
export type ViewTotal = Database['public']['Functions']['kx_get_post_views']['Returns'][number];
