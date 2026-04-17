import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useRoutes } from 'react-router-dom';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { MobileTabBar } from '@/components/layout/MobileTabBar';
import { PlayerBar } from '@/components/player/PlayerBar';
import { NowPlayingView } from '@/components/player/NowPlayingView';
import { QueuePanel } from '@/components/player/QueuePanel';
import { SearchBar } from '@/components/topbar/SearchBar';
import { AmbientBackdrop } from '@/components/layout/AmbientBackdrop';
import { YouTubePlayerHost } from '@/components/layout/YouTubePlayerHost';
import { PulseToaster } from '@/components/common/PulseToaster';
import { InstallPrompt } from '@/components/common/InstallPrompt';
import { TrackAnnouncer } from '@/components/common/TrackAnnouncer';
import { routes } from '@/router/routes';
import { usePlayerStore } from '@/stores/playerStore';
import { useUIStore } from '@/stores/uiStore';

export function AppShell() {
  const routed = useRoutes(routes);
  const location = useLocation();
  const nowPlayingOpen = usePlayerStore((s) => s.nowPlayingOpen);
  const queueOpen = useUIStore((s) => s.panels.queue);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-surface-0 text-text-primary">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <AmbientBackdrop />
      <YouTubePlayerHost />

      <div className="relative z-10 flex min-h-0 flex-1">
        <Sidebar />

        <main id="main-content" tabIndex={-1} className="relative flex min-w-0 flex-1 flex-col focus:outline-none">
          <SearchBar />
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                className="h-full"
              >
                {routed}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>{queueOpen && <QueuePanel />}</AnimatePresence>
          </div>
        </main>
      </div>

      <PlayerBar />
      <MobileTabBar />

      <AnimatePresence>{nowPlayingOpen && <NowPlayingView />}</AnimatePresence>

      <PulseToaster />
      <InstallPrompt />
      <TrackAnnouncer />
    </div>
  );
}
