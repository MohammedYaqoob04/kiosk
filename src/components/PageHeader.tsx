export function PageHeader({
  eyebrow = "Student ERP · Sample data",
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-6">
      <p className="text-lg text-muted-foreground">{eyebrow}</p>
      <h1 className="font-display text-3xl font-bold text-foreground">{title}</h1>
      {description && <p className="mt-2 text-lg text-muted-foreground">{description}</p>}
    </header>
  );
}
