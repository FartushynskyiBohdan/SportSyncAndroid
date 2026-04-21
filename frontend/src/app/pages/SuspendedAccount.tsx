import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';

interface SuspensionNotice {
  reason?: string;
  until?: string | null;
}

function readNotice(): SuspensionNotice {
  const raw = sessionStorage.getItem('suspension_notice');
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as SuspensionNotice;
  } catch {
    return {};
  }
}

function formatUntil(value?: string | null) {
  if (!value) {
    return 'until further notice';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'until further notice';
  }

  return date.toLocaleString();
}

export function SuspendedAccount() {
  const notice = readNotice();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#120724] via-[#1d1041] to-[#090d21] text-white">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-3xl items-center px-6 py-16">
        <section className="w-full rounded-[32px] border border-amber-400/20 bg-slate-950/80 p-8 shadow-2xl shadow-black/30 sm:p-12">
          <p className="text-sm uppercase tracking-[0.28em] text-amber-300/80">Account suspended</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">Your SportSync account is temporarily unavailable.</h1>
          <p className="mt-6 text-lg text-slate-300">
            Your login was accepted, but access is suspended while a moderation action is in effect.
          </p>

          <div className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Reason</p>
              <p className="mt-2 text-base text-white">{notice.reason || 'A moderation action is currently being reviewed on your account.'}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Access returns</p>
              <p className="mt-2 text-base text-white">{formatUntil(notice.until)}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
            >
              Back to login
            </Link>
            <Link
              to="/"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/10"
            >
              View public homepage
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
