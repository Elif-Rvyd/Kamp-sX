import type { SocialPost } from '@kampusx/shared/util';
export interface Profile {
  id: string;
  fullName: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  university: string;
  faculty: string;
  department: string;
  joinedAt: string;
  followingCount: number;
  followersCount: number;
  postCount: number;
}
export type ProfilePost = SocialPost;
export interface ProfileUpdate {
  fullName: string;
  bio: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
}
export class ProfileError extends Error {
  constructor(readonly key: string) {
    super(key);
  }
}
