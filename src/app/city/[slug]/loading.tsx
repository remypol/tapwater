export default function CityLoading() {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-8 lg:py-12 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 w-40 bg-surface-muted rounded mb-8" />

      {/* Title */}
      <div className="h-8 w-72 bg-surface-muted rounded mb-3" />
      <div className="h-5 w-96 bg-surface-muted rounded mb-10" />

      {/* Postcode grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-28 bg-surface-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}
