export default function Loading() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-border-default)] border-t-[var(--color-accent-amber)]" />
      <p className="text-sm font-medium text-[var(--color-text-secondary)]">Chargement…</p>
    </div>
  );
}
