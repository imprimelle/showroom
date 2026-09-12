import { Suspense } from "react";
import { ConfirmationContent } from "./ConfirmationContent";

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-[var(--color-bg-tertiary)] animate-pulse" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
