import { lazy, Suspense, type ComponentType } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { RouteFallback } from '@/components/common/RouteFallback';

const lazyPage = (loader: () => Promise<Record<string, ComponentType>>, key: string) =>
  lazy(() => loader().then((m) => ({ default: m[key] })));

const HomePage = lazyPage(() => import('@/pages/HomePage'), 'HomePage');
const SearchPage = lazyPage(() => import('@/pages/SearchPage'), 'SearchPage');
const LibraryPage = lazyPage(() => import('@/pages/LibraryPage'), 'LibraryPage');
const PlaylistPage = lazyPage(() => import('@/pages/PlaylistPage'), 'PlaylistPage');
const VideoPage = lazyPage(() => import('@/pages/VideoPage'), 'VideoPage');
const StatsPage = lazyPage(() => import('@/pages/StatsPage'), 'StatsPage');

const withSuspense = (node: React.ReactNode) => (
  <Suspense fallback={<RouteFallback />}>{node}</Suspense>
);

export const routes: RouteObject[] = [
  { path: '/', element: withSuspense(<HomePage />) },
  { path: '/search', element: withSuspense(<SearchPage />) },
  { path: '/library', element: withSuspense(<LibraryPage />) },
  { path: '/playlist/:id', element: withSuspense(<PlaylistPage />) },
  { path: '/video', element: withSuspense(<VideoPage />) },
  { path: '/stats', element: withSuspense(<StatsPage />) },
  { path: '*', element: <Navigate to="/" replace /> },
];
