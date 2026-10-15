export type PostKind = 'post' | 'reply' | 'retweet';
export interface SocialPost {
  id: string;
  kind: PostKind;
  text: string;
  createdAt: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  stats: { replies: number; retweets: number; likes: number; views: number };
}
export interface PostAuthor {
  fullName: string;
  username?: string;
  avatarUrl?: string;
}
export function profileInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return [words[0], words.length > 1 ? words.at(-1) : '']
    .map((word) => Array.from(word || '')[0] || '')
    .join('')
    .toLocaleUpperCase('tr-TR');
}
export function filterProfilePosts(posts: readonly SocialPost[], tab: number): readonly SocialPost[] {
  return tab === 1
    ? posts.filter((post) => post.kind === 'reply')
    : tab === 2
      ? posts.filter((post) => post.kind === 'retweet')
      : posts;
}
