import type { TabStripItem } from '@kampusx/shared/ui';

export interface DiscoverFeed extends TabStripItem {
  headingKey: string;
  descriptionKey: string;
  scopeKey: string;
  icon: string;
}

export const DISCOVER_FEEDS: readonly DiscoverFeed[] = [
  {
    id: 'explore',
    labelKey: 'dashboard.tabs.explore',
    headingKey: 'dashboard.feeds.explore.title',
    descriptionKey: 'dashboard.feeds.explore.description',
    scopeKey: 'dashboard.mock.explore',
    icon: 'explore',
  },
  {
    id: 'university',
    labelKey: 'dashboard.tabs.university',
    headingKey: 'dashboard.feeds.university.title',
    descriptionKey: 'dashboard.feeds.university.description',
    scopeKey: 'dashboard.mock.school',
    icon: 'school',
  },
  {
    id: 'campus',
    labelKey: 'dashboard.tabs.campus',
    headingKey: 'dashboard.feeds.campus.title',
    descriptionKey: 'dashboard.feeds.campus.description',
    scopeKey: 'dashboard.mock.campus',
    icon: 'apartment',
  },
  {
    id: 'department',
    labelKey: 'dashboard.tabs.department',
    headingKey: 'dashboard.feeds.department.title',
    descriptionKey: 'dashboard.feeds.department.description',
    scopeKey: 'dashboard.mock.department',
    icon: 'code',
  },
];

export const PROFILE_MENU = [
  { id: 'profile', key: 'profile.drawer.profile', icon: 'person' },
  { id: 'community', key: 'profile.drawer.community', icon: 'groups' },
  { id: 'settings', key: 'profile.drawer.settings', icon: 'settings' },
  { id: 'help', key: 'profile.drawer.help', icon: 'help_outline' },
] as const;

export const BOTTOM_NAV = [
  { id: 'home', key: 'dashboard.nav.home', icon: null },
  { id: 'messages', key: 'dashboard.nav.messages', icon: 'chat_bubble' },
  { id: 'search', key: 'dashboard.nav.search', icon: 'search' },
] as const;

export const SKELETON_CARDS = ['first', 'second', 'third'] as const;
