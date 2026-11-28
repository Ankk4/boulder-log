import { createElement, ReactElement } from 'react';
import { Dashboard, FitnessCenter, History, Settings, Timer } from '@mui/icons-material';

interface NavItem {
  label: string;
  to: string;
  icon: ReactElement;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', to: '/overview', icon: createElement(Dashboard) },
  { label: 'Session', to: '/session', icon: createElement(FitnessCenter) },
  { label: 'History', to: '/history', icon: createElement(History) },
  { label: 'Timer', to: '/workouts', icon: createElement(Timer) },
  { label: 'Settings', to: '/settings', icon: createElement(Settings) },
];

const isUnder = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

export const getNavIndex = (pathname: string): number | false => {
  if (isUnder(pathname, '/overview')) return 0;
  if (isUnder(pathname, '/sessions') || isUnder(pathname, '/history')) return 2;
  if (isUnder(pathname, '/session')) return 1;
  if (isUnder(pathname, '/workouts')) return 3;
  if (isUnder(pathname, '/settings')) return 4;
  return false;
};
