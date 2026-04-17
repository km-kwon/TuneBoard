import { Navigate, type RouteObject } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { SearchPage } from '@/pages/SearchPage';
import { LibraryPage } from '@/pages/LibraryPage';
import { PlaylistPage } from '@/pages/PlaylistPage';
import { VideoPage } from '@/pages/VideoPage';
import { StatsPage } from '@/pages/StatsPage';

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/search', element: <SearchPage /> },
  { path: '/library', element: <LibraryPage /> },
  { path: '/playlist/:id', element: <PlaylistPage /> },
  { path: '/video', element: <VideoPage /> },
  { path: '/stats', element: <StatsPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
];
