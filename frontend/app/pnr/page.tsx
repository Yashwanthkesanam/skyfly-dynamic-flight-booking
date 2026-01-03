// FILE: app/pnr/page.tsx
import PNRLookup from '../../components/PNRLookup';

export default function PNRPage() {
  return (
    <div className="min-h-[60vh] flex items-start pt-16 justify-center bg-[var(--bg)] p-4 transition-colors">
      <div className="w-full max-w-lg">
        <PNRLookup />

        <div className="mt-8 text-center text-sm text-[var(--muted)]">
          <p>Enter your 6-character PNR code sent to your email/SMS.</p>
        </div>
      </div>
    </div>
  );
}
