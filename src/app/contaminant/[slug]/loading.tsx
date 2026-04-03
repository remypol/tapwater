export default function ContaminantLoading() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-12 animate-pulse">
      <div className="h-4 w-40 bg-surface-muted rounded mb-8" />
      <div className="h-8 w-72 bg-surface-muted rounded mb-3" />
      <div className="h-5 w-full max-w-xl bg-surface-muted rounded mb-3" />
      <div className="h-5 w-full max-w-lg bg-surface-muted rounded mb-10" />

      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
