import { type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { AlertTriangle, Ban, ChevronLeft, LogOut, Settings as SettingsIcon, Shield, User } from "lucide-react";
import { Navbar } from "../Navbar";
import { Button } from "../ui/button";
import { useAuth } from "../../context/AuthContext";

export function SettingsPanel({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm shadow-xl shadow-black/10">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-white/60">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function SettingsShell({
  note,
  children,
}: {
  note: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const isAccountPage = location.pathname === "/settings";
  const isPasswordPage = location.pathname === "/settings/password";
  const isDeleteAccountPage = location.pathname === "/settings/delete-account";
  const isBlockedUsersPage = location.pathname === "/settings/blocked-users";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navClass = (active: boolean) =>
    active
      ? "border-white/20 bg-white/15 text-white"
      : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white";

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-[#2E1065] via-[#581C87] to-[#1e1b4b] text-white font-sans">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
        <button
          onClick={() => navigate(-1)}
          className="group mb-6 flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                <SettingsIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight md:text-5xl">Settings</h1>
                <p className="mt-1 text-sm text-white/60">
                  Account and security controls aligned with the backend schema.
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
            {note}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                Sections
              </p>

              <div className="space-y-2">
                <Link
                  to="/settings"
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${navClass(isAccountPage)}`}
                  aria-current={isAccountPage ? "page" : undefined}
                >
                  <User className="h-4 w-4" />
                  Account
                </Link>
                <Link
                  to="/settings/password"
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${navClass(isPasswordPage)}`}
                  aria-current={isPasswordPage ? "page" : undefined}
                >
                  <Shield className="h-4 w-4" />
                  Password
                </Link>
                <Link
                  to="/settings/blocked-users"
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${navClass(isBlockedUsersPage)}`}
                  aria-current={isBlockedUsersPage ? "page" : undefined}
                >
                  <Ban className="h-4 w-4" />
                  Blocked Users
                </Link>
                <Link
                  to="/settings/delete-account"
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${navClass(isDeleteAccountPage)}`}
                  aria-current={isDeleteAccountPage ? "page" : undefined}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Delete account
                </Link>
              </div>
            </div>

            <section className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white">Sign out</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                End your current session on this device.
              </p>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="mt-4 rounded-2xl border-rose-300/25 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </section>
          </aside>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
