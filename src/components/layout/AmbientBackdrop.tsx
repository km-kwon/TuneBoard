/**
 * Subtle ambient color washes anchored to the viewport corners.
 * Pure decoration — pointer-events-none.
 */
export function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-accent/[0.07] blur-[140px] animate-pulse-glow" />
      <div className="absolute right-[-120px] top-1/3 h-[360px] w-[360px] rounded-full bg-hot/[0.05] blur-[140px]" />
      <div className="absolute bottom-[-120px] left-1/3 h-[300px] w-[300px] rounded-full bg-accent/[0.04] blur-[120px]" />
    </div>
  );
}
