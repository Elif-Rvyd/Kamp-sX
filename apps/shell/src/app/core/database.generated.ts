export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
        };
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      bookmarks: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookmarks_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
      };
      campuses: {
        Row: {
          catalog_source: string | null;
          catalog_verified: boolean;
          id: string;
          name: string;
          name_key: string | null;
          university_id: string;
        };
        Insert: {
          catalog_source?: string | null;
          catalog_verified?: boolean;
          id?: string;
          name: string;
          name_key?: string | null;
          university_id: string;
        };
        Update: {
          catalog_source?: string | null;
          catalog_verified?: boolean;
          id?: string;
          name?: string;
          name_key?: string | null;
          university_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'campuses_university_id_fkey';
            columns: ['university_id'];
            isOneToOne: false;
            referencedRelation: 'universities';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          last_message_at: string | null;
          user_a: string;
          user_a_last_read_at: string | null;
          user_b: string;
          user_b_last_read_at: string | null;
        };
        Insert: {
          id?: string;
          last_message_at?: string | null;
          user_a: string;
          user_a_last_read_at?: string | null;
          user_b: string;
          user_b_last_read_at?: string | null;
        };
        Update: {
          id?: string;
          last_message_at?: string | null;
          user_a?: string;
          user_a_last_read_at?: string | null;
          user_b?: string;
          user_b_last_read_at?: string | null;
        };
        Relationships: [];
      };
      departments: {
        Row: {
          catalog_source: string | null;
          catalog_verified: boolean;
          id: string;
          name: string;
          name_key: string | null;
          university_id: string;
        };
        Insert: {
          catalog_source?: string | null;
          catalog_verified?: boolean;
          id?: string;
          name: string;
          name_key?: string | null;
          university_id: string;
        };
        Update: {
          catalog_source?: string | null;
          catalog_verified?: boolean;
          id?: string;
          name?: string;
          name_key?: string | null;
          university_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'departments_university_id_fkey';
            columns: ['university_id'];
            isOneToOne: false;
            referencedRelation: 'universities';
            referencedColumns: ['id'];
          },
        ];
      };
      faculties: {
        Row: {
          id: string;
          name: string;
          name_key: string | null;
          university_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_key?: string | null;
          university_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_key?: string | null;
          university_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'faculties_university_id_fkey';
            columns: ['university_id'];
            isOneToOne: false;
            referencedRelation: 'universities';
            referencedColumns: ['id'];
          },
        ];
      };
      follows: {
        Row: {
          created_at: string;
          follower_id: string;
          following_id: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
          status?: string;
        };
        Relationships: [];
      };
      likes: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'likes_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          sender_id: string;
          shared_post_id: string | null;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          sender_id: string;
          shared_post_id?: string | null;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          sender_id?: string;
          shared_post_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_shared_post_id_fkey';
            columns: ['shared_post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
      };
      posts: {
        Row: {
          archived_at: string | null;
          content: string | null;
          created_at: string;
          deleted_at: string | null;
          id: string;
          likes_count: number;
          media_type: string | null;
          media_url: string | null;
          parent_id: string | null;
          pinned_at: string | null;
          replies_count: number;
          repost_of_id: string | null;
          reposts_count: number;
          user_id: string | null;
          views_count: number;
        };
        Insert: {
          archived_at?: string | null;
          content?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          likes_count?: number;
          media_type?: string | null;
          media_url?: string | null;
          parent_id?: string | null;
          pinned_at?: string | null;
          replies_count?: number;
          repost_of_id?: string | null;
          reposts_count?: number;
          user_id?: string | null;
          views_count?: number;
        };
        Update: {
          archived_at?: string | null;
          content?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          likes_count?: number;
          media_type?: string | null;
          media_url?: string | null;
          parent_id?: string | null;
          pinned_at?: string | null;
          replies_count?: number;
          repost_of_id?: string | null;
          reposts_count?: number;
          user_id?: string | null;
          views_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'posts_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'posts_repost_of_id_fkey';
            columns: ['repost_of_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'posts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      profiles: {
        Row: {
          audience_configured: boolean;
          avatar_url: string | null;
          banner_url: string | null;
          bio: string | null;
          campus: string | null;
          campus_id: string | null;
          created_at: string;
          department_id: string | null;
          faculty_id: string | null;
          full_name: string | null;
          is_private: boolean;
          studying: string | null;
          university: string | null;
          university_id: string | null;
          user_id: string;
          username: string | null;
          visibility: string;
          visible_campus: boolean;
          visible_department: boolean;
          visible_explore: boolean;
          visible_university: boolean;
        };
        Insert: {
          audience_configured?: boolean;
          avatar_url?: string | null;
          banner_url?: string | null;
          bio?: string | null;
          campus?: string | null;
          campus_id?: string | null;
          created_at?: string;
          department_id?: string | null;
          faculty_id?: string | null;
          full_name?: string | null;
          is_private?: boolean;
          studying?: string | null;
          university?: string | null;
          university_id?: string | null;
          user_id: string;
          username?: string | null;
          visibility?: string;
          visible_campus?: boolean;
          visible_department?: boolean;
          visible_explore?: boolean;
          visible_university?: boolean;
        };
        Update: {
          audience_configured?: boolean;
          avatar_url?: string | null;
          banner_url?: string | null;
          bio?: string | null;
          campus?: string | null;
          campus_id?: string | null;
          created_at?: string;
          department_id?: string | null;
          faculty_id?: string | null;
          full_name?: string | null;
          is_private?: boolean;
          studying?: string | null;
          university?: string | null;
          university_id?: string | null;
          user_id?: string;
          username?: string | null;
          visibility?: string;
          visible_campus?: boolean;
          visible_department?: boolean;
          visible_explore?: boolean;
          visible_university?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_campus_id_fkey';
            columns: ['campus_id'];
            isOneToOne: false;
            referencedRelation: 'campuses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'departments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_faculty_id_fkey';
            columns: ['faculty_id'];
            isOneToOne: false;
            referencedRelation: 'faculties';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_university_id_fkey';
            columns: ['university_id'];
            isOneToOne: false;
            referencedRelation: 'universities';
            referencedColumns: ['id'];
          },
        ];
      };
      reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: string;
          post_id: string | null;
          reason: string;
          reported_user_id: string | null;
          reporter_id: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          details?: string | null;
          id?: string;
          post_id?: string | null;
          reason: string;
          reported_user_id?: string | null;
          reporter_id: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          details?: string | null;
          id?: string;
          post_id?: string | null;
          reason?: string;
          reported_user_id?: string | null;
          reporter_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
      };
      universities: {
        Row: {
          catalog_source: string | null;
          catalog_verified: boolean;
          id: string;
          name: string;
          name_key: string | null;
        };
        Insert: {
          catalog_source?: string | null;
          catalog_verified?: boolean;
          id?: string;
          name: string;
          name_key?: string | null;
        };
        Update: {
          catalog_source?: string | null;
          catalog_verified?: boolean;
          id?: string;
          name?: string;
          name_key?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      kampusx_account_contract_version: { Args: never; Returns: string };
      kampusx_follow_requests_version: { Args: never; Returns: string };
      kampusx_owner_actions_version: { Args: never; Returns: string };
      kampusx_reply_contract_version: { Args: never; Returns: string };
      kampusx_soft_delete_post: {
        Args: { p_post_id: string };
        Returns: boolean;
      };
      kampusx_username_available: {
        Args: { p_username: string };
        Returns: boolean;
      };
      kx_can_message: { Args: { other: string }; Returns: boolean };
      kx_get_post_views: {
        Args: { p_ids: string[] };
        Returns: {
          post_id: string;
          views_count: number;
        }[];
      };
      kx_inbox: {
        Args: never;
        Returns: {
          can_send: boolean;
          conversation_id: string;
          last_content: string;
          last_created_at: string;
          last_deleted_at: string;
          peer_avatar_url: string;
          peer_full_name: string;
          peer_id: string;
          peer_username: string;
          unread_count: number;
        }[];
      };
      kx_inbox_v2: {
        Args: never;
        Returns: {
          can_send: boolean;
          conversation_id: string;
          last_content: string;
          last_created_at: string;
          last_deleted_at: string;
          last_shared_post_id: string;
          peer_avatar_url: string;
          peer_full_name: string;
          peer_id: string;
          peer_username: string;
          unread_count: number;
        }[];
      };
      kx_mark_read: { Args: { conv: string }; Returns: boolean };
      kx_messaging_version: { Args: never; Returns: number };
      kx_record_post_views: {
        Args: { p_ids: string[] };
        Returns: {
          post_id: string;
          views_count: number;
        }[];
      };
      kx_registration_contract_version: { Args: never; Returns: string };
      kx_share_post: { Args: { conv: string; target: string }; Returns: string };
      kx_social_release_version: { Args: never; Returns: number };
      kx_start_conversation: { Args: { other: string }; Returns: string };
      kx_support_contract_version: { Args: never; Returns: string };
      kx_support_finish: {
        Args: {
          p_actor: string;
          p_fingerprint: string;
          p_outcome: string;
          p_request: string;
        };
        Returns: boolean;
      };
      kx_support_reserve: {
        Args: { p_actor: string; p_fingerprint: string; p_request: string };
        Returns: Json;
      };
      kx_support_status: {
        Args: { p_actor: string; p_request: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema['Tables'] & DefaultSchema['Views']) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
