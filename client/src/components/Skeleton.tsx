function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#E9ECF1] rounded-md ${className}`} />;
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#EEF0F3] p-6">
          <Block className="h-3 w-24 mb-4" />
          <Block className="h-7 w-14" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTableRows({
  rows = 6,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#EEF0F3] overflow-hidden">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid items-center gap-4 px-6 py-5 border-b border-[#F3F5F8] last:border-0"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Block key={c} className="h-4 w-4/5" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#EEF0F3] p-6 min-h-[220px]">
          <Block className="h-6 w-2/3 mb-3" />
          <Block className="h-3 w-1/2 mb-8" />
          <Block className="h-6 w-24 mb-4" />
          <Block className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}