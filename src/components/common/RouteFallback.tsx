import { Skeleton } from './Skeleton';

export function RouteFallback() {
  return (
    <div className="h-full overflow-hidden px-4 pt-6 md:px-10 md:pt-8" aria-busy="true" aria-label="Loading page">
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="mb-8 h-10 w-80 max-w-full" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="aspect-square w-full rounded-md" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
