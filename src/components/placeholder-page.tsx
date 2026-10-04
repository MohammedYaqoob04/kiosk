export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl">{title}</h1>
      <section className="mt-8 max-w-2xl rounded-2xl border border-border bg-surface p-6 backdrop-blur-md sm:p-8">
        <h2 className="font-display text-2xl font-semibold text-foreground">Coming soon</h2>
        <p className="mt-3 text-lg text-muted-foreground">This page is being prepared.</p>
      </section>
    </div>
  );
}
