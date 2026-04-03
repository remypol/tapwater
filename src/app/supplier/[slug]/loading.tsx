export default function SupplierLoading() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-12 animate-pulse">
      <div className="h-4 w-40 bg-surface-muted rounded mb-8" />
      <div className="h-8 w-64 bg-surface-muted rounded mb-3" />
      <div className="h-5 w-80 bg-surface-muted rounded mb-10" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-surface-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}
