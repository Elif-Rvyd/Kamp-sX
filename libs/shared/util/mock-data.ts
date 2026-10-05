export interface PostPreview {
  id: string;
  nameKey: string;
  handle: string;
  universityKey: string;
  avatar: string;
  type: 'photo' | 'video' | 'anonymous' | 'poll';
  textKey: string;
  likes: number;
  comments: number;
}
export interface CommunityPreview {
  id: string;
  nameKey: string;
  universityKey: string;
  icon: string;
  tone: string;
  members: number;
  tagKey: string;
}
export const HERO_POSTS: PostPreview[] = [
  {
    id: 'photo',
    nameKey: 'posts.photo.name',
    handle: '@deniz.jpg',
    universityKey: 'universities.itu',
    avatar: 'D',
    type: 'photo',
    textKey: 'posts.photo.text',
    likes: 248,
    comments: 18,
  },
  {
    id: 'anonymous',
    nameKey: 'posts.anonymous.name',
    handle: '@kampus_itiraf',
    universityKey: 'universities.metu',
    avatar: '👀',
    type: 'anonymous',
    textKey: 'posts.anonymous.text',
    likes: 386,
    comments: 42,
  },
  {
    id: 'poll',
    nameKey: 'posts.poll.name',
    handle: '@ece.codes',
    universityKey: 'universities.bogazici',
    avatar: 'E',
    type: 'poll',
    textKey: 'posts.poll.text',
    likes: 94,
    comments: 12,
  },
  {
    id: 'video',
    nameKey: 'posts.video.name',
    handle: '@mert.ses',
    universityKey: 'universities.hacettepe',
    avatar: 'M',
    type: 'video',
    textKey: 'posts.video.text',
    likes: 172,
    comments: 24,
  },
];
export const COMMUNITIES: CommunityPreview[] = [
  {
    id: 'code',
    nameKey: 'communities.items.code',
    universityKey: 'universities.itu',
    icon: 'terminal',
    tone: 'blue',
    members: 1240,
    tagKey: 'communities.tags.tech',
  },
  {
    id: 'robotics',
    nameKey: 'communities.items.robotics',
    universityKey: 'universities.metu',
    icon: 'smart_toy',
    tone: 'lavender',
    members: 860,
    tagKey: 'communities.tags.tech',
  },
  {
    id: 'photo',
    nameKey: 'communities.items.photo',
    universityKey: 'universities.bogazici',
    icon: 'photo_camera',
    tone: 'yellow',
    members: 642,
    tagKey: 'communities.tags.art',
  },
  {
    id: 'theatre',
    nameKey: 'communities.items.theatre',
    universityKey: 'universities.ankara',
    icon: 'theater_comedy',
    tone: 'coral',
    members: 480,
    tagKey: 'communities.tags.art',
  },
  {
    id: 'startup',
    nameKey: 'communities.items.startup',
    universityKey: 'universities.koc',
    icon: 'rocket_launch',
    tone: 'mint',
    members: 720,
    tagKey: 'communities.tags.business',
  },
  {
    id: 'music',
    nameKey: 'communities.items.music',
    universityKey: 'universities.hacettepe',
    icon: 'graphic_eq',
    tone: 'lavender',
    members: 930,
    tagKey: 'communities.tags.art',
  },
  {
    id: 'sport',
    nameKey: 'communities.items.sport',
    universityKey: 'universities.ege',
    icon: 'sports_basketball',
    tone: 'yellow',
    members: 1100,
    tagKey: 'communities.tags.life',
  },
  {
    id: 'volunteer',
    nameKey: 'communities.items.volunteer',
    universityKey: 'universities.istanbul',
    icon: 'volunteer_activism',
    tone: 'mint',
    members: 580,
    tagKey: 'communities.tags.life',
  },
];
