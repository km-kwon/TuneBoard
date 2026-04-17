import { AnimatePresence, motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'tuneboard.install.dismissedAt';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const last = Number(localStorage.getItem(DISMISS_KEY) ?? '0');
      if (Date.now() - last < DISMISS_COOLDOWN_MS) return;
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    setEvt(null);
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.19, 1, 0.22, 1] }}
          className="pointer-events-auto fixed bottom-24 right-4 z-40 flex max-w-xs items-center gap-3 rounded-md border border-white/[0.06] bg-surface-2/95 p-3 shadow-3 backdrop-blur-xl md:bottom-28"
          role="dialog"
          aria-label="Install TuneBoard"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm gradient-accent shadow-glow-sm">
            <Download className="h-4 w-4 text-text-onAccent" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">Install TuneBoard</p>
            <p className="mt-0.5 text-xs text-text-secondary">Pin it to your home screen.</p>
          </div>
          <button
            onClick={install}
            className="shrink-0 rounded-sm bg-accent px-3 py-1.5 text-xs font-semibold text-text-onAccent transition-colors hover:bg-accent-400"
          >
            Install
          </button>
          <button
            onClick={dismiss}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-surface-3 hover:text-text-primary"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
