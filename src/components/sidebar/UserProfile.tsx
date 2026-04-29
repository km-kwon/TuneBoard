import { AlertCircle, CheckCircle2, ChevronUp, Loader2, LogIn, User } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStatus } from '@/hooks/useApi';

interface UserProfileProps {
  collapsed: boolean;
}

export function UserProfile({ collapsed }: UserProfileProps) {
  const { data, isError, isLoading } = useAuthStatus();
  const [starting, setStarting] = useState(false);

  const youtube = data?.youtube;
  const ytmusic = data?.ytmusic;
  const connected = !!youtube?.connected || !!ytmusic?.connected;
  const configured = !!youtube?.configured;
  const label = youtube?.connected
    ? youtube.channelTitle || 'YouTube connected'
    : ytmusic?.connected
      ? 'YouTube Music connected'
      : 'Guest';
  const subtitle = youtube?.connected
    ? 'Google OAuth active'
    : ytmusic?.connected
      ? 'Backend ytmusic auth active'
      : isError
        ? 'API offline'
        : configured
          ? 'Click to connect Google'
          : 'Set Google OAuth env';
  const disabled = isLoading || starting || (!connected && !configured);

  const handleClick = async () => {
    if (connected || disabled) return;
    setStarting(true);
    try {
      const { authUrl } = await api.startGoogleAuth();
      window.location.assign(authUrl);
    } catch {
      setStarting(false);
    }
  };

  const StatusIcon = starting || isLoading
    ? Loader2
    : connected
      ? CheckCircle2
      : isError || !configured
        ? AlertCircle
        : LogIn;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'group flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-surface-2/60 disabled:cursor-not-allowed disabled:opacity-70',
        collapsed && 'justify-center',
      )}
      aria-label={connected ? 'YouTube account connected' : 'Connect Google account'}
      title={collapsed ? subtitle : undefined}
    >
      <div
        className={cn(
          'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 ring-1 ring-white/[0.06] transition-shadow group-hover:ring-accent/30',
          connected && 'gradient-accent shadow-glow-sm',
        )}
      >
        <User className={cn('h-4 w-4 text-text-secondary', connected && 'text-text-onAccent')} />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface-1 ring-1 ring-white/[0.08]">
          <StatusIcon
            className={cn(
              'h-2.5 w-2.5',
              starting || isLoading
                ? 'animate-spin text-text-tertiary'
                : connected
                  ? 'text-accent'
                  : isError || !configured
                    ? 'text-hot'
                    : 'text-text-secondary',
            )}
          />
        </span>
      </div>
      {!collapsed && (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{label}</p>
            <p className="mt-0.5 truncate text-[11px] text-text-tertiary">{subtitle}</p>
          </div>
          {connected ? (
            <ChevronUp className="h-4 w-4 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
          ) : (
            <LogIn className="h-4 w-4 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </>
      )}
    </button>
  );
}
