export type FollowList = 'followers' | 'following' | 'requests';
export type FollowStatus = 'none' | 'pending' | 'accepted';
export type FollowAction = 'follow' | 'cancel' | 'unfollow' | 'accept' | 'reject' | 'remove';
export interface FollowPerson {
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  university: string;
  department: string;
  status: FollowStatus;
}
export interface FollowPeoplePage {
  people: readonly FollowPerson[];
  nextOffset: number;
  more: boolean;
}
