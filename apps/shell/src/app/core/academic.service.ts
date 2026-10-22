import { Injectable, inject } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.generated';
import { SupabaseService } from './supabase.service';
export type AcademicOption = Pick<Database['public']['Tables']['universities']['Row'], 'id' | 'name'>;
@Injectable({ providedIn: 'root' })
export class AcademicService {
  private readonly client = inject(SupabaseService).client as SupabaseClient<Database> | null;
  async search(
    table: 'universities' | 'campuses' | 'departments',
    text: string,
    universityId: string | null,
    signal: AbortSignal,
  ): Promise<AcademicOption[]> {
    if (!this.client) throw new Error('academic_unavailable');
    if (table !== 'universities' && !universityId) return [];
    void text;
    const rows: AcademicOption[] = [];
    for (let offset = 0; offset < 10000; offset += 500) {
      const query =
        table === 'universities'
          ? this.client.from('universities').select('id,name')
          : this.client.from(table).select('id,name').eq('university_id', universityId!);
      const result = await query
        .order('name')
        .order('id')
        .range(offset, offset + 499)
        .abortSignal(signal);
      if (result.error || !result.data) throw new Error('academic_unavailable');
      rows.push(...result.data);
      if (result.data.length < 500) return rows;
    }
    throw new Error('academic_catalog_too_large');
  }
  async usernameAvailable(value: string, signal: AbortSignal): Promise<boolean> {
    if (!this.client || !/^@?[a-zA-Z0-9_]{3,20}$/.test(value)) return false;
    const result = await this.client
      .rpc('kampusx_username_available', { p_username: value })
      .abortSignal(signal);
    if (result.error || typeof result.data !== 'boolean') throw new Error('username_check_unavailable');
    return result.data;
  }
  async assignedUsername(owner: string, signal: AbortSignal): Promise<string | null> {
    if (!this.client) return null;
    const result = await this.client
      .from('profiles')
      .select('username')
      .eq('user_id', owner)
      .abortSignal(signal)
      .maybeSingle();
    if (result.error) return null;
    return result.data?.username ?? null;
  }
}
