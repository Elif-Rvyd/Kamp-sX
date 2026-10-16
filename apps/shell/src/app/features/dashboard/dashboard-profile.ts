import { profileInitials } from '@kampusx/shared/util';
import type { Profile } from '../../core/profile.model';

export interface DashboardProfile {
  handle: string;
  initials: string;
  school: string | null;
  department: string | null;
  fullName: string;
  avatarUrl?: string;
  followingCount: number | null;
  followersCount: number | null;
}

/** Metadata is display content only; it never grants permissions. */
export function dashboardProfile(profile: Profile): DashboardProfile {
  return {
    handle: `@${profile.username}`,
    initials: profileInitials(profile.fullName),
    school: profile.university || null,
    department: profile.department || null,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
    followingCount: profile.followingCount,
    followersCount: profile.followersCount,
  };
}
