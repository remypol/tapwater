export default function PostcodeLoading() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-12 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 w-48 bg-surface-muted rounded mb-8" />

      {/* Score + Title area */}
      <div className="flex flex-col lg:flex-row gap-8 mb-12">
        <div className="w-48 h-48 rounded-full bg-surface-muted shrink-0 mx-auto lg:mx-0" />
        <div className="flex-1 space-y-4">
          <div className="h-8 w-64 bg-surface-muted rounded" />
          <div className="h-5 w-96 bg-surface-muted rounded" />
          <div className="h-5 w-80 bg-surface-muted rounded" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-surface-muted rounded-xl" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-48 bg-surface-muted rounded mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
