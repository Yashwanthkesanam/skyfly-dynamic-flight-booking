// FILE: components/Footer.tsx
export default function Footer() {
  return (
    <footer className="bg-[var(--surface)] border-t border-[var(--border)] py-8 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[var(--muted)]">
        &copy; {new Date().getFullYear()} FlySmart. All rights reserved.
      </div>
    </footer>
  );
}
