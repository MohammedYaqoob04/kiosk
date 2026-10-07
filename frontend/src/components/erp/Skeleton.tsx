interface SkeletonProps {
  rows?: number;
  className?: string;
}

export function Skeleton({ rows = 3, className = "" }: SkeletonProps) {
  return (
    <div aria-label="Loading" aria-busy="true" className={`grid gap-3 ${className}`} role="status">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="erp-surface h-20 border-border bg-secondary" />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}
